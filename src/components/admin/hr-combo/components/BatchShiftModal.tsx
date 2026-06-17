/**
 * BatchShiftModal — programmation rapide multi-staff.
 * Sélectionne un créneau horaire, des jours et plusieurs employés
 * puis crée tous les shifts en un seul clic.
 */
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useSites } from '@/hooks/useSites';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Zap, Search, Check, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getInitials, avatarColor } from '../utils/siteColor';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  weekly_hours: number | null;
  role?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employees: Employee[];
  weekDays: Date[];
  defaultSiteId: string;
  onSaved: () => void;
}

interface Preset {
  id: string;
  label: string;
  emoji: string;
  start: string;
  end: string;
  breakMin: number;
  color: string;
}

const PRESETS: Preset[] = [
  { id: 'midi',     label: 'Midi',     emoji: '☀️', start: '11:00', end: '15:00', breakMin: 0,  color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'soir',     label: 'Soir',     emoji: '🌙', start: '18:00', end: '23:00', breakMin: 0,  color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'journee',  label: 'Journée',  emoji: '🔆', start: '11:00', end: '23:00', breakMin: 60, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'matin',    label: 'Matin',    emoji: '🌅', start: '08:00', end: '14:00', breakMin: 0,  color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'custom',   label: 'Libre',    emoji: '✏️', start: '',      end: '',      breakMin: 0,  color: 'bg-muted text-foreground border-border' },
];

const POSITIONS = [
  { value: 'polyvalent', label: '⚡ Polyvalent' },
  { value: 'ouverture',  label: '🔓 Ouverture' },
  { value: 'fermeture',  label: '🔒 Fermeture' },
  { value: 'preparation',label: '🥗 Préparation' },
  { value: 'service',    label: '🛎️ Service' },
  { value: 'salle',      label: '🍽️ Salle' },
  { value: 'caisse',     label: '💳 Caisse' },
  { value: 'cuisine',    label: '🔥 Cuisine' },
  { value: 'livraison',  label: '🛵 Livraison' },
];

