/**
 * Page Plannings — vue Combo : grille semaine, shifts colorés par site,
 * colonne employés détaillée, drag & drop natif HTML5,
 * copier/coller (Cmd+C/V), duplication de semaine, heures pointées réelles.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSites } from '@/hooks/useSites';
import { format, addDays, startOfWeek, endOfWeek, parseISO, getISOWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, AlertTriangle, MapPin,
  Download, FileText, FileSpreadsheet,
  Send, Mail, MessageSquare, Loader2, CheckCircle, XCircle, Info,
  Bookmark, FolderOpen, Trash2,
} from 'lucide-react';
import { exportPlanningPDF, exportPlanningCSV } from './utils/exportPlanning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { durationHours, formatHM } from './utils/siteColor';
import WeekPlannerGrid from './components/WeekPlannerGrid';

// ─── Planning templates (localStorage) ───────────────────────────────────────

interface TemplateShift {
  employee_id: string;
  day_of_week: number; // 0 = lundi … 6 = dimanche
  start_time: string;
  end_time: string;
  break_minutes: number;
  position: string | null;
  notes: string | null;
}

interface PlanningTemplate {
  id: string;
  name: string;
  siteId: string;
  createdAt: string;
  shifts: TemplateShift[];
}

const TEMPLATES_KEY = 'bp_planning_templates';

const loadTemplates = (): PlanningTemplate[] => {
  try { const v = localStorage.getItem(TEMPLATES_KEY); return v ? JSON.parse(v) : []; }
  catch { return []; }
};
const persistTemplates = (t: PlanningTemplate[]) =>
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t));

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  selectedRestaurant: string;
}

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
  email?: string | null;
  phone?: string | null;
}

interface TimeEntry {
  employee_id: string;
  total_hours: number | null;
  clock_in: string;
}

const PlanningsPage = ({ selectedRestaurant }: Props) => {
  const { sites } = useSites({ activeOnly: false });
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employeeSites, setEmployeeSites] = useState<Record<string, string[]>>({});
  const [siteFilter, setSiteFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekNumber = useMemo(() => getISOWeek(weekStart), [weekStart]);
  const restaurantSites = useMemo(() => sites.filter(site => site.site_id !== 'all' && site.type === 'restaurant'), [sites]);
  const activeSiteFilter = siteFilter || restaurantSites[0]?.site_id;

  // Capture the sidebar value once on mount; never re-read it to avoid locking the dropdown.
  const initialRestaurant = useRef(selectedRestaurant);

  const siteName = useCallback((siteId: string) => sites.find(s => s.site_id === siteId)?.name || siteId, [sites]);

  // Set initial site once restaurantSites loads; never override the user's manual selection.
  useEffect(() => {
    if (restaurantSites.length === 0) return;
    setSiteFilter(prev => {
      if (prev && restaurantSites.some(s => s.site_id === prev)) return prev; // keep user's choice
      const seed = initialRestaurant.current;
      if (seed && seed !== 'all' && restaurantSites.some(s => s.site_id === seed)) return seed;
      return restaurantSites[0].site_id;
    });
  }, [restaurantSites]); // intentionally omits selectedRestaurant — use ref instead

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      if (!activeSiteFilter) {
        setShifts([]);
        setEmployees([]);
        setTimeEntries([]);
        return;
      }
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const startIso = `${startStr}T00:00:00.000Z`;
      const endIso = `${endStr}T23:59:59.999Z`;

      let sq = supabase.from('shifts').select('*').gte('shift_date', startStr).lte('shift_date', endStr).order('start_time');
      if (activeSiteFilter) sq = sq.eq('site_id', activeSiteFilter);

      const [shiftsRes, empRes, teRes, empSitesRes] = await Promise.all([
        sq,
        supabase.from('employees').select('id, first_name, last_name, weekly_hours, email, phone').eq('is_active', true).order('last_name'),
        supabase.from('time_entries').select('employee_id, total_hours, clock_in').gte('clock_in', startIso).lte('clock_in', endIso),
        supabase.from('employee_sites').select('employee_id, site_id'),
      ]);
      if (shiftsRes.error) console.error('shifts error', shiftsRes.error);
      if (empRes.error) console.error('employees error', empRes.error);
      if (teRes.error) console.error('time_entries error', teRes.error);
      setShifts((shiftsRes.data as Shift[]) || []);
      setEmployees((empRes.data as Employee[]) || []);
      setTimeEntries((teRes.data as TimeEntry[]) || []);
      const map: Record<string, string[]> = {};
      ((empSitesRes.data as { employee_id: string; site_id: string }[]) || []).forEach(es => {
        if (!map[es.employee_id]) map[es.employee_id] = [];
        map[es.employee_id].push(es.site_id);
      });
      setEmployeeSites(map);
    } catch (err) {
      console.error('PlanningsPage fetch error', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [weekStart, activeSiteFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('combo-shifts-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => fetchData(false))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const filteredEmployees = useMemo(() => {
    if (!activeSiteFilter) return employees;
    return employees.filter(e => employeeSites[e.id]?.includes(activeSiteFilter));
  }, [employees, employeeSites, activeSiteFilter]);

  const employeeWeekStats = useCallback((empId: string) => {
    const empShifts = shifts.filter(s => s.employee_id === empId);
    const planned = empShifts.reduce((sum, s) => sum + durationHours(s.start_time, s.end_time, s.break_minutes || 0), 0);
    const clocked = timeEntries
      .filter(t => t.employee_id === empId)
      .reduce((sum, t) => sum + (Number(t.total_hours) || 0), 0);
    const emp = employees.find(e => e.id === empId);
    const contractual = emp?.weekly_hours || 35;
    return {
      planned,
      clocked,
      contractual,
      diff: planned - contractual,
    };
  }, [shifts, employees, timeEntries]);



  // ── Templates ──────────────────────────────────────────────────────────────

  const [templates, setTemplates] = useState<PlanningTemplate[]>(() => loadTemplates());
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToApply, setTemplateToApply] = useState<PlanningTemplate | null>(null);
  const [applyConflictOpen, setApplyConflictOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleSaveTemplate = () => {
    const name = templateName.trim();
    if (!name) { toast.error('Donne un nom au modèle'); return; }
    if (shifts.length === 0) { toast.info('Aucun shift à sauvegarder'); return; }

    const templateShifts: TemplateShift[] = shifts.map(s => ({
      employee_id:   s.employee_id,
      day_of_week:   (new Date(s.shift_date + 'T12:00:00').getDay() + 6) % 7, // 0=lun
      start_time:    s.start_time,
      end_time:      s.end_time,
      break_minutes: s.break_minutes || 0,
      position:      s.position,
      notes:         s.notes,
    }));

    const tmpl: PlanningTemplate = {
      id:        crypto.randomUUID(),
      name,
      siteId:    activeSiteFilter || '',
      createdAt: new Date().toISOString(),
      shifts:    templateShifts,
    };
    const next = [...templates, tmpl];
    setTemplates(next);
    persistTemplates(next);
    toast.success(`Modèle "${name}" sauvegardé (${templateShifts.length} shifts)`);
    setTemplateName('');
    setSaveTemplateOpen(false);
  };

  const deleteTemplate = (id: string) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    persistTemplates(next);
    toast.success('Modèle supprimé');
  };

  const requestApplyTemplate = (tmpl: PlanningTemplate) => {
    setTemplateToApply(tmpl);
    if (shifts.length > 0) {
      setApplyConflictOpen(true);
    } else {
      applyTemplate(tmpl, false);
    }
  };

  const applyTemplate = async (tmpl: PlanningTemplate, clearExisting: boolean) => {
    if (!activeSiteFilter) { toast.error('Sélectionne un site'); return; }
    setApplying(true);
    setApplyConflictOpen(false);

    try {
      if (clearExisting) {
        const startStr = format(weekStart, 'yyyy-MM-dd');
        const endStr   = format(weekEnd,   'yyyy-MM-dd');
        const { error } = await supabase
          .from('shifts').delete()
          .eq('site_id', activeSiteFilter)
          .gte('shift_date', startStr)
          .lte('shift_date', endStr);
        if (error) { toast.error('Erreur suppression shifts existants'); return; }
      }

      const rows = tmpl.shifts.map(s => ({
        employee_id:   s.employee_id,
        site_id:       activeSiteFilter,
        shift_date:    format(addDays(weekStart, s.day_of_week), 'yyyy-MM-dd'),
        start_time:    s.start_time,
        end_time:      s.end_time,
        break_minutes: s.break_minutes,
        position:      s.position,
        notes:         s.notes,
      }));

      const { error } = await supabase.from('shifts').insert(rows);
      if (error) toast.error('Erreur application du modèle');
      else { toast.success(`Modèle "${tmpl.name}" appliqué (${rows.length} shifts)`); fetchData(); }
    } finally {
      setApplying(false);
      setTemplateToApply(null);
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────────

  const [publishing, setPublishing] = useState<null | 'email' | 'sms' | 'both'>(null);
  const [selectionDialog, setSelectionDialog] = useState<null | 'email' | 'sms' | 'both'>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());
  const [sendReport, setSendReport] = useState<{
    mode: 'email' | 'sms' | 'both';
    total: number;
    sent: number;
    failed: number;
    report: Array<{
      id: string;
      name: string;
      status: 'sent' | 'no_contact' | 'failed' | 'skipped';
      channel: 'email' | 'sms';
      detail: string;
      email?: string;
      phone?: string;
    }>;
  } | null>(null);

  // Employees with shifts this week AND assigned to the active site
  const candidateEmployees = useMemo(() => {
    const idsWithShifts = new Set(shifts.map(s => s.employee_id));
    return employees.filter(e =>
      idsWithShifts.has(e.id) &&
      (!activeSiteFilter || employeeSites[e.id]?.includes(activeSiteFilter))
    );
  }, [employees, shifts, employeeSites, activeSiteFilter]);

  const openSelectionDialog = (mode: 'email' | 'sms' | 'both') => {
    if (!activeSiteFilter) {
      toast.error('Sélectionne un site spécifique avant de publier');
      return;
    }
    if (shifts.length === 0) {
      toast.info('Aucun shift à publier sur cette semaine');
      return;
    }
    // Pre-select ALL candidates — employees without contact info will be marked "no_contact" in the report
    setSelectedEmpIds(new Set(candidateEmployees.map(e => e.id)));
    setSelectionDialog(mode);
  };

  const toggleEmpSelection = (id: string) => {
    setSelectedEmpIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllEmpSelection = () => {
    if (selectedEmpIds.size === candidateEmployees.length) {
      setSelectedEmpIds(new Set());
    } else {
      setSelectedEmpIds(new Set(candidateEmployees.map(e => e.id)));
    }
  };

  const publishWeek = async (mode: 'email' | 'sms' | 'both', employeeIds: string[]) => {
    if (publishing) return;
    if (employeeIds.length === 0) {
      toast.error('Sélectionne au moins un employé');
      return;
    }
    setPublishing(mode);
    setSelectionDialog(null);
    const week_start = format(weekStart, 'yyyy-MM-dd');
    const payload = { week_start, site_id: activeSiteFilter, employee_ids: employeeIds };
    try {
      const calls: Promise<any>[] = [];
      if (mode === 'email' || mode === 'both') {
        calls.push(supabase.functions.invoke('send-planning-email', { body: payload }));
      }
      if (mode === 'sms' || mode === 'both') {
        calls.push(supabase.functions.invoke('send-planning-sms', { body: payload }));
      }
      const results = await Promise.all(calls);
      let totalSent = 0;
      let totalFailed = 0;
      let totalNoContact = 0;
      let totalRecipients = 0;
      const allReports: Array<{
        id: string;
        name: string;
        status: 'sent' | 'no_contact' | 'failed' | 'skipped';
        channel: 'email' | 'sms';
        detail: string;
        email?: string;
        phone?: string;
      }> = [];
      const allErrors: string[] = [];
      for (const r of results) {
        if (r.error) {
          // Try to extract actual error body from the HTTP response
          let msg = r.error.message;
          try {
            const body = await r.error.context?.json?.();
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
          allErrors.push(msg);
          continue;
        }
        const d = r.data || {};
        totalSent += Number(d.sent) || 0;
        totalFailed += Number(d.failed) || 0;
        totalRecipients += Number(d.total) || 0;
        if (Array.isArray(d.report)) {
          allReports.push(...d.report);
          totalNoContact += (d.report as any[]).filter((x: any) => x.status === 'no_contact').length;
        }
      }
      setSendReport({
        mode,
        total: totalRecipients,
        sent: totalSent,
        failed: totalFailed,
        report: allReports,
      });
      if (allErrors.length) {
        toast.error('Erreur : ' + allErrors[0]);
      } else if (totalSent > 0) {
        toast.success(`Planning envoyé — ${totalSent} envoi(s)${totalFailed ? `, ${totalFailed} échec(s)` : ''}${totalNoContact ? `, ${totalNoContact} sans contact` : ''}`);
      } else if (totalFailed > 0) {
        toast.error(`Échec d'envoi pour ${totalFailed} employé(s) — vérifiez le rapport`);
      } else {
        toast.warning('Aucun destinataire — ajoutez les emails/téléphones dans Équipe');
      }
      fetchData();
    } catch (err) {
      toast.error('Erreur publication : ' + (err as Error).message);
    } finally {
      setPublishing(null);
    }
  };


  return (
    <div className="combo-theme w-full min-w-0 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="combo-card p-4 flex flex-wrap items-center gap-3">
        {/* Site selector */}
        <div className="relative">
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            className="pill px-4 py-2 text-sm text-gray-900 border border-[hsl(var(--border))] bg-card pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--combo-green))]"
          >
            {restaurantSites.map(s => (
              <option key={s.site_id} value={s.site_id}>{s.name}</option>
            ))}
          </select>
          <MapPin className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]" />
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-full text-gray-900 hover:bg-[hsl(var(--muted))]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-sm font-medium px-3 py-1 rounded-full text-gray-900 hover:bg-[hsl(var(--muted))]">
            {format(weekStart, 'd MMM', { locale: fr })} – {format(weekEnd, 'd MMM yyyy', { locale: fr })}
          </button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-full text-gray-900 hover:bg-[hsl(var(--muted))]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>


        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="pill px-3 py-2 text-sm border border-[hsl(var(--border))] bg-card text-foreground hover:bg-[hsl(var(--muted))] flex items-center gap-1.5 font-medium"
                title="Exporter le planning"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-foreground w-52">
              <DropdownMenuLabel className="text-foreground">Exporter la semaine</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-foreground"
                onClick={() => {
                  exportPlanningPDF({
                    shifts, employees: filteredEmployees, sites,
                    weekDays, weekStart, weekEnd, weekNumber,
                  });
                  toast.success('Export PDF généré');
                }}
              >
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Format PDF (couleurs)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-foreground"
                onClick={() => {
                  exportPlanningCSV({
                    shifts, employees: filteredEmployees, sites,
                    weekDays, weekStart, weekEnd, weekNumber,
                  });
                  toast.success('Export CSV généré');
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                Format CSV (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sauvegarder comme modèle */}
          <button
            onClick={() => { setTemplateName(''); setSaveTemplateOpen(true); }}
            className="pill px-3 py-2 text-sm font-medium text-foreground flex items-center gap-1.5 border border-[hsl(var(--border))] bg-card hover:bg-[hsl(var(--muted))] transition-colors"
            title="Sauvegarder cette semaine comme modèle"
          >
            <Bookmark className="w-4 h-4" />
            Sauvegarder
          </button>

          {/* Appliquer un modèle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="pill px-3 py-2 text-sm font-medium text-foreground flex items-center gap-1.5 border border-[hsl(var(--border))] bg-card hover:bg-[hsl(var(--muted))] transition-colors"
                title="Appliquer un modèle sauvegardé"
              >
                <FolderOpen className="w-4 h-4" />
                Modèles
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-foreground w-64">
              <DropdownMenuLabel className="text-foreground">Modèles sauvegardés</DropdownMenuLabel>
              {templates.filter(t => t.siteId === activeSiteFilter).length === 0 ? (
                <div className="px-3 py-4 text-xs text-[hsl(var(--muted-foreground))] text-center">
                  Aucun modèle pour ce restaurant.
                </div>
              ) : (
                templates.filter(t => t.siteId === activeSiteFilter).map(tmpl => (
                  <div key={tmpl.id} className="flex items-center gap-1 px-1">
                    <DropdownMenuItem
                      className="flex-1 text-foreground"
                      onClick={() => requestApplyTemplate(tmpl)}
                    >
                      <div>
                        <p className="font-medium text-sm">{tmpl.name}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {tmpl.shifts.length} shifts · {new Date(tmpl.createdAt).toLocaleDateString('fr')}
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTemplate(tmpl.id); }}
                      className="p-1.5 rounded hover:bg-red-50 text-foreground transition-colors flex-shrink-0"
                      title="Supprimer ce modèle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={!!publishing}
                className="pill px-5 py-2 text-sm font-semibold text-foreground border border-[hsl(var(--border))] bg-card hover:bg-[hsl(var(--muted))] transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publier le planning
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-foreground w-60">
              <DropdownMenuLabel className="text-foreground">Envoyer aux employés</DropdownMenuLabel>
              <DropdownMenuItem className="text-foreground" onClick={() => openSelectionDialog('email')} disabled={!!publishing}>
                <Mail className="w-4 h-4 mr-2 text-blue-500" />
                Par email
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={() => openSelectionDialog('sms')} disabled={!!publishing}>
                <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
                Par SMS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={() => openSelectionDialog('both')} disabled={!!publishing}>
                <Send className="w-4 h-4 mr-2 text-amber-600" />
                Email + SMS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-[hsl(var(--muted-foreground))]">
                Site : {activeSiteFilter ? siteName(activeSiteFilter) : '⚠️ choisis un site'}
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Visual timeline grid ── */}
      <WeekPlannerGrid
        weekDays={weekDays}
        shifts={shifts}
        employees={filteredEmployees}
        loading={loading}
        siteId={activeSiteFilter || ''}
        onRefresh={fetchData}
        employeeSites={employeeSites}
        sites={restaurantSites}
      />


      {/* Sélection des employés à notifier */}
      <Dialog open={!!selectionDialog} onOpenChange={(o) => !o && setSelectionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectionDialog === 'email' && 'Envoyer le planning par email'}
              {selectionDialog === 'sms' && 'Envoyer le planning par SMS'}
              {selectionDialog === 'both' && 'Envoyer par email + SMS'}
            </DialogTitle>
            <DialogDescription className="text-foreground">
              Sélectionne les employés qui recevront leur planning de la semaine du{' '}
              {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })}.
            </DialogDescription>
          </DialogHeader>

          {candidateEmployees.length === 0 ? (
            <p className="text-sm text-foreground py-4 text-center">
              Aucun employé n'a de shift cette semaine.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Checkbox
                    checked={selectedEmpIds.size === candidateEmployees.length && candidateEmployees.length > 0}
                    onCheckedChange={toggleAllEmpSelection}
                  />
                  Tout sélectionner ({candidateEmployees.length})
                </label>
                <span className="text-xs text-foreground">
                  {selectedEmpIds.size} sélectionné(s)
                </span>
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-1 -mx-1 px-1">
                {candidateEmployees.map(emp => {
                  const stats = employeeWeekStats(emp.id);
                  const hasContact =
                    selectionDialog === 'email' ? !!emp.email :
                    selectionDialog === 'sms' ? !!emp.phone :
                    !!emp.email || !!emp.phone;
                  return (
                    <label
                      key={emp.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[hsl(var(--muted))]',
                        !hasContact && 'opacity-60',
                      )}
                    >
                      <Checkbox
                        checked={selectedEmpIds.has(emp.id)}
                        onCheckedChange={() => toggleEmpSelection(emp.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-xs text-foreground truncate">
                          {stats.planned.toFixed(1)}h planifiées
                          {(selectionDialog === 'email' || selectionDialog === 'both') && (
                            <span className="ml-2">{emp.email || <em className="text-foreground">email manquant</em>}</span>
                          )}
                          {selectionDialog === 'sms' && (
                            <span className="ml-2">{emp.phone || <em className="text-foreground">tél manquant</em>}</span>
                          )}
                          {selectionDialog === 'both' && !emp.phone && (
                            <span className="ml-2 text-foreground italic">tél manquant</span>
                          )}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="text-foreground hover:text-foreground" onClick={() => setSelectionDialog(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectionDialog && publishWeek(selectionDialog, Array.from(selectedEmpIds))}
              disabled={selectedEmpIds.size === 0 || !!publishing}
              className="border border-[hsl(var(--border))] bg-card text-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
            >
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer ({selectedEmpIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rapport détaillé après envoi */}
      <Dialog open={!!sendReport} onOpenChange={(o) => !o && setSendReport(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Rapport d'envoi du planning</DialogTitle>
            <DialogDescription>
              {sendReport && (
                <span>
                  {sendReport.mode === 'email' && 'Envoi par email — '}
                  {sendReport.mode === 'sms' && 'Envoi par SMS — '}
                  {sendReport.mode === 'both' && 'Envoi email + SMS — '}
                  Semaine du {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {sendReport && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {sendReport.sent} envoyé(s)
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {sendReport.report.filter(r => r.status === 'no_contact').length} sans contact
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  {sendReport.failed} échec(s)
                </div>
              </div>

              <div className="overflow-y-auto flex-1 -mx-1 px-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      <th className="text-left py-2 px-2 font-medium text-[hsl(var(--muted-foreground))]">Employé</th>
                      <th className="text-left py-2 px-2 font-medium text-[hsl(var(--muted-foreground))]">Canal</th>
                      <th className="text-left py-2 px-2 font-medium text-[hsl(var(--muted-foreground))]">Statut</th>
                      <th className="text-left py-2 px-2 font-medium text-[hsl(var(--muted-foreground))]">Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sendReport.report.map((r) => (
                      <tr key={`${r.id}-${r.channel}`} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))]/30">
                        <td className="py-2 px-2 font-medium">{r.name}</td>
                        <td className="py-2 px-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                            r.channel === 'email' && 'bg-blue-100 text-blue-700',
                            r.channel === 'sms' && 'bg-emerald-100 text-emerald-700',
                          )}>
                            {r.channel === 'email' && <Mail className="w-3 h-3" />}
                            {r.channel === 'sms' && <MessageSquare className="w-3 h-3" />}
                            {r.channel === 'email' ? 'Email' : 'SMS'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium',
                            r.status === 'sent' && 'text-emerald-600',
                            r.status === 'no_contact' && 'text-amber-600',
                            r.status === 'failed' && 'text-red-600',
                          )}>
                            {r.status === 'sent' && <CheckCircle className="w-3.5 h-3.5" />}
                            {r.status === 'no_contact' && <Info className="w-3.5 h-3.5" />}
                            {r.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            {r.status === 'sent' && 'Envoyé'}
                            {r.status === 'no_contact' && 'Sans contact'}
                            {r.status === 'failed' && 'Échec'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-[hsl(var(--muted-foreground))]">{r.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSendReport(null)}
              className="border border-[hsl(var(--border))] bg-card text-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sauvegarder comme modèle ── */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Sauvegarder le planning comme modèle</DialogTitle>
            <DialogDescription className="text-foreground">
              {shifts.length} shift{shifts.length > 1 ? 's' : ''} de la semaine du{' '}
              {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })} seront sauvegardés.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-foreground block mb-1.5">Nom du modèle</label>
            <input
              autoFocus
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
              placeholder="ex: Semaine standard été, Service week-end…"
              className="w-full border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--combo-green,161_51%_25%))]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="text-foreground hover:text-foreground" onClick={() => setSaveTemplateOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="border border-[hsl(var(--border))] bg-card text-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
            >
              <Bookmark className="w-4 h-4 mr-2" /> Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation conflit avant application ── */}
      <Dialog open={applyConflictOpen} onOpenChange={o => { if (!o) { setApplyConflictOpen(false); setTemplateToApply(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" /> Planning existant détecté
            </DialogTitle>
            <DialogDescription>
              La semaine du {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })} contient déjà{' '}
              <strong>{shifts.length} shift{shifts.length > 1 ? 's' : ''}</strong>.
              Que veux-tu faire ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              className="border-red-200 text-foreground hover:bg-red-50 hover:text-foreground w-full"
              disabled={applying}
              onClick={() => templateToApply && applyTemplate(templateToApply, true)}
            >
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remplacer — supprimer les shifts existants
            </Button>
            <Button
              className="w-full border border-[hsl(var(--border))] bg-card text-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
              disabled={applying}
              onClick={() => templateToApply && applyTemplate(templateToApply, false)}
            >
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter — conserver les shifts existants
            </Button>
            <Button variant="ghost" className="w-full text-foreground hover:text-foreground" onClick={() => { setApplyConflictOpen(false); setTemplateToApply(null); }}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningsPage;
