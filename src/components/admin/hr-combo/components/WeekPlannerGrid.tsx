import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, X, Trash2, Loader2, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShiftRow {
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

interface EmployeeRow {
  id: string;
  first_name: string;
  last_name: string;
}

type LocalShiftEdit = Partial<Pick<ShiftRow, 'start_time' | 'end_time' | 'notes'>>;

interface SiteRow {
  site_id: string;
  name: string;
}

export interface WeekPlannerGridProps {
  weekDays: Date[];
  shifts: ShiftRow[];
  employees: EmployeeRow[];
  loading: boolean;
  siteId: string;
  onRefresh: () => void;
  employeeSites?: Record<string, string[]>;
  sites?: SiteRow[];
}

// ─── Timeline constants ───────────────────────────────────────────────────────

const TIMELINE_START   = 11 * 60;
const TIMELINE_END     = 23 * 60;
const TIMELINE_RANGE   = TIMELINE_END - TIMELINE_START;
const MIN_SHIFT_MINS   = 15;
const DEFAULT_COL_W    = 220;

const tickStep = (colW: number): number => colW < 220 ? 4 : colW < 320 ? 2 : 1;
const buildTicks = (step: number) =>
  Array.from({ length: Math.floor(12 / step) + 1 }, (_, i) => `${11 + i * step}h`);
const buildHourLines = (step: number) =>
  Array.from({ length: Math.floor(12 / step) - 1 }, (_, i) => ((i + 1) / (12 / step)) * 100);

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = [
  '#1D4ED8', '#065F46', '#92400E', '#991B1B',
  '#5B21B6', '#9D174D', '#0E7490', '#3F6212',
  '#C2410C', '#3730A3', '#0F766E', '#7E22CE',
];

const COLORS_KEY = 'bp_planner_emp_colors';
const SHOWN_KEY  = 'bp_planner_shown_ids';
const ORDER_KEY  = 'bp_planner_emp_order';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeToMins = (t: string): number => {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (m: number): string => {
  const h   = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

const hexContrast = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#111827' : '#ffffff';
};

const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const shiftLabel = (s: number, e: number, notes: string | null) =>
  `${minsToTime(s)}–${minsToTime(e)}${notes ? ' · ' + notes : ''}`;

// ─── Component ────────────────────────────────────────────────────────────────

const WeekPlannerGrid = ({
  weekDays,
  shifts,
  employees,
  loading,
  siteId,
  onRefresh,
  employeeSites = {},
  sites = [],
}: WeekPlannerGridProps) => {

  // Employee colors (localStorage)
  const [empColors, setEmpColors] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>(COLORS_KEY, {}),
  );

  // Which employees to show (null = all)
  const [shownIds, setShownIds] = useState<string[] | null>(() =>
    loadJson<string[] | null>(SHOWN_KEY, null),
  );

  const [colorFor, setColorFor]     = useState<string | null>(null);
  const [addEmpOpen, setAddEmpOpen] = useState(false);

  // ── Employee row drag-to-reorder ───────────────────────────────────────────
  const [empOrder, setEmpOrder] = useState<string[]>(() =>
    loadJson<string[]>(ORDER_KEY, []),
  );
  const dragEmpRef   = useRef<string | null>(null); // id being dragged
  const [dragOver, setDragOver] = useState<string | null>(null); // id being hovered over

  // Inline shift popup
  const [popupShift, setPopupShift]   = useState<ShiftRow | null>(null);
  const [popupStart, setPopupStart]   = useState('');
  const [popupEnd, setPopupEnd]       = useState('');
  const [popupNote, setPopupNote]     = useState('');
  const [popupSaving, setPopupSaving] = useState(false);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const [dayColWidth, setDayColWidth] = useState(DEFAULT_COL_W);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setDayColWidth(prev => Math.round(clamp(prev * factor, 120, 480)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomPct        = Math.round((dayColWidth / DEFAULT_COL_W) * 100);
  const step           = tickStep(dayColWidth);
  const TICKS          = buildTicks(step);
  const HOUR_LINES_PCT = buildHourLines(step);

  // ── Drag (direct DOM — zero React re-renders during move) ─────────────────
  const shiftBarRefs  = useRef<Map<string, HTMLElement>>(new Map());
  const activeDragRef = useRef<{
    shiftId: string;
    mode: 'move' | 'left' | 'right';
    startX: number;
    origStart: number;
    origEnd: number;
    notes: string | null;
    cellWidth: () => number; // live getter so zoom changes during drag work
  } | null>(null);
  const draftValRef = useRef<{ shiftId: string; startMins: number; endMins: number } | null>(null);

  // Only used post-drag (while Supabase save is in flight) so bar doesn't snap back
  const [savingDraft, setSavingDraft] = useState<{
    shiftId: string; startMins: number; endMins: number
  } | null>(null);
  const [localShiftEdits, setLocalShiftEdits] = useState<Record<string, LocalShiftEdit>>({});

  useEffect(() => {
    setLocalShiftEdits(prev => {
      let changed = false;
      const next = { ...prev };

      shifts.forEach(shift => {
        const local = next[shift.id];
        if (!local) return;

        const startMatches = !local.start_time || local.start_time === shift.start_time;
        const endMatches = !local.end_time || local.end_time === shift.end_time;
        const notesMatches = !('notes' in local) || local.notes === shift.notes;

        if (startMatches && endMatches && notesMatches) {
          delete next[shift.id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [shifts]);

  // ── Quick-create shift (3h default) ───────────────────────────────────────

  const [creating, setCreating] = useState<string | null>(null); // key = empId+date

  const createShift = useCallback(async (empId: string, dateStr: string, dayShifts: ShiftRow[]) => {
    if (!siteId) return;
    const key = empId + dateStr;
    if (creating === key) return;
    setCreating(key);
    // Start after last shift of the day, or at 11:00
    const lastEnd = dayShifts.reduce((max, s) => {
      const e = timeToMins(s.end_time);
      return e > max ? e : max;
    }, TIMELINE_START);
    const startMins = Math.min(lastEnd, TIMELINE_END - 180);
    const endMins   = Math.min(startMins + 180, TIMELINE_END);
    const { error } = await supabase.from('shifts').insert({
      employee_id:   empId,
      site_id:       siteId,
      shift_date:    dateStr,
      start_time:    minsToTime(startMins) + ':00',
      end_time:      minsToTime(endMins)   + ':00',
      break_minutes: 0,
      position:      null,
      notes:         null,
    });
    if (error) toast.error('Erreur création shift');
    else onRefresh();
    setCreating(null);
  }, [siteId, creating, onRefresh]);

  // ── Color helpers ──────────────────────────────────────────────────────────

  const getColor = useCallback(
    (empId: string): string => {
      if (empColors[empId]) return empColors[empId];
      const idx = employees.findIndex(e => e.id === empId);
      return PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
    },
    [empColors, employees],
  );

  const saveColor = (empId: string, color: string) => {
    const next = { ...empColors, [empId]: color };
    setEmpColors(next);
    localStorage.setItem(COLORS_KEY, JSON.stringify(next));
    setColorFor(null);
  };

  // ── Shown employees ────────────────────────────────────────────────────────

  const visibleEmployees = useMemo(() => {
    const base = shownIds ? employees.filter(e => shownIds.includes(e.id)) : employees;
    if (empOrder.length === 0) return base;
    const ordered = [...base].sort((a, b) => {
      const ia = empOrder.indexOf(a.id);
      const ib = empOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return ordered;
  }, [employees, shownIds, empOrder]);

  const notShownEmployees = useMemo(
    () => (shownIds ? employees.filter(e => !shownIds.includes(e.id)) : []),
    [employees, shownIds],
  );

  const addEmployee = (empId: string) => {
    const base = shownIds ?? employees.map(e => e.id);
    const next = [...base, empId];
    setShownIds(next);
    localStorage.setItem(SHOWN_KEY, JSON.stringify(next));
    setAddEmpOpen(false);
  };

  const removeEmployee = (empId: string) => {
    const base = shownIds ?? employees.map(e => e.id);
    const next = base.filter(id => id !== empId);
    setShownIds(next);
    localStorage.setItem(SHOWN_KEY, JSON.stringify(next));
  };

  const resetToAll = () => {
    setShownIds(null);
    localStorage.removeItem(SHOWN_KEY);
  };

  // ── Inline popup ───────────────────────────────────────────────────────────

  const openPopup = (shift: ShiftRow) => {
    const local = localShiftEdits[shift.id];
    setPopupShift(shift);
    setPopupStart((local?.start_time ?? shift.start_time).slice(0, 5));
    setPopupEnd((local?.end_time ?? shift.end_time).slice(0, 5));
    setPopupNote((local?.notes ?? shift.notes) ?? '');
  };

  const savePopup = async () => {
    if (!popupShift) return;
    setPopupSaving(true);
    const { error } = await supabase
      .from('shifts')
      .update({
        start_time: popupStart + ':00',
        end_time:   popupEnd   + ':00',
        notes:      popupNote.trim() || null,
      })
      .eq('id', popupShift.id);
    if (error) {
      console.error('Shift save error', error);
    } else {
      setLocalShiftEdits(prev => ({
        ...prev,
        [popupShift.id]: {
          ...prev[popupShift.id],
          start_time: popupStart + ':00',
          end_time: popupEnd + ':00',
          notes: popupNote.trim() || null,
        },
      }));
      setPopupShift(null);
    }
    setPopupSaving(false);
  };

  const deleteShiftById = async (id: string) => {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) toast.error('Erreur suppression');
    else { toast.success('Shift supprimé'); setPopupShift(null); onRefresh(); }
  };

  // ── Drag handler ────────────────────────────────────────────────────────────
  //
  // Strategy: during mousemove, mutate the DOM directly (no setState) for
  // perfectly smooth motion. On mouseup, store the final value in savingDraft
  // (1 React re-render) while the Supabase write completes, then clear it.

  const startShiftDrag = (
    e: React.MouseEvent,
    shift: ShiftRow,
    mode: 'move' | 'left' | 'right',
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget as HTMLElement;
    const barEl = (targetEl.dataset.shiftBar === 'true'
      ? targetEl
      : targetEl.closest('[data-shift-bar="true"]')) as HTMLElement | null;
    const cellEl = barEl?.parentElement;
    if (!barEl || !cellEl) return;
    const local = localShiftEdits[shift.id];
    const startTime = local?.start_time ?? shift.start_time;
    const endTime = local?.end_time ?? shift.end_time;
    const notes = local && 'notes' in local ? local.notes ?? null : shift.notes;

    activeDragRef.current = {
      shiftId:   shift.id,
      mode,
      startX:    e.clientX,
      origStart: timeToMins(startTime),
      origEnd:   timeToMins(endTime),
      notes,
      // live getter: cell width may change if user zooms while dragging
      cellWidth: () => cellEl.getBoundingClientRect().width,
    };

    let hasMoved = false;

    const snap5 = (m: number) => Math.round(m / 5) * 5;

    const calcTimes = (clientX: number) => {
      const d = activeDragRef.current!;
      const deltaX    = clientX - d.startX;
      const cw        = d.cellWidth();
      const deltaMins = snap5(Math.round((deltaX / cw) * TIMELINE_RANGE));
      const dur       = d.origEnd - d.origStart;
      let s  = d.origStart;
      let en = d.origEnd;

      if (d.mode === 'move') {
        s  = clamp(snap5(d.origStart + deltaMins), TIMELINE_START, TIMELINE_END - dur);
        en = s + dur;
      } else if (d.mode === 'left') {
        s  = clamp(snap5(d.origStart + deltaMins), TIMELINE_START, d.origEnd - MIN_SHIFT_MINS);
        en = d.origEnd;
      } else {
        s  = d.origStart;
        en = clamp(snap5(d.origEnd + deltaMins), d.origStart + MIN_SHIFT_MINS, TIMELINE_END);
      }
      return { s, en };
    };

    const applyToDOM = (s: number, en: number) => {
      const el = shiftBarRefs.current.get(shift.id);
      if (!el) return;
      const leftPct  = Math.max(0, ((s  - TIMELINE_START) / TIMELINE_RANGE) * 100);
      const widthPct = Math.max(2,  ((en - s)             / TIMELINE_RANGE) * 100);
      el.style.left   = `calc(${leftPct}% + 2px)`;
      el.style.width  = `calc(${widthPct}% - 4px)`;
      el.style.zIndex = '10';
      const label = el.querySelector<HTMLElement>('p');
      if (label) label.textContent = shiftLabel(s, en, shift.notes);
    };

    const onMove = (me: MouseEvent) => {
      if (!activeDragRef.current) return;
      const deltaX = me.clientX - activeDragRef.current.startX;
      if (Math.abs(deltaX) > 1) {
        if (!hasMoved) {
          hasMoved = true;
          document.body.style.cursor     = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }
      if (!hasMoved) return;

      const { s, en } = calcTimes(me.clientX);
      applyToDOM(s, en);
      draftValRef.current = { shiftId: shift.id, startMins: s, endMins: en };
    };

    const onUp = async () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';

      activeDragRef.current = null;

      if (!hasMoved) {
        // Pure click → open popup
        draftValRef.current = null;
        openPopup(shift);
        return;
      }

      const latest = draftValRef.current;
      draftValRef.current = null;
      if (!latest) return;
      if (latest.startMins === timeToMins(shift.start_time) &&
          latest.endMins   === timeToMins(shift.end_time)) return;

      // Keep bar at dragged position while save is in flight
      setSavingDraft({ shiftId: shift.id, startMins: latest.startMins, endMins: latest.endMins });

      const nextStartTime = minsToTime(latest.startMins) + ':00';
      const nextEndTime = minsToTime(latest.endMins) + ':00';

      const { error } = await supabase
        .from('shifts')
        .update({
          start_time: nextStartTime,
          end_time:   nextEndTime,
        })
        .eq('id', shift.id);

      if (error) {
        setSavingDraft(null);
        console.error('Shift drag update error', error);
        // DOM will re-sync on next render (shift data unchanged)
      } else {
        setLocalShiftEdits(prev => ({
          ...prev,
          [shift.id]: {
            ...prev[shift.id],
            start_time: nextStartTime,
            end_time: nextEndTime,
          },
        }));
        setSavingDraft(null);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  };

  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="combo-card p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  const colTemplate = `200px repeat(7, minmax(${dayColWidth}px, 1fr))`;
  const gridMinW    = 200 + 7 * dayColWidth;

  return (
    <>
      {/* ── Main grid ── */}
      <div ref={cardRef} className="combo-card overflow-hidden w-full min-w-0" title="Alt + molette pour zoomer">
        {/* Zoom toolbar */}
        <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-4 py-2.5">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Vue calendrier</span>
          <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[hsl(var(--muted-foreground))]">
            {zoomPct}%
          </span>
          <div className="flex flex-1 items-center gap-2 max-w-xs ml-auto">
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Compact</span>
            <input
              type="range"
              min={120}
              max={480}
              step={10}
              value={dayColWidth}
              onChange={e => setDayColWidth(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[hsl(var(--combo-green,161_51%_25%))]"
              aria-label="Zoom de la vue calendrier"
            />
            <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Large</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: gridMinW }}>

            {/* Column headers */}
            <div
              className="grid border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {/* Staff header */}
              <div className="p-2.5 flex items-center gap-1.5 border-r border-[hsl(var(--border))]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex-1">
                  Équipe
                </span>
              </div>

              {/* Day headers with 11h–23h ruler */}
              {weekDays.map((d, i) => {
                const isToday = isSameDay(d, new Date());
                return (
                  <div key={i} className={cn('border-l border-[hsl(var(--border))]', isToday && 'combo-day-today')}>
                    <div className="px-2 pt-2 pb-0.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide truncate text-[hsl(var(--foreground))]">
                        {step >= 4 ? format(d, 'EEE', { locale: fr }) : format(d, 'EEEE', { locale: fr })}
                      </p>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                        {format(d, 'd')}
                      </p>
                    </div>
                    <div className="relative h-4 mx-1 mb-1 pointer-events-none">
                      {TICKS.map((h, i) => {
                        const isFirst = i === 0;
                        const isLast  = i === TICKS.length - 1;
                        return (
                          <span
                            key={h}
                            className="absolute bottom-0 text-[9px] font-semibold leading-none tabular-nums"
                            style={{
                              left:      isLast  ? undefined : `${(i / (TICKS.length - 1)) * 100}%`,
                              right:     isLast  ? 0 : undefined,
                              transform: isFirst || isLast ? 'none' : 'translateX(-50%)',
                              color: 'hsl(var(--foreground) / 0.8)',
                            }}
                          >
                            {h}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Employee rows */}
            {visibleEmployees.length === 0 ? (
              <div className="py-14 text-center text-[hsl(var(--muted-foreground))]">
                <p className="mb-3 text-sm">Aucun employé dans la vue.</p>
                <button
                  onClick={() => setAddEmpOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  style={{ color: 'hsl(var(--combo-green))' }}
                >
                  <Plus className="w-4 h-4" /> Ajouter un employé
                </button>
              </div>
            ) : (
              visibleEmployees.map(emp => {
                const color = getColor(emp.id);
                const tc    = hexContrast(color);
                const isDraggedOver = dragOver === emp.id && dragEmpRef.current !== emp.id;
                return (
                  <div
                    key={emp.id}
                    draggable
                    onDragStart={() => { dragEmpRef.current = emp.id; }}
                    onDragOver={e => { e.preventDefault(); setDragOver(emp.id); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => {
                      const from = dragEmpRef.current;
                      dragEmpRef.current = null;
                      setDragOver(null);
                      if (!from || from === emp.id) return;
                      const ids = visibleEmployees.map(e => e.id);
                      const fromIdx = ids.indexOf(from);
                      const toIdx   = ids.indexOf(emp.id);
                      if (fromIdx === -1 || toIdx === -1) return;
                      const next = [...ids];
                      next.splice(fromIdx, 1);
                      next.splice(toIdx, 0, from);
                      setEmpOrder(next);
                      localStorage.setItem(ORDER_KEY, JSON.stringify(next));
                    }}
                    onDragEnd={() => { dragEmpRef.current = null; setDragOver(null); }}
                    className={cn(
                      'grid border-b border-[hsl(var(--border))] group/emprow hover:bg-[hsl(var(--muted))]/10 transition-colors',
                      isDraggedOver && 'border-t-2 border-t-[hsl(var(--combo-green,161_51%_25%))]',
                    )}
                    style={{ gridTemplateColumns: colTemplate }}
                  >
                    {/* Employee name cell */}
                    <div className="p-2 flex flex-col justify-center gap-0.5 border-r border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2">
                        {/* Drag handle */}
                        <GripVertical className="w-3.5 h-3.5 flex-shrink-0 text-[hsl(var(--muted-foreground))]/40 cursor-grab active:cursor-grabbing opacity-0 group-hover/emprow:opacity-100 transition-opacity" />
                        <button
                          onClick={() => setColorFor(colorFor === emp.id ? null : emp.id)}
                          className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white shadow hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title="Changer la couleur"
                        />
                        <p
                          className="text-[11px] font-bold uppercase tracking-tight truncate flex-1 select-none"
                          style={{ color: 'hsl(var(--combo-ink))' }}
                        >
                          {emp.first_name} {emp.last_name}
                        </p>
                        <button
                          onClick={() => removeEmployee(emp.id)}
                          className="opacity-0 group-hover/emprow:opacity-100 p-0.5 rounded hover:bg-[hsl(var(--muted))] transition-all"
                          title="Retirer de la vue"
                        >
                          <X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                        </button>
                      </div>
                      {/* Restaurant badges */}
                      {(employeeSites[emp.id] || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-7">
                          {(employeeSites[emp.id] || []).map(sid => {
                            const siteName = sites.find(s => s.site_id === sid)?.name;
                            if (!siteName) return null;
                            return (
                              <span
                                key={sid}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                                style={{
                                  backgroundColor: `${color}22`,
                                  color: color,
                                  border: `1px solid ${color}55`,
                                }}
                              >
                                {siteName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Day cells */}
                    {weekDays.map((day, di) => {
                      const dateStr   = format(day, 'yyyy-MM-dd');
                      const dayShifts = shifts.filter(
                        s => s.employee_id === emp.id && s.shift_date === dateStr,
                      );

                      return (
                        <div
                          key={di}
                          className="border-l border-[hsl(var(--border))] relative group/cell cursor-pointer"
                          style={{ height: Math.max(64, 12 + dayShifts.length * 30) }}
                        >
                          {/* Hour guide lines */}
                          {HOUR_LINES_PCT.map(pct => (
                            <div
                              key={pct}
                              className="absolute inset-y-0 w-px bg-[hsl(var(--border))]/50 pointer-events-none"
                              style={{ left: `${pct}%` }}
                            />
                          ))}

                          <button
                            onClick={() => createShift(emp.id, dateStr, dayShifts)}
                            disabled={creating === emp.id + dateStr}
                            className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity hover:bg-[hsl(var(--muted))] disabled:opacity-30"
                            title="Ajouter un shift (3h)"
                          >
                            {creating === emp.id + dateStr
                              ? <Loader2 className="w-3 h-3 animate-spin text-[hsl(var(--muted-foreground))]" />
                              : <Plus className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
                          </button>

                          {/* Shift bars */}
                          {dayShifts.map((shift, si) => {
                            // If save is in flight, keep bar at dragged position
                            const sd = savingDraft?.shiftId === shift.id ? savingDraft : null;
                            const local = localShiftEdits[shift.id];
                            const displayStartTime = local?.start_time ?? shift.start_time;
                            const displayEndTime = local?.end_time ?? shift.end_time;
                            const displayNotes = local && 'notes' in local ? local.notes ?? null : shift.notes;
                            const startMins = clamp(
                              sd ? sd.startMins : timeToMins(displayStartTime),
                              TIMELINE_START, TIMELINE_END,
                            );
                            const endMins = clamp(
                              sd ? sd.endMins : timeToMins(displayEndTime),
                              TIMELINE_START, TIMELINE_END,
                            );

                            const leftPct  = ((startMins - TIMELINE_START) / TIMELINE_RANGE) * 100;
                            const widthPct = Math.max(2, ((endMins - startMins) / TIMELINE_RANGE) * 100);
                            const barTop   = 6 + si * 30;

                            const label = shiftLabel(startMins, endMins, displayNotes);
                            // bar too narrow to show text (~50px threshold)
                            const tooNarrow = (widthPct / 100) * dayColWidth < 52;

                            return (
                              <div
                                key={shift.id}
                                data-shift-bar="true"
                                ref={el => {
                                  if (el) shiftBarRefs.current.set(shift.id, el);
                                  else shiftBarRefs.current.delete(shift.id);
                                }}
                                onMouseDown={e => startShiftDrag(e, shift, 'move')}
                                onClick={e => e.stopPropagation()}
                                className={cn(
                                  'absolute rounded-md shadow-sm flex items-center overflow-visible select-none group/bar',
                                  sd && 'ring-2 ring-white/50',
                                )}
                                style={{
                                  left:            `calc(${leftPct}% + 2px)`,
                                  width:           `calc(${widthPct}% - 4px)`,
                                  top:             barTop,
                                  height:          24,
                                  backgroundColor: color,
                                  zIndex:          sd ? 20 : 1,
                                  cursor:          'grab',
                                }}
                              >
                                {/* Left resize handle */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize z-10 hover:bg-black/15 transition-colors rounded-l-md"
                                  onMouseDown={e => { e.stopPropagation(); startShiftDrag(e, shift, 'left'); }}
                                />
                                {/* Right resize handle */}
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-10 hover:bg-black/15 transition-colors rounded-r-md"
                                  onMouseDown={e => { e.stopPropagation(); startShiftDrag(e, shift, 'right'); }}
                                />

                                {/* Label inside bar (hidden when too narrow) */}
                                {!tooNarrow && (
                                  <p
                                    className="text-[9px] font-bold truncate leading-none pointer-events-none px-2 overflow-hidden"
                                    style={{ color: tc }}
                                  >
                                    {label}
                                  </p>
                                )}

                                {/* Hover tooltip — shown when bar text is truncated or hidden */}
                                <div
                                  className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity z-50"
                                  style={{ backgroundColor: color, color: tc, border: `1px solid ${tc}22` }}
                                >
                                  {label}
                                  <span
                                    className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                                    style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${color}` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* Add employee footer */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[hsl(var(--muted))]/30 transition-colors border-t border-dashed border-[hsl(var(--border))]"
              onClick={() => setAddEmpOpen(true)}
            >
              <div className="w-5 h-5 rounded-full border-dashed border-2 border-[hsl(var(--muted-foreground))]/40 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Ajouter un employé à la vue</span>
            </div>

          </div>
        </div>
      </div>

      {/* ── Color picker ── */}
      {colorFor && (
        <div className="fixed inset-0 z-50" onClick={() => setColorFor(null)}>
          <div
            className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] p-4"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold mb-3 text-[hsl(var(--muted-foreground))]">
              Couleur de {employees.find(e => e.id === colorFor)?.first_name ?? '—'}
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => saveColor(colorFor, c)}
                  className="w-9 h-9 rounded-full transition-transform hover:scale-110 shadow-md"
                  style={{
                    backgroundColor: c,
                    outline:         empColors[colorFor] === c ? `3px solid ${c}` : '2px solid transparent',
                    outlineOffset:   3,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Inline shift editor (click only) ── */}
      {popupShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setPopupShift(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] p-5 w-80"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="h-1.5 rounded-full mb-4"
              style={{ backgroundColor: getColor(popupShift.employee_id) }}
            />
            <div className="mb-4">
              <div>
                <h3 className="font-semibold text-sm">Modifier le shift</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {employees.find(e => e.id === popupShift.employee_id)?.first_name}{' '}
                  {employees.find(e => e.id === popupShift.employee_id)?.last_name}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Début</label>
                  <input type="time" value={popupStart} onChange={e => setPopupStart(e.target.value)}
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--combo-green))]" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Fin</label>
                  <input type="time" value={popupEnd} onChange={e => setPopupEnd(e.target.value)}
                    className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--combo-green))]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Note</label>
                <textarea value={popupNote} onChange={e => setPopupNote(e.target.value)}
                  placeholder="Note courte (visible sur le shift)…" rows={2}
                  className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--combo-green))]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => deleteShiftById(popupShift.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-black hover:bg-red-50 text-sm transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              <div className="flex-1" />
              <button onClick={() => setPopupShift(null)}
                className="px-3 py-2 rounded-lg border text-sm hover:bg-[hsl(var(--muted))] transition-colors">
                Annuler
              </button>
              <button onClick={savePopup} disabled={popupSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-black border border-[hsl(var(--border))] bg-white hover:bg-[hsl(var(--muted))] flex items-center gap-1.5 disabled:opacity-60">
                {popupSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add employee dialog ── */}
      {addEmpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setAddEmpOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] p-4 w-72 max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-3">Ajouter un employé à la vue</h3>
            <div className="overflow-y-auto flex-1 space-y-1 -mx-1 px-1">
              {(shownIds === null ? employees : notShownEmployees).length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
                  Tous les employés sont déjà dans la vue.
                </p>
              ) : (
                (shownIds === null ? employees : notShownEmployees).map(emp => {
                  const c = getColor(emp.id);
                  return (
                    <button key={emp.id} onClick={() => addEmployee(emp.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: c, color: hexContrast(c) }}>
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                    </button>
                  );
                })
              )}
            </div>
            <button onClick={() => setAddEmpOpen(false)}
              className="mt-3 w-full py-2 rounded-lg border text-sm hover:bg-[hsl(var(--muted))] transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WeekPlannerGrid;
