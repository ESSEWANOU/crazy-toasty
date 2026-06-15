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
  UserCheck, FileText, Check, X, MessageSquare, ChevronDown,
  Download, Clock, Loader2, Briefcase, Search, MailOpen, RefreshCw,
  Archive, Inbox, Settings, Save,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TEMPLATE_STORAGE_KEY = 'bp_candidature_email_templates';

const DEFAULT_TEMPLATES = {
  accept: `Ahoy {{nom}} !\n\nNous avons étudié ta candidature avec attention et nous sommes ravis de t'informer qu'elle a retenu tout notre intérêt.\n\nNous te contacterons très prochainement pour convenir d'un entretien. En attendant, n'hésite pas à nous contacter si tu as des questions.\n\nÀ très bientôt !\nL'équipage Black Pearl 🏴‍☠️`,
  reject: `Ahoy {{nom}} !\n\nNous te remercions pour ta candidature et l'intérêt que tu portes à Black Pearl.\n\nAprès étude de ta candidature, nous ne pouvons malheureusement pas y donner suite pour le moment. Nous gardons toutefois tes informations et reviendrons vers toi si une opportunité se présente.\n\nBonne continuation dans ta recherche !\nL'équipage Black Pearl 🏴‍☠️`,
};

const loadTemplates = () => {
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) return { ...DEFAULT_TEMPLATES, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_TEMPLATES;
};

const applyVariables = (template: string, name: string, position: string) =>
  template.replace(/{{nom}}/g, name).replace(/{{poste}}/g, position);

interface AppData {
  phone?: string;
  position?: string;
  message?: string;
  cv_path?: string;
  cv_bucket?: string;
}

interface Application {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  body_text: string | null;
  received_at: string;
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  category: string | null;
}

