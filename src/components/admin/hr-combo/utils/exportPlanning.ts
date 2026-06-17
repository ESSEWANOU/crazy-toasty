/**
 * Export du planning au format PDF et CSV.
 * Reproduit la mise en page Combo (couleurs par site, colonnes jour/employé).
 */
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getShiftClass, durationHours, formatHM } from './siteColor';

interface Shift {
  id: string;
  employee_id: string;
  site_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  position: string | null;
  notes: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  weekly_hours: number | null;
}

interface Site {
  site_id: string;
  name: string;
}

interface ExportArgs {
  shifts: Shift[];
  employees: Employee[];
  sites: Site[];
  weekDays: Date[];
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
}

// Map combo shift class → RGB pour jsPDF (mêmes teintes que index.css)
// bg = corps de la tuile, label = bandeau supérieur saturé, fg = texte
const shiftRGB = (className: string): {
  bg: [number, number, number];
  label: [number, number, number];
  fg: [number, number, number];
  labelFg: [number, number, number];
} => {
  switch (className) {
    case 'combo-shift-cugnaux':
      // hsl(352 84% 72%) corps, hsl(352 84% 64%) bandeau
      return { bg: [241, 130, 145], label: [232, 90, 110], fg: [91, 24, 35], labelFg: [255, 255, 255] };
    case 'combo-shift-toulouse':
      // hsl(19 56% 76%) corps, hsl(19 56% 66%) bandeau
      return { bg: [225, 175, 152], label: [206, 142, 113], fg: [88, 56, 36], labelFg: [255, 255, 255] };
    case 'combo-shift-foodtruck':
      // hsl(158 40% 72%) corps, hsl(158 45% 58%) bandeau
      return { bg: [161, 213, 192], label: [108, 188, 156], fg: [27, 70, 56], labelFg: [255, 255, 255] };
    default:
      return { bg: [225, 228, 232], label: [195, 200, 208], fg: [55, 65, 75], labelFg: [40, 50, 60] };
  }
};

const empShiftHours = (s: Shift) => durationHours(s.start_time, s.end_time, s.break_minutes || 0);

