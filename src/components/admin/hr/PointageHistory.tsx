import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, ChevronLeft, ChevronRight, ChevronDown, Clock, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInMinutes, parseISO, isSameWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  weekly_hours?: number | null;
}

const PointageHistory = () => {
  const [weekRef, setWeekRef] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const weekStart = useMemo(() => startOfWeek(weekRef, { weekStartsOn: 1 }), [weekRef]);
  const weekEnd = useMemo(() => endOfWeek(weekRef, { weekStartsOn: 1 }), [weekRef]);
  const isCurrentWeek = isSameWeek(weekRef, new Date(), { weekStartsOn: 1 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = `${format(weekStart, 'yyyy-MM-dd')}T00:00:00`;
    const to = `${format(weekEnd, 'yyyy-MM-dd')}T23:59:59`;
    const [{ data: entriesData }, { data: empData }] = await Promise.all([
      supabase
        .from('staff_time_entries')
        .select('*')
        .gte('clock_in', from)
        .lte('clock_in', to)
        .order('clock_in', { ascending: true }),
      supabase.from('staff_members').select('id, first_name, last_name, role, weekly_hours').eq('is_active', true).order('last_name'),
    ]);
    setEntries(entriesData || []);
    setEmployees(empData || []);
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtH = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}h${String(Math.max(0, mm)).padStart(2, '0')}`;
  };

  const getDuration = (entry: TimeEntry): number => {
    if (entry.total_hours) return Number(entry.total_hours);
    if (entry.clock_out) return differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in)) / 60;
    return differenceInMinutes(new Date(), parseISO(entry.clock_in)) / 60;
  };

  // Group entries by employee, compute totals
  const staffData = useMemo(() => {
    return employees.map(emp => {
      const empEntries = entries.filter(e => e.employee_id === emp.id);
      const totalH = empEntries.reduce((sum, e) => sum + getDuration(e), 0);
      return { emp, entries: empEntries, totalH };
    }).filter(d => d.entries.length > 0 || true).sort((a, b) => b.totalH - a.totalH);
  }, [employees, entries]);

  const activeStaff = staffData.filter(d => d.entries.length > 0);
  const totalWeekH = activeStaff.reduce((s, d) => s + d.totalH, 0);

  // Close calendar on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Build list of weeks for the calendar: last 12 weeks + current
  const weekOptions = useMemo(() => {
    const opts = [];
    for (let i = 12; i >= 0; i--) {
      const d = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      opts.push(d);
    }
    return opts;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Historique de pointage
        </h2>

        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekRef(w => subWeeks(w, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-[200px]">
            <p className="text-sm font-semibold">
              {format(weekStart, 'd MMM', { locale: fr })} — {format(weekEnd, 'd MMM yyyy', { locale: fr })}
            </p>
            {isCurrentWeek && (
              <p className="text-xs text-primary font-medium">Semaine en cours</p>
            )}
          </div>

          <button
            onClick={() => setWeekRef(w => addWeeks(w, 1))}
            disabled={isCurrentWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Calendar picker */}
          <div ref={calRef} className="relative">
            <button
              onClick={() => setCalOpen(v => !v)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg border bg-muted transition-colors',
                calOpen ? 'border-primary text-primary' : 'border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              )}
              title="Choisir une semaine"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {calOpen && (
              <div className="absolute z-30 top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden w-64">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                  Sélectionner une semaine
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {weekOptions.map((wStart) => {
                    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
                    const isSelected = isSameDay(wStart, weekStart);
                    const isCurrent = isSameWeek(wStart, new Date(), { weekStartsOn: 1 });
                    return (
                      <button
                        key={wStart.toISOString()}
                        onClick={() => { setWeekRef(wStart); setCalOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-border/50 last:border-0 flex items-center justify-between gap-2',
                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                        )}
                      >
                        <span>
                          {format(wStart, 'd MMM', { locale: fr })} — {format(wEnd, 'd MMM', { locale: fr })}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isCurrent && <span className="text-[10px] text-primary font-medium">En cours</span>}
                          {isSelected && <span className="text-[10px] text-primary">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total heures semaine</p>
          <p className="text-2xl font-bold text-primary">{fmtH(totalWeekH)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Employés actifs</p>
          <p className="text-2xl font-bold">{activeStaff.length}</p>
        </Card>
        <Card className="p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Pointages enregistrés</p>
          <p className="text-2xl font-bold">{entries.length}</p>
        </Card>
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Chargement...</div>
      ) : activeStaff.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Aucun pointage pour cette semaine
        </Card>
      ) : (
        <div className="space-y-2">
          {activeStaff.map(({ emp, entries: empEntries, totalH }) => {
            const target = emp.weekly_hours ?? 35;
            const pct = Math.min(100, (totalH / target) * 100);
            const isExpanded = expandedId === emp.id;
            return (
              <Card key={emp.id} className="overflow-hidden">
                {/* Staff row — click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCircle className="w-6 h-6 text-primary" />
                  </div>

                  {/* Name + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="font-bold text-sm">{fmtH(totalH)}</span>
                        <span className="text-xs text-muted-foreground">/ {target}h</span>
                        <Badge variant="outline" className="text-[10px] hidden sm:inline-flex capitalize">{emp.role}</Badge>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-500',
                          pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {empEntries.length} pointage{empEntries.length > 1 ? 's' : ''} · {Math.round(pct)}% de l'objectif
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')}
                  />
                </button>

                {/* Expanded entries */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {empEntries.map(entry => {
                      const dur = getDuration(entry);
                      const isActive = !entry.clock_out;
                      return (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 text-sm bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground min-w-[90px] text-xs">
                              {format(parseISO(entry.clock_in), 'EEE d MMM', { locale: fr })}
                            </span>
                            <span className="font-mono text-xs">
                              {format(parseISO(entry.clock_in), 'HH:mm')}
                              {' → '}
                              {entry.clock_out
                                ? format(parseISO(entry.clock_out), 'HH:mm')
                                : <span className="text-emerald-500 font-semibold">En cours</span>
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/40 text-[10px]">En cours</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">{fmtH(dur)}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PointageHistory;