const CandidaturesManagement = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Contact dialog
  const [contactTarget, setContactTarget] = useState<Application | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState<string | null>(null);

  // Email templates
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTab, setTemplateTab] = useState<'accept' | 'reject'>('accept');
  const [templates, setTemplates] = useState(loadTemplates);
  const [draftTemplates, setDraftTemplates] = useState(loadTemplates);

  const saveTemplates = () => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(draftTemplates));
    setTemplates(draftTemplates);
    setShowTemplates(false);
    toast.success('Modèles d\'email sauvegardés');
  };

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('received_emails')
      .select('*')
      .in('category', ['application', 'application_accepted', 'application_rejected'])
      .eq('is_archived', showArchived)
      .order('received_at', { ascending: false });

    if (error) toast.error('Erreur chargement candidatures');
    else setApps(data || []);
    setLoading(false);
  }, [showArchived]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const parseData = (app: Application): AppData => {
    try { return app.body_text ? JSON.parse(app.body_text) : {}; }
    catch { return { message: app.body_text || '' }; }
  };

  const markRead = async (id: string) => {
    await supabase.from('received_emails').update({ is_read: true }).eq('id', id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const handleExpand = (app: Application) => {
    if (expandedId === app.id) { setExpandedId(null); return; }
    setExpandedId(app.id);
    if (!app.is_read) markRead(app.id);
  };

  const handleArchive = async (id: string, archive = true) => {
    const { error } = await supabase.from('received_emails').update({ is_archived: archive }).eq('id', id);
    if (!error) { fetchApps(); toast.success(archive ? 'Candidature archivée' : 'Candidature restaurée'); }
  };

  const sendAdminEmail = async (to: string, subject: string, message: string) => {
    const { error } = await supabase.functions.invoke('send-admin-email', {
      body: { to, subject, message, from_name: 'Black Pearl', reply_to: 'blackpearltoulouse@gmail.com' },
    });
    if (error) throw error;
  };

  const handleAccept = async (app: Application) => {
    const data = parseData(app);
    const name = app.from_name || 'Candidat(e)';
    setSending(true);
    try {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: true, category: 'application_accepted' })
        .eq('id', app.id);
      if (error) throw error;
      fetchApps();
      try {
        await sendAdminEmail(
          app.from_email,
          `Votre candidature — ${data.position || 'Black Pearl'}`,
          applyVariables(templates.accept, name, data.position || 'Black Pearl')
        );
        toast.success('Candidature acceptée · Email envoyé à ' + app.from_email);
      } catch {
        toast.warning('Candidature acceptée · Email non envoyé');
      }
    } catch {
      toast.error('Erreur lors de l\'archivage');
    } finally { setSending(false); }
  };

  const handleReject = async (app: Application) => {
    const data = parseData(app);
    const name = app.from_name || 'Candidat(e)';
    setSending(true);
    try {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: true, category: 'application_rejected' })
        .eq('id', app.id);
      if (error) throw error;
      fetchApps();
      try {
        await sendAdminEmail(
          app.from_email,
          `Votre candidature — ${data.position || 'Black Pearl'}`,
          applyVariables(templates.reject, name, data.position || 'Black Pearl')
        );
        toast.success('Candidature refusée · Email envoyé');
      } catch {
        toast.warning('Candidature refusée · Email non envoyé');
      }
    } catch {
      toast.error('Erreur lors de l\'archivage');
    } finally { setSending(false); }
  };

  const handleContact = async () => {
    if (!contactTarget || !contactMsg.trim() || !contactSubject.trim()) return;
    setSending(true);
    try {
      await sendAdminEmail(contactTarget.from_email, contactSubject, contactMsg);
      toast.success('Message envoyé à ' + contactTarget.from_email);
      setContactTarget(null);
      setContactMsg('');
      setContactSubject('');
    } catch {
      toast.error('Erreur envoi email — vérifie la fonction send-admin-email');
    } finally { setSending(false); }
  };

  const downloadCv = async (app: Application) => {
    const data = parseData(app);
    if (!data.cv_path) { toast.info('Aucun CV joint à cette candidature'); return; }
    setDownloadingCv(app.id);
    try {
      const { data: signedData, error } = await supabase.storage
        .from(data.cv_bucket || 'cv-uploads')
        .createSignedUrl(data.cv_path, 60 * 60);
      if (error) throw error;
      window.open(signedData.signedUrl, '_blank');
    } catch {
      toast.error('Impossible d\'accéder au CV');
    } finally { setDownloadingCv(null); }
  };

  const filtered = apps.filter(app => {
    if (!searchTerm) return true;
    const data = parseData(app);
    const q = searchTerm.toLowerCase();
    return (
      (app.from_name || '').toLowerCase().includes(q) ||
      app.from_email.toLowerCase().includes(q) ||
      (data.position || '').toLowerCase().includes(q)
    );
  });

  const unreadCount = apps.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Candidatures
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs font-bold">{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</Badge>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              showArchived
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {showArchived ? <Inbox className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? 'Actives' : 'Archives'}
          </button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => { setDraftTemplates(templates); setTemplateTab('accept'); setShowTemplates(true); }}
            title="Modifier les modèles d'email"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modèles</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchApps}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{apps.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Non lues</p>
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Archivées</p>
          <p className="text-2xl font-bold text-muted-foreground">{showArchived ? apps.length : '—'}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email, poste..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Candidatures list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">
            {showArchived ? 'Aucune candidature archivée' : 'Aucune candidature reçue'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les candidatures du formulaire de recrutement apparaîtront ici
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const data = parseData(app);
            const isExpanded = expandedId === app.id;
            const initial = (app.from_name || app.from_email)?.[0]?.toUpperCase() || '?';

            return (
              <Card
                key={app.id}
                className={cn(
                  'overflow-hidden transition-all',
                  !app.is_read && 'border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]'
                )}
              >
                {/* Row */}
                <button
                  type="button"
                  onClick={() => handleExpand(app)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                    !app.is_read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn('text-sm', !app.is_read ? 'font-bold' : 'font-medium')}>
                        {app.from_name || app.from_email}
                      </span>
                      {!app.is_read && (
                        <Badge className="text-[10px] px-1.5 h-4 bg-primary">Nouveau</Badge>
                      )}
                      {app.category === 'application_accepted' && (
                        <Badge className="text-[10px] px-1.5 h-4 bg-emerald-500 text-white gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Accepté
                        </Badge>
                      )}
                      {app.category === 'application_rejected' && (
                        <Badge className="text-[10px] px-1.5 h-4 bg-red-500 text-white gap-1">
                          <X className="w-2.5 h-2.5" />
                          Refusé
                        </Badge>
                      )}
                      {data.position && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          {data.position}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.from_email}
                      {data.phone && <span className="ml-2 text-muted-foreground/70">· {data.phone}</span>}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 shrink-0">
                    {data.cv_path && (
                      <span title="CV joint">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(app.received_at), 'd MMM yyyy', { locale: fr })}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform shrink-0',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                        <a href={`mailto:${app.from_email}`} className="text-primary hover:underline">{app.from_email}</a>
                      </div>
                      {data.phone && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Téléphone</p>
                          <a href={`tel:${data.phone}`} className="hover:text-primary">{data.phone}</a>
                        </div>
                      )}
                      {data.position && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Poste souhaité</p>
                          <p>{data.position}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reçue le</p>
                        <p>{format(parseISO(app.received_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </div>
                    </div>

                    {/* Motivation */}
                    {data.message && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message de motivation</p>
                        <div className="bg-card border border-border rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {data.cv_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => downloadCv(app)}
                          disabled={downloadingCv === app.id}
                        >
                          {downloadingCv === app.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />}
                          Voir le CV
                        </Button>
                      )}
                      {app.category !== 'application_accepted' && app.category !== 'application_rejected' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                            onClick={() => handleAccept(app)}
                            disabled={sending}
                          >
                            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Accepter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
                            onClick={() => handleReject(app)}
                            disabled={sending}
                          >
                            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            Refuser
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const d = parseData(app);
                          setContactTarget(app);
                          setContactSubject(`Re: Candidature — ${d.position || 'Black Pearl'}`);
                          setContactMsg('');
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message personnalisé
                      </Button>
                      {!app.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-muted-foreground"
                          onClick={() => markRead(app.id)}
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                          Marquer lue
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground ml-auto"
                        onClick={() => handleArchive(app.id, !showArchived)}
                      >
                        {showArchived ? <Inbox className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        {showArchived ? 'Restaurer' : 'Archiver'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Templates dialog */}
      <Dialog open={showTemplates} onOpenChange={(o) => { if (!o) setShowTemplates(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Modèles d'email candidatures
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">
            Variables disponibles : <code className="bg-muted px-1 rounded">{'{{nom}}'}</code> nom du candidat · <code className="bg-muted px-1 rounded">{'{{poste}}'}</code> poste souhaité
          </p>
          {/* Tab selector */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {(['accept', 'reject'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTemplateTab(tab)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all',
                  templateTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'accept'
                  ? <span className="flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />Acceptation</span>
                  : <span className="flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5 text-red-500" />Refus</span>}
              </button>
            ))}
          </div>
          <Textarea
            value={draftTemplates[templateTab]}
            onChange={e => setDraftTemplates(prev => ({ ...prev, [templateTab]: e.target.value }))}
            rows={10}
            className="font-mono text-sm"
            placeholder="Texte de l'email..."
          />
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setDraftTemplates(prev => ({ ...prev, [templateTab]: DEFAULT_TEMPLATES[templateTab] }))}
            >
              Restaurer défaut
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplates(false)}>Annuler</Button>
              <Button onClick={saveTemplates} className="gap-2">
                <Save className="w-3.5 h-3.5" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact dialog */}
      <Dialog open={!!contactTarget} onOpenChange={(o) => !o && setContactTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Message à {contactTarget?.from_name || contactTarget?.from_email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destinataire</Label>
              <p className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg">
                {contactTarget?.from_email}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={contactSubject}
                onChange={e => setContactSubject(e.target.value)}
                placeholder="Objet du message..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <Textarea
                id="msg"
                value={contactMsg}
                onChange={e => setContactMsg(e.target.value)}
                rows={7}
                placeholder="Votre message..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactTarget(null)}>Annuler</Button>
            <Button
              onClick={handleContact}
              disabled={sending || !contactMsg.trim() || !contactSubject.trim()}
            >
              {sending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
                : <><MessageSquare className="w-4 h-4 mr-2" />Envoyer</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidaturesManagement;
