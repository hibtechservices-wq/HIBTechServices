import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkOrderType } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Wrench,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Video,
  Network,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PortalB2BSupportTicket: React.FC = () => {
  const { portalClient, workOrders, createPortalWorkOrderTicket, showNotification } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkOrderType>('MAINTENANCE_CURATIVE_SAV');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  if (!portalClient) return null;

  // Find work orders submitted by this client
  const clientWorkOrders = workOrders.filter((wo) => {
    return (
      wo.clientId === portalClient.id ||
      wo.clientName.toLowerCase().includes(portalClient.name.toLowerCase()) ||
      (portalClient.companyName && wo.clientName.toLowerCase().includes(portalClient.companyName.toLowerCase()))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !siteName.trim() || !notes.trim()) {
      showNotification('Veuillez renseigner le titre, le site et la description de la panne', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const order = createPortalWorkOrderTicket({
        title: title.trim(),
        type,
        siteName: siteName.trim(),
        siteAddress: siteAddress.trim() || portalClient.address || '',
        notes: notes.trim(),
        priority
      });

      setIsSubmitting(false);
      setCreatedTicketNumber(order.orderNumber);
      setTitle('');
      setSiteName('');
      setSiteAddress('');
      setNotes('');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-amber-950 p-6 rounded-2xl text-white border border-amber-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Assistance Technique & SAV 24/7
            </span>
            <h2 className="text-xl font-bold tracking-tight mt-1">
              Demande de Dépannage & Intervention en Ligne
            </h2>
            <p className="text-xs text-neutral-300 mt-0.5">
              Ouvrez un ticket d'intervention prioritaire pour vos kits Starlink, caméras ou réseaux informatiques.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold">
              {clientWorkOrders.length} ticket(s) ouvert(s)
            </span>
          </div>
        </div>
      </div>

      {createdTicketNumber && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 text-emerald-900 flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Votre demande d'intervention a été enregistrée avec succès !</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Ticket N° <span className="font-mono font-bold text-emerald-950">{createdTicketNumber}</span>. Notre équipe technique d'astreinte a été notifiée et vous contactera dans les plus brefs délais.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreatedTicketNumber(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form + Previous Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Nouveau Ticket de Dépannage</h3>
              <p className="text-xs text-neutral-500">Renseignez les détails du dysfonctionnement constaté</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">
                Motif / Titre du Dysfonctionnement *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Signal Starlink indisponible après coupure électrique"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Type d'Équipement</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkOrderType)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="MAINTENANCE_CURATIVE_SAV">Dépannage Curatif / Panne SAV</option>
                  <option value="INSTALLATION_STARLINK">Kit Starlink / Antenne Satellite</option>
                  <option value="INSTALLATION_CCTV">Caméras de Vidéosurveillance & NVR</option>
                  <option value="CABLING_NETWORK">Câblage Réseau & Baie de Brassage</option>
                  <option value="ROUTER_WIFI_CONFIG">Configuration Routeur & Wi-Fi</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Degré d'Urgence</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="NORMAL">Normal (Intervention sous 24h)</option>
                  <option value="URGENT">⚠️ Urgent (Ligne coupée - sous 6h)</option>
                  <option value="CRITICAL">🚨 Critique (Arrêt total d'activité)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">
                  Nom du Site ou Bâtiment *
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Siège Social / Toiture Bâtiment A"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">
                  Adresse Précise du Site
                </label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder={portalClient.address || "Ex: Avenue du Commerce"}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">
                Description Détaillée du Problème *
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Le voyant d'alimentation clignote en rouge, aucune connexion internet sur les bornes WiFi depuis ce matin 08h30..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 text-xs focus:outline-none focus:border-amber-500 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Envoi du ticket en cours..." : "Soumettre la Demande d'Intervention"}</span>
            </button>
          </form>
        </div>

        {/* Existing Work Orders / Tickets History */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Historique de vos Demandes SAV</h3>
            <span className="text-[11px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
              {clientWorkOrders.length} ticket(s)
            </span>
          </div>

          {clientWorkOrders.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              Aucune demande d'intervention ouverte pour le moment.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {clientWorkOrders.map((order) => {
                const isCompleted = order.status === 'COMPLETED';
                const isInProgress = order.status === 'IN_PROGRESS';

                return (
                  <div
                    key={order.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isCompleted ? '✓ Réceptionné' : isInProgress ? 'En cours' : 'Planifié'}
                      </span>
                    </div>

                    <h5 className="font-semibold text-neutral-900 text-xs leading-snug">{order.title}</h5>
                    <p className="text-[11px] text-neutral-500">Site : {order.siteName}</p>

                    <div className="pt-1.5 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Date : {formatDate(order.scheduledDate)}</span>
                      <span className="font-medium text-neutral-600">
                        {order.assignedTechnicians[0] || 'Équipe Technique'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
