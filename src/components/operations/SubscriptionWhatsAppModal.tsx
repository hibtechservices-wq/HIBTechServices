import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionContract } from '../../types';
import { formatDate, cleanPhoneNumber } from '../../utils/formatters';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  X,
  Send,
  Phone,
  Building,
  DollarSign,
  Calendar,
  Radio
} from 'lucide-react';

interface SubscriptionWhatsAppModalProps {
  subscription: SubscriptionContract | null;
  onClose: () => void;
}

export const SubscriptionWhatsAppModal: React.FC<SubscriptionWhatsAppModalProps> = ({
  subscription,
  onClose,
}) => {
  const { settings, showNotification } = useApp();
  const [copied, setCopied] = useState(false);

  if (!subscription) return null;

  const rate = settings.exchangeRateUSD_CDF || 2850;
  const priceUSD = subscription.priceUSD;
  const priceCDF = Math.round(priceUSD * rate);
  const phone = subscription.clientPhone || '';
  const cleanPhone = cleanPhoneNumber(phone);

  const defaultMessage = `*RAPPEL ÉCHÉANCE ABONNEMENT - ${settings.name || 'CONGO TECH SARL'}*

Bonjour *${subscription.clientName}*,

Nous vous informons que votre abonnement récurrent arrive à échéance :

📡 *Service / Forfait :* ${subscription.planName || subscription.title}
📑 *Référence Contrat :* ${subscription.contractNumber}
📅 *Date d'Échéance :* ${formatDate(subscription.nextBillingDate)}
💰 *Montant à Régler :* *$${priceUSD.toFixed(2)} USD* (soit *${priceCDF.toLocaleString('fr-FR')} CDF*)

💳 *MODALITÉS DE PAIEMENT SÉCURISÉES :*
• *RAWBANK USD :* 0100-2938491029-45 (Congo Tech SARL)
• *EQUITY BCDC CDF :* 0520-4820194829-12
• *M-PESA :* ${settings.mpesaNumber || '+243 81 234 5678'} (${settings.mpesaName || 'CONGO TECH SARL'})
• *ORANGE MONEY :* ${settings.orangeMoneyNumber || '+243 85 999 1122'}
• *AIRTEL MONEY :* ${settings.airtelMoneyNumber || '+243 99 876 5432'}

Une facture officielle conforme DGI RDC vous sera délivrée dès réception du paiement.
Merci de nous transmettre votre preuve de règlement pour validation immédiate.

_Service Support HibTech & Réseaux_
_Tél : ${settings.phone1 || '+243 81 234 5678'}_`;

  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      showNotification('✓ Message WhatsApp copié dans le presse-papier !', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
    }
  };

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Relance & Notification WhatsApp</h3>
              <p className="text-xs text-slate-400">
                {subscription.clientName} • {subscription.contractNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">Numéro WhatsApp :</span>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {phone || 'Numéro non renseigné'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Message personnalisé à expédier :
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier le message'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer text-center"
            >
              <Send className="w-4 h-4" />
              <span>Ouvrir WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