const BatchShiftModal = ({ open, onOpenChange, employees, weekDays, defaultSiteId, onSaved }: Props) => {
  const { sites } = useSites();

  // ── Créneau ──
  const [selectedPreset, setSelectedPreset] = useState<string>('midi');
  const [customStart, setCustomStart] = useState('11:00');
  const [customEnd, setCustomEnd] = useState('19:00');
  const [breakMin, setBreakMin] = useState(30);
  const [position, setPosition] = useState('polyvalent');
  const [siteId, setSiteId] = useState(defaultSiteId);

  // ── Jours ──
  const [selectedDayIndexes, setSelectedDayIndexes] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));

  // ── Employés ──
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [empSearch, setEmpSearch] = useState('');

  // ── Saving ──
  const [saving, setSaving] = useState(false);

  const preset = PRESETS.find(p => p.id === selectedPreset)!;
  const effectiveStart = selectedPreset === 'custom' ? customStart : preset.start;
  const effectiveEnd   = selectedPreset === 'custom' ? customEnd   : preset.end;

  const filteredEmployees = useMemo(() => {
    const q = empSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  const toggleDay = (i: number) =>
    setSelectedDayIndexes(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const toggleEmp = (id: string) =>
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const selectAllEmployees = () => {
    if (selectedEmployeeIds.size === filteredEmployees.length) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  const selectAllDays = () => {
    if (selectedDayIndexes.size === weekDays.length) {
      setSelectedDayIndexes(new Set());
    } else {
      setSelectedDayIndexes(new Set(weekDays.map((_, i) => i)));
    }
  };

  const shiftCount = selectedEmployeeIds.size * selectedDayIndexes.size;

  const handleCreate = async () => {
    if (!effectiveStart || !effectiveEnd) { toast.error('Sélectionne un créneau'); return; }
    if (selectedDayIndexes.size === 0) { toast.error('Sélectionne au moins un jour'); return; }
    if (selectedEmployeeIds.size === 0) { toast.error('Sélectionne au moins un employé'); return; }

    setSaving(true);
    const rows = [];
    for (const empId of selectedEmployeeIds) {
      for (const dayIdx of selectedDayIndexes) {
        rows.push({
          employee_id: empId,
          site_id: siteId,
          shift_date: format(weekDays[dayIdx], 'yyyy-MM-dd'),
          start_time: effectiveStart,
          end_time: effectiveEnd,
          break_minutes: breakMin,
          position,
          notes: null,
          status: 'draft',
        });
      }
    }

    const { error } = await supabase.from('shifts').insert(rows);
    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la création des shifts');
      console.error(error);
      return;
    }
    toast.success(`${rows.length} shift${rows.length > 1 ? 's' : ''} créé${rows.length > 1 ? 's' : ''} ✓`);
    setSelectedEmployeeIds(new Set());
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" />
            Programmation rapide
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assignez un créneau à plusieurs membres de l'équipe en une seule action.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ─── CRÉNEAU ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              1 · Créneau horaire
            </h3>

            {/* Preset chips */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(p.id);
                    if (p.id !== 'custom') setBreakMin(p.breakMin);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                    selectedPreset === p.id
                      ? p.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-muted/50 border-muted text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                  {p.id !== 'custom' && (
                    <span className="text-[10px] opacity-70 font-normal">
                      {p.start}–{p.end}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom time inputs */}
            {selectedPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pl-1">
                <div className="space-y-1">
                  <Label className="text-xs">Heure début</Label>
                  <Input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Heure fin</Label>
                  <Input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}

            {/* Break + Position + Site */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pause (min)</Label>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={breakMin}
                  onChange={e => setBreakMin(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Poste</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Restaurant</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sites.map(s => (
                      <SelectItem key={s.site_id} value={s.site_id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ─── JOURS ───────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                2 · Jours de la semaine
              </h3>
              <button
                type="button"
                onClick={selectAllDays}
                className="text-xs text-primary hover:underline font-medium"
              >
                {selectedDayIndexes.size === weekDays.length ? 'Tout désélectionner' : 'Toute la semaine'}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day, i) => {
                const selected = selectedDayIndexes.has(i);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all text-sm font-semibold',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/30 border-muted text-muted-foreground hover:bg-muted hover:border-muted-foreground/30',
                      isToday && !selected && 'border-primary/40 text-primary'
                    )}
                  >
                    <span className="text-[10px] font-medium uppercase opacity-80">
                      {format(day, 'EEE', { locale: fr })}
                    </span>
                    <span className="text-base leading-none">{format(day, 'd')}</span>
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── ÉQUIPE ──────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                3 · Équipe
                {selectedEmployeeIds.size > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-bold">
                    {selectedEmployeeIds.size}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={selectAllEmployees}
                className="text-xs text-primary hover:underline font-medium"
              >
                {selectedEmployeeIds.size === filteredEmployees.length && filteredEmployees.length > 0
                  ? 'Tout désélectionner'
                  : 'Sélectionner tout'}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                className="pl-9 text-sm h-8"
              />
            </div>

            {/* Employee chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredEmployees.map(emp => {
                const selected = selectedEmployeeIds.has(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleEmp(emp.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-left',
                      selected
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-muted/30 border-muted hover:bg-muted hover:border-muted-foreground/30'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      selected ? 'bg-primary text-primary-foreground' : avatarColor(emp.id)
                    )}>
                      {selected
                        ? <Check className="w-4 h-4" />
                        : getInitials(emp.first_name, emp.last_name)
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-xs font-bold truncate uppercase tracking-tight', selected && 'text-primary')}>
                        {emp.first_name} {emp.last_name}
                      </p>
                      {emp.weekly_hours && (
                        <p className="text-[10px] text-muted-foreground">{emp.weekly_hours}h/sem</p>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredEmployees.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground py-4 text-center">
                  Aucun employé trouvé
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ─── FOOTER ──────────────────────────────────────────────── */}
        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Summary */}
          <div className="flex-1 text-sm text-muted-foreground">
            {shiftCount > 0 ? (
              <span>
                <strong className="text-foreground">{shiftCount} shift{shiftCount > 1 ? 's' : ''}</strong>
                {' '}à créer —{' '}
                <span className="text-muted-foreground">
                  {selectedEmployeeIds.size} employé{selectedEmployeeIds.size > 1 ? 's' : ''}
                  {' × '}
                  {selectedDayIndexes.size} jour{selectedDayIndexes.size > 1 ? 's' : ''}
                  {' · '}
                  {effectiveStart || '??'}–{effectiveEnd || '??'}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Sélectionne des jours et des employés
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || shiftCount === 0}
              className="flex-1 sm:flex-none gap-2"
              style={{ backgroundColor: 'hsl(var(--combo-ink))', color: 'white' }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</>
                : <><Zap className="w-4 h-4" />Créer {shiftCount > 0 ? `${shiftCount} shift${shiftCount > 1 ? 's' : ''}` : ''}</>
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchShiftModal;
