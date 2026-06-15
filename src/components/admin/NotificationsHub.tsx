import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Inbox, UserCheck, Truck, ChevronDown,
  Clock, Users, MapPin, Calendar, Phone, Mail,
  Loader2, RefreshCw, CheckCircle, Reply,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import ClientMessagesInbox from './ClientMessagesInbox';
import CandidaturesManagement from './CandidaturesManagement';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

type HubTab = 'messages' | 'candidatures' | 'foodtruck';

interface FoodtruckQuote {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_types: string[] | null;
  event_date: string | null;
  event_address: string | null;
  number_of_persons: number;
  message: string | null;
  status: string;
  created_at: string;
  quote_number: string | null;
}

interface HubCounts {
  messages: number;
  candidatures: number;
  foodtruck: number;
}

interface NotificationsHubProps {
  onRefreshBadge?: () => void;
}

// ── Foodtruck pending requests section ────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  anniversaire: 'Anniversaire',
  mariage: 'Mariage',
  entreprise: 'Entreprise',
  prive: 'Événement privé',
  sportif: 'Sportif',
  festival: 'Festival',
  autre: 'Autre',
};

const REPLY_TO_EMAIL = 'blackpearltoulouse@gmail.com';

const FoodtruckRequestsSection = ({ onCountChange }: { onCountChange: () => void }) => {
  const [quotes, setQuotes] = useState<FoodtruckQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reply dialog
  const [replyTarget, setReplyTarget] = useState<FoodtruckQuote | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('foodtruck_quotes')
      .select(
        'id, customer_name, customer_email, customer_phone, event_types, event_date, event_address, number_of_persons, message, status, created_at, quote_number'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erreur chargement demandes foodtruck');
    else setQuotes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const openReply = (q: FoodtruckQuote) => {
    setReplyTarget(q);
    setReplySubject(`Re: Demande FoodTruck — ${q.customer_name}`);
    setReplyMsg('');
  };

  const sendReply = async () => {
    if (!replyTarget || !replyMsg.trim() || !replySubject.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          to: replyTarget.customer_email,
          subject: replySubject,
          message: replyMsg,
          reply_to: REPLY_TO_EMAIL,
        },
      });
      if (error) throw error;
      toast.success('Réponse envoyée à ' + replyTarget.customer_email);
      setReplyTarget(null);
      // Mark as follow_up if still pending
      if (replyTarget.status === 'pending') {
        await supabase.from('foodtruck_quotes').update({ status: 'follow_up' }).eq('id', replyTarget.id);
        fetchQuotes();
        onCountChange();
      }
    } catch {
      toast.error('Erreur envoi — vérifie la fonction send-admin-email');
    } finally { setSending(false); }
  };

  const markHandled = async (id: string) => {
    const { error } = await supabase
      .from('foodtruck_quotes')
      .update({ status: 'follow_up' })
      .eq('id', id);
    if (!error) {
      fetchQuotes();
      onCountChange();
      toast.success('Demande prise en charge');
    } else {
      toast.error('Erreur mise à jour');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
    </div>
  );

  if (quotes.length === 0) return (
    <Card className="p-12 text-center">
      <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="font-medium text-muted-foreground">Aucune demande en attente</p>
      <p className="text-xs text-muted-foreground mt-1">
        Les demandes du formulaire foodtruck apparaîtront ici
      </p>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {quotes.length} demande{quotes.length > 1 ? 's' : ''} en attente
        </p>
        <Button variant="outline" size="sm" onClick={() => { fetchQuotes(); onCountChange(); }}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        {quotes.map(q => {
          const isExpanded = expandedId === q.id;
          return (
            <Card key={q.id} className="overflow-hidden border-amber-500/30 bg-amber-500/[0.02]">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-amber-700">
                  {q.customer_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold">{q.customer_name}</span>
                    <Badge className="text-[10px] px-1.5 h-4 bg-amber-500 text-white">Nouveau</Badge>
                    {q.event_types?.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {EVENT_LABELS[t] || t}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {q.customer_email}
                    {q.number_of_persons > 0 && (
                      <span className="ml-2">· {q.number_of_persons} personnes</span>
                    )}
                    {q.event_date && (
                      <span className="ml-2">
                        · {format(new Date(q.event_date), 'd MMM yyyy', { locale: fr })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(q.created_at), 'd MMM', { locale: fr })}
                  </span>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${q.customer_email}`} className="text-primary hover:underline">
                          {q.customer_email}
                        </a>
                      </p>
                      {q.customer_phone && (
                        <p className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${q.customer_phone}`} className="hover:text-primary">
                            {q.customer_phone}
                          </a>
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Événement</p>
                      {q.event_date && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(q.event_date), 'd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                      <p className="flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        {q.number_of_persons} personnes
                      </p>
                      {q.event_address && (
                        <p className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {q.event_address}
                        </p>
                      )}
                    </div>
                  </div>

                  {q.message && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{q.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-2"
                      onClick={() => openReply(q)}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Répondre
                    </Button>
                    {q.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                        onClick={() => markHandled(q.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pris en charge
                      </Button>
                    )}
                    {q.status !== 'pending' && (
                      <Badge variant="outline" className="text-xs text-muted-foreground self-center">
                        En cours de traitement
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Reply dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(o) => !o && setReplyTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-primary" />
              Répondre à {replyTarget?.customer_name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">
            Si le client répond à cet email, sa réponse arrivera dans <strong>{REPLY_TO_EMAIL}</strong> (Gmail).
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destinataire</Label>
              <p className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg">
                {replyTarget?.customer_email}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-reply-subject">Sujet</Label>
              <Input
                id="ft-reply-subject"
                value={replySubject}
                onChange={e => setReplySubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-reply-msg">Message</Label>
              <Textarea
                id="ft-reply-msg"
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
                rows={8}
                placeholder="Votre réponse..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)}>Annuler</Button>
            <Button
              onClick={sendReply}
              disabled={sending || !replyMsg.trim() || !replySubject.trim()}
            >
              {sending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
                : <><Reply className="w-4 h-4 mr-2" />Envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Main NotificationsHub ─────────────────────────────────────────────────────

const NotificationsHub = ({ onRefreshBadge }: NotificationsHubProps) => {
  const [activeTab, setActiveTab] = useState<HubTab>('messages');
  const [counts, setCounts] = useState<HubCounts>({ messages: 0, candidatures: 0, foodtruck: 0 });

  const fetchCounts = useCallback(async () => {
    const [msgResult, appResult, ftResult] = await Promise.all([
      supabase
        .from('received_emails')
        .select('id', { count: 'exact', head: true })
        .neq('category', 'application')
        .neq('category', 'application_accepted')
        .neq('category', 'application_rejected')
        .eq('is_read', false)
        .eq('is_archived', false),
      supabase
        .from('received_emails')
        .select('id', { count: 'exact', head: true })
        .in('category', ['application', 'application_accepted', 'application_rejected'])
        .eq('is_read', false),
      supabase
        .from('foodtruck_quotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);
    setCounts({
      messages: msgResult.count ?? 0,
      candidatures: appResult.count ?? 0,
      foodtruck: ftResult.count ?? 0,
    });
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleRefresh = useCallback(() => {
    fetchCounts();
    onRefreshBadge?.();
  }, [fetchCounts, onRefreshBadge]);

  const total = counts.messages + counts.candidatures + counts.foodtruck;

  const TABS: { key: HubTab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { key: 'messages',      label: 'Messages',      icon: Inbox,       count: counts.messages },
    { key: 'candidatures',  label: 'Candidatures',  icon: UserCheck,   count: counts.candidatures },
    { key: 'foodtruck',     label: 'Foodtruck',     icon: Truck,       count: counts.foodtruck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-display">Notifications</h2>
        {total > 0 && (
          <Badge variant="destructive" className="text-xs font-bold animate-pulse">{total}</Badge>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <Badge
                  variant="destructive"
                  className="text-[10px] h-4 min-w-[1rem] px-1 font-bold"
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'messages'     && <ClientMessagesInbox />}
      {activeTab === 'candidatures' && <CandidaturesManagement />}
      {activeTab === 'foodtruck'    && <FoodtruckRequestsSection onCountChange={handleRefresh} />}
    </div>
  );
};

export default NotificationsHub;
