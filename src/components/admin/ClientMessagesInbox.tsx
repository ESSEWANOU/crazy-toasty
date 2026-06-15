import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail, MailOpen, Star, StarOff, Archive, Inbox,
  RefreshCw, Search, MessageSquare, Loader2, Clock,
  Trash2, Reply, ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Email {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  category: string | null;
  restaurant: string | null;
}

type FilterMode = 'inbox' | 'starred' | 'archived';

const ClientMessagesInbox = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('inbox');

  // Reply dialog
  const [replyTarget, setReplyTarget] = useState<Email | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('received_emails')
      .select('*')
      .neq('category', 'application')
      .neq('category', 'application_accepted')
      .neq('category', 'application_rejected')
      .order('received_at', { ascending: false });

    if (filter === 'inbox') query = query.eq('is_archived', false);
    else if (filter === 'archived') query = query.eq('is_archived', true);
    else if (filter === 'starred') query = query.eq('is_starred', true).eq('is_archived', false);

    const { data, error } = await query;
    if (error) toast.error('Erreur chargement messages');
    else setEmails(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const markRead = async (id: string) => {
    await supabase.from('received_emails').update({ is_read: true }).eq('id', id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
  };

  const toggleStar = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    const next = !email.is_starred;
    await supabase.from('received_emails').update({ is_starred: next }).eq('id', email.id);
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, is_starred: next } : em));
  };

  const toggleArchive = async (id: string, archive: boolean) => {
    const { error } = await supabase.from('received_emails').update({ is_archived: archive }).eq('id', id);
    if (!error) { fetchEmails(); toast.success(archive ? 'Message archivé' : 'Message restauré'); }
  };

  const deleteEmail = async (id: string) => {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    const { error } = await supabase.from('received_emails').delete().eq('id', id);
    if (!error) { fetchEmails(); toast.success('Message supprimé'); }
  };

  const handleExpand = (email: Email) => {
    if (expandedId === email.id) { setExpandedId(null); return; }
    setExpandedId(email.id);
    if (!email.is_read) markRead(email.id);
  };

  const handleReply = async () => {
    if (!replyTarget || !replyMsg.trim() || !replySubject.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          to: replyTarget.from_email,
          subject: replySubject,
          message: replyMsg,
          from_name: 'Black Pearl',
          reply_to: 'blackpearltoulouse@gmail.com',
        },
      });
      if (error) throw error;
      toast.success('Réponse envoyée à ' + replyTarget.from_email);
      setReplyTarget(null);
      setReplyMsg('');
      setReplySubject('');
    } catch {
      toast.error('Erreur envoi — vérifie la fonction send-admin-email');
    } finally { setSending(false); }
  };

  const filtered = emails.filter(email => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (email.from_name || '').toLowerCase().includes(q) ||
      email.from_email.toLowerCase().includes(q) ||
      email.subject.toLowerCase().includes(q) ||
      (email.body_text || '').toLowerCase().includes(q)
    );
  });

  const unreadCount = emails.filter(e => !e.is_read && !e.is_archived).length;

  const FILTERS: { key: FilterMode; label: string; icon: React.ReactNode }[] = [
    { key: 'inbox', label: 'Boîte de réception', icon: <Inbox className="w-4 h-4" /> },
    { key: 'starred', label: 'Favoris', icon: <Star className="w-4 h-4" /> },
    { key: 'archived', label: 'Archives', icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Messages clients
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs font-bold">{unreadCount}</Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchEmails}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setExpandedId(null); }}
            className={cn(
              'flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all',
              filter === f.key
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.icon}
            <span className="hidden sm:inline">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les messages..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Email list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Aucun message</p>
          <p className="text-xs text-muted-foreground mt-1">
            Les messages du formulaire de contact apparaîtront ici
          </p>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(email => {
            const isExpanded = expandedId === email.id;
            const initial = (email.from_name || email.from_email)?.[0]?.toUpperCase() || '?';

            return (
              <Card
                key={email.id}
                className={cn(
                  'overflow-hidden transition-all',
                  !email.is_read && filter === 'inbox' && 'border-primary/50 bg-primary/[0.03]'
                )}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleExpand(email)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                    !email.is_read && filter === 'inbox' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {initial}
                  </div>

                  {/* From + subject */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm', !email.is_read ? 'font-bold' : 'font-medium')}>
                        {email.from_name || email.from_email}
                      </span>
                      {email.category && email.category !== 'contact' && (
                        <Badge variant="outline" className="text-[10px]">{email.category}</Badge>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs truncate mt-0.5',
                      !email.is_read ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {email.subject}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => toggleStar(e, email)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title={email.is_starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      {email.is_starred
                        ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        : <StarOff className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(email.received_at), 'd MMM', { locale: fr })}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">De</p>
                        <p>{email.from_name && <strong>{email.from_name} </strong>}
                          <a href={`mailto:${email.from_email}`} className="text-primary hover:underline">&lt;{email.from_email}&gt;</a>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reçu le</p>
                        <p>{format(parseISO(email.received_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message</p>
                      <div className="bg-card border border-border rounded-lg p-3">
                        {email.body_text ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{email.body_text}</p>
                        ) : email.body_html ? (
                          <div
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: email.body_html }}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Aucun contenu</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setReplyTarget(email);
                          setReplySubject(`Re: ${email.subject}`);
                          setReplyMsg('');
                        }}
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Répondre
                      </Button>
                      {!email.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => markRead(email.id)}
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                          Marquer lu
                        </Button>
                      )}
                      {filter !== 'archived' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-muted-foreground"
                          onClick={() => toggleArchive(email.id, true)}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archiver
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-muted-foreground"
                          onClick={() => toggleArchive(email.id, false)}
                        >
                          <Inbox className="w-3.5 h-3.5" />
                          Restaurer
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive ml-auto"
                        onClick={() => deleteEmail(email.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reply dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(o) => !o && setReplyTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-primary" />
              Répondre à {replyTarget?.from_name || replyTarget?.from_email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destinataire</Label>
              <p className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg">
                {replyTarget?.from_email}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reply-subject">Sujet</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={e => setReplySubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reply-msg">Message</Label>
              <Textarea
                id="reply-msg"
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
                rows={7}
                placeholder="Votre réponse..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)}>Annuler</Button>
            <Button
              onClick={handleReply}
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

export default ClientMessagesInbox;