export const exportPlanningPDF = ({ shifts, employees, sites, weekDays, weekStart, weekEnd, weekNumber }: ExportArgs) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  const siteName = (id: string) => sites.find(s => s.site_id === id)?.name || id;

  // ===== En-tête =====
  doc.setFillColor(26, 26, 26); // combo-ink
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Planning — Semaine ${weekNumber}`, margin, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${format(weekStart, 'd MMM', { locale: fr })} → ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`,
    pageWidth - margin,
    10,
    { align: 'right' }
  );

  // ===== Grille =====
  const tableTop = 22;
  const empColWidth = 48;
  const dayColWidth = (pageWidth - margin * 2 - empColWidth) / 7;
  const headerHeight = 10;

  // Dimensions tuile shift (calquées sur l'écran : label ~38%, body ~62%)
  const shiftLabelH = 4.2;     // bandeau supérieur (titre site)
  const shiftBodyH  = 5.8;     // corps (horaires)
  const shiftH      = shiftLabelH + shiftBodyH; // 10mm
  const shiftGap    = 1.2;     // espace entre 2 shifts empilés
  const cellPadV    = 1.5;     // padding haut/bas dans la cellule
  const minRowHeight = 22;     // hauteur mini ligne employé (en-tête + 1 shift)

  // Calcul hauteur de ligne par employé selon nb max de shifts/jour
  const computeRowHeight = (empId: string): number => {
    let maxShifts = 1;
    weekDays.forEach(d => {
      const n = shifts.filter(s => s.employee_id === empId && s.shift_date === format(d, 'yyyy-MM-dd')).length;
      if (n > maxShifts) maxShifts = n;
    });
    const needed = cellPadV * 2 + maxShifts * shiftH + Math.max(0, maxShifts - 1) * shiftGap;
    return Math.max(minRowHeight, needed);
  };

  // En-tête jours
  doc.setFillColor(244, 245, 247);
  doc.rect(margin, tableTop, pageWidth - margin * 2, headerHeight, 'F');
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`S. ${weekNumber}`, margin + 2, tableTop + 6);

  weekDays.forEach((d, i) => {
    const x = margin + empColWidth + i * dayColWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(110, 115, 120);
    doc.text(format(d, 'EEE', { locale: fr }).toUpperCase(), x + dayColWidth / 2, tableTop + 4, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.text(format(d, 'd', { locale: fr }), x + dayColWidth / 2, tableTop + 8.5, { align: 'center' });
  });

  // Lignes employés
  let y = tableTop + headerHeight;

  employees.forEach(emp => {
    const rowHeight = computeRowHeight(emp.id);

    if (y + rowHeight > pageHeight - 18) {
      doc.addPage();
      y = margin;
    }

    const empShifts = shifts.filter(s => s.employee_id === emp.id);
    const planned = empShifts.reduce((sum, s) => sum + empShiftHours(s), 0);
    const contractual = emp.weekly_hours || 35;
    const diff = planned - contractual;

    // Bordure haute de la ligne
    doc.setDrawColor(220, 222, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);

    // Colonne employé
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${emp.first_name} ${emp.last_name}`.toUpperCase(), margin + 2, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 115, 120);
    const diffStr = diff > 0 ? `+${formatHM(diff)}` : diff < 0 ? formatHM(diff) : '0h';
    doc.text(`${contractual}h | ${formatHM(planned)} | ${diffStr}`, margin + 2, y + 10);

    // Cellules jours
    weekDays.forEach((d, i) => {
      const x = margin + empColWidth + i * dayColWidth;
      // Bordure verticale gauche
      doc.setDrawColor(230, 232, 235);
      doc.line(x, y, x, y + rowHeight);

      const dayShifts = shifts.filter(s => s.employee_id === emp.id && s.shift_date === format(d, 'yyyy-MM-dd'));
      let blockY = y + cellPadV;
      const blockW = dayColWidth - 2;

      dayShifts.forEach(s => {
        const colors = shiftRGB(getShiftClass(siteName(s.site_id)));
        const r = 1.2; // rayon des coins arrondis

        // 1) Corps complet arrondi (couleur claire)
        doc.setFillColor(...colors.bg);
        doc.roundedRect(x + 1, blockY, blockW, shiftH, r, r, 'F');

        // 2) Bandeau supérieur saturé : rectangle arrondi + masque rectangulaire en bas
        //    pour ne garder que les coins arrondis du haut.
        doc.setFillColor(...colors.label);
        doc.roundedRect(x + 1, blockY, blockW, shiftLabelH, r, r, 'F');
        // Masque pour aplatir le bas du bandeau (avec la couleur du bandeau)
        doc.setFillColor(...colors.label);
        doc.rect(x + 1, blockY + shiftLabelH - r, blockW, r, 'F');

        // 3) Texte du label (centré verticalement dans le bandeau)
        doc.setTextColor(...colors.labelFg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.6);
        // baseline ≈ labelH/2 + 0.9 pour helvetica 5.6pt
        const labelTextY = blockY + shiftLabelH / 2 + 1;
        // Tronque selon la largeur disponible (≈ 1.4mm/char à 5.6pt bold)
        const maxChars = Math.floor((blockW - 2) / 1.4);
        const labelText = siteName(s.site_id).toUpperCase().slice(0, maxChars);
        doc.text(labelText, x + 2, labelTextY);

        // 4) Horaires (centrés verticalement dans le corps)
        doc.setTextColor(...colors.fg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const bodyTextY = blockY + shiftLabelH + shiftBodyH / 2 + 1.2;
        doc.text(`${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`, x + 2, bodyTextY);

        blockY += shiftH + shiftGap;
      });
    });

    // Bordure droite finale
    doc.line(pageWidth - margin, y, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  // Trait final
  doc.setDrawColor(200, 205, 210);
  doc.line(margin, y, pageWidth - margin, y);

  // ===== Légende sites =====
  const legendY = pageHeight - 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(110, 115, 120);
  doc.text('SITES :', margin, legendY);
  let lx = margin + 12;
  sites.forEach(s => {
    const colors = shiftRGB(getShiftClass(s.name));
    doc.setFillColor(...colors.bg);
    doc.roundedRect(lx, legendY - 3.5, 3.5, 3.5, 0.6, 0.6, 'F');
    doc.setTextColor(...colors.fg);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(s.name, lx + 4.5, legendY - 0.8);
    lx += doc.getTextWidth(s.name) + 12;
  });

  doc.save(`planning-S${weekNumber}-${format(weekStart, 'yyyy-MM-dd')}.pdf`);
};

export const exportPlanningCSV = ({ shifts, employees, sites, weekDays, weekStart, weekNumber }: ExportArgs) => {
  const siteName = (id: string) => sites.find(s => s.site_id === id)?.name || id;

  const headers = [
    'Employé',
    'Contrat (h/sem)',
    ...weekDays.map(d => format(d, 'EEE dd/MM', { locale: fr })),
    'Total planifié',
    'Diff. contrat',
  ];

  const rows = employees.map(emp => {
    const dailyCells = weekDays.map(d => {
      const dayShifts = shifts.filter(s => s.employee_id === emp.id && s.shift_date === format(d, 'yyyy-MM-dd'));
      return dayShifts
        .map(s => `${siteName(s.site_id)} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
        .join(' | ');
    });
    const planned = shifts
      .filter(s => s.employee_id === emp.id)
      .reduce((sum, s) => sum + empShiftHours(s), 0);
    const contract = emp.weekly_hours || 35;
    const diff = planned - contract;
    return [
      `${emp.first_name} ${emp.last_name}`,
      String(contract),
      ...dailyCells,
      formatHM(planned),
      diff > 0 ? `+${formatHM(diff)}` : diff < 0 ? formatHM(diff) : '0h',
    ];
  });

  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    `Planning Semaine ${weekNumber}`,
    headers.map(escape).join(';'),
    ...rows.map(r => r.map(escape).join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `planning-S${weekNumber}-${format(weekStart, 'yyyy-MM-dd')}.csv`);
};
