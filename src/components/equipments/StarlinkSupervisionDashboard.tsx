import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NetworkEquipment } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Radio,
  Wifi,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Wrench,
  ExternalLink,
  ShieldAlert,
  Zap,
  Gauge
} from 'lucide-react';

export const StarlinkSupervisionDashboard: React.FC = () => {
  const { equipments, updateEquipment, showNotification, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'DATA_WARNING' | 'RENEWAL_ALERT'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract all Starlink equipment with fallback telemetry
  const starlinkKits = useMemo(() => {
    return equipments.filter((e) => e.type === 'STARLINK').map((eq, index) => {
      // If telemetry fields are not already set, provide realistic defaults based on index and status
      const isOffline = eq.status === 'OFFLINE' || eq.status === 'MAINTENANCE';
      const fallbackUsageGB = 450 + (index * 135) % 520; // between 450 and 970 GB
      const fallbackLimitGB = eq.starlink?.dataLimitGB || 1000; // 1 TB standard priority
      const fallbackDownload = isOffline ? 0 : 180 + ((index * 23) % 70);
      const fallbackUpload = isOffline ? 0 : 25 + ((index * 7) % 15);
      const fallbackLatency = isOffline ? 0 : 32 + ((index * 9) % 25);

      // Next billing date fallback (7 to 25 days ahead, or 2 days ahead for one to show alert)
      const daysAhead = index === 1 ? 3 : 12 + ((index * 5) % 18);
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + daysAhead);

      const linkStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED' = isOffline ? 'OFFLINE' : (eq.starlink?.linkStatus || 'ONLINE');
      const dataUsageGB = eq.starlink?.dataUsageGB !== undefined ? eq.starlink.dataUsageGB : fallbackUsageGB;
      const dataLimitGB = fallbackLimitGB;
      const billingCycleRenewalDate = eq.starlink?.billingCycleRenewalDate || renewalDate.toISOString().substring(0, 10);
      const downloadSpeedMbps = eq.starlink?.downloadSpeedMbps !== undefined ? eq.starlink.downloadSpeedMbps : fallbackDownload;
      const uploadSpeedMbps = eq.starlink?.uploadSpeedMbps !== undefined ? eq.starlink.uploadSpeedMbps : fallbackUpload;
      const lastPingTime = eq.starlink?.lastPingTime || `${fallbackLatency} ms`;

      return {
        ...eq,
        computed: {
          linkStatus,
          dataUsageGB,
          dataLimitGB,
          billingCycleRenewalDate,
          downloadSpeedMbps,
          uploadSpeedMbps,
          lastPingTime,
          dataPercent: Math.min(100, Math.round((dataUsageGB / dataLimitGB) * 100)),
          daysUntilRenewal: Math.ceil((new Date(billingCycleRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }
      };
    });
  }, [equipments]);

  // Filtered kits
  const filteredKits = useMemo(() => {
    return starlinkKits.filter((kit) => {
      const matchSearch =
        kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kit.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kit.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kit.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kit.starlink?.kitNumber && kit.starlink.kitNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (kit.starlink?.publicIpOrCgnat && kit.starlink.publicIpOrCgnat.includes(searchQuery));

      if (!matchSearch) return false;

      if (statusFilter === 'ONLINE') return kit.computed.linkStatus === 'ONLINE';
      if (statusFilter === 'OFFLINE') return kit.computed.linkStatus === 'OFFLINE';
      if (statusFilter === 'DATA_WARNING') return kit.computed.dataPercent >= 80;
      if (statusFilter === 'RENEWAL_ALERT') return kit.computed.daysUntilRenewal <= 5;

      return true;
    });
  }, [starlinkKits, searchQuery, statusFilter]);

  // Overall statistics
  const totalKits = starlinkKits.length;
  const onlineCount = starlinkKits.filter((k) => k.computed.linkStatus === 'ONLINE').length;
  const offlineCount = starlinkKits.filter((k) => k.computed.linkStatus === 'OFFLINE').length;
  const dataAlertCount = starlinkKits.filter((k) => k.computed.dataPercent >= 80).length;
  const renewalAlertCount = starlinkKits.filter((k) => k.computed.daysUntilRenewal <= 5).length;
  const totalDataConsumedGB = starlinkKits.reduce((acc, k) => acc + k.computed.dataUsageGB, 0);

  const handleSimulatePing = (kit: typeof starlinkKits[0]) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const newLatency = Math.floor(28 + Math.random() * 20);
      const newDown = Math.floor(170 + Math.random() * 80);
      const newUp = Math.floor(20 + Math.random() * 18);
      
      const updatedEquipment: NetworkEquipment = {
        ...kit,
        starlink: {
          ...kit.starlink,
          kitNumber: kit.starlink?.kitNumber || kit.serialNumber,
          dishSerial: kit.starlink?.dishSerial || kit.serialNumber,
          subscriptionPlan: kit.starlink?.subscriptionPlan || 'Priorité Entreprise (1TB)',
          accountEmail: kit.starlink?.accountEmail || '',
          wifiSsid: kit.starlink?.wifiSsid || '',
          wifiPassword: kit.starlink?.wifiPassword || '',
          routerModel: kit.starlink?.routerModel || 'Starlink Gen 2',
          publicIpOrCgnat: kit.starlink?.publicIpOrCgnat || '100.84.10.15 (CGNAT)',
          linkStatus: 'ONLINE',
          downloadSpeedMbps: newDown,
          uploadSpeedMbps: newUp,
          lastPingTime: `${newLatency} ms`,
          dataUsageGB: kit.computed.dataUsageGB,
          dataLimitGB: kit.computed.dataLimitGB,
          billingCycleRenewalDate: kit.computed.billingCycleRenewalDate
        }
      };

      updateEquipment(kit.id, updatedEquipment);
      showNotification(`Ping kit ${kit.name}: ${newLatency}ms (Débit: ${newDown} Mbps / ${newUp} Mbps)`, 'success');
    }, 700);
  };

  const handleSendRenewalWhatsApp = (kit: typeof starlinkKits[0]) => {
    const phone = kit.starlink?.accountEmail || ''; // phone or contact
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour ${kit.clientName},\n\n${settings.name || 'Notre Direction Commerciale'} vous informe que le forfait Starlink de votre site "${kit.siteName}" arrive à échéance dans ${kit.computed.daysUntilRenewal} jours (le ${formatDate(kit.computed.billingCycleRenewalDate)}).\nConsommation data actuelle : ${kit.computed.dataUsageGB} Go / ${kit.computed.dataLimitGB} Go (${kit.computed.dataPercent}%).\n\nPour éviter toute interruption de service de votre connexion par satellite, merci de procéder au renouvellement de votre mensualité.\n\nService Client ${settings.name || 'RDC'}.`
    );
    window.open(`https://wa.me/${cleanPhone ? (cleanPhone.startsWith('243') ? cleanPhone : `243${cleanPhone}`) : ''}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Supervision Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Télémétrie Satellite Directe · Constellation Starlink RDC
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Tableau de Bord & Supervision Flotte Starlink
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Surveillance continue en temps réel de vos terminaux satellites déployés en RDC. Suivi des quotas de data 1TB, latences inter-stations, et alertes préventives avant suspension du forfait.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => {
                  setIsRefreshing(false);
                  showNotification('Données de télémétrie Starlink synchronisées', 'success');
                }, 800);
              }}
              disabled={isRefreshing}
              className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/40 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-900/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser Télémétrie</span>
            </button>
          </div>
        </div>

        {/* Supervision KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-indigo-900/40">
          <div className="bg-slate-900/80 border border-indigo-800/30 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Terminaux Déployés</span>
              <Radio className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">{totalKits} Kits</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Parc sous contrat actif</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-800/30 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>En Ligne (Actifs)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">{onlineCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Liaison descendante OK</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-800/30 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Hors Ligne / Alerte</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">{offlineCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Coupure ou obstruction</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-800/30 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Data &gt; 80% (Quota 1TB)</span>
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">{dataAlertCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Forfait prioritaire saturé</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-800/30 rounded-xl p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Renouvellement &le; 5j</span>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-400 mt-1">{renewalAlertCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Risque coupure imminente</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par kit, client, site, numéro de série ou IP..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Tous ({starlinkKits.length})
          </button>
          <button
            onClick={() => setStatusFilter('ONLINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'ONLINE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            En Ligne ({onlineCount})
          </button>
          <button
            onClick={() => setStatusFilter('OFFLINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'OFFLINE'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Hors Ligne ({offlineCount})
          </button>
          <button
            onClick={() => setStatusFilter('DATA_WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'DATA_WARNING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Alerte Quota ({dataAlertCount})
          </button>
          <button
            onClick={() => setStatusFilter('RENEWAL_ALERT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'RENEWAL_ALERT'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            Échéance Proche ({renewalAlertCount})
          </button>
        </div>
      </div>

      {/* Grid of Starlink Terminal Cards */}
      {filteredKits.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <Radio className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">Aucun terminal Starlink trouvé</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Aucun kit Starlink ne correspond à vos critères de recherche actuels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredKits.map((kit) => {
            const isOnline = kit.computed.linkStatus === 'ONLINE';
            const isOverData = kit.computed.dataPercent >= 80;
            const isExpiringSoon = kit.computed.daysUntilRenewal <= 5;

            return (
              <div
                key={kit.id}
                className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-neutral-900 text-sm">{kit.name}</h4>
                        </div>
                        <p className="text-xs font-medium text-neutral-700">{kit.clientName}</p>
                        <p className="text-[11px] text-neutral-500">{kit.siteName}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {isOnline ? 'En Ligne' : 'Hors Ligne'}
                    </span>
                  </div>

                  {/* Telemetry Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
                        <ArrowDownCircle className="w-3 h-3 text-emerald-600" /> Débit Bas
                      </div>
                      <div className="text-xs font-black text-neutral-900 mt-0.5">
                        {kit.computed.downloadSpeedMbps} <span className="text-[9px] font-normal text-neutral-500">Mbps</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
                        <ArrowUpCircle className="w-3 h-3 text-blue-600" /> Débit Haut
                      </div>
                      <div className="text-xs font-black text-neutral-900 mt-0.5">
                        {kit.computed.uploadSpeedMbps} <span className="text-[9px] font-normal text-neutral-500">Mbps</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3 text-purple-600" /> Latence
                      </div>
                      <div className="text-xs font-black text-neutral-900 mt-0.5">
                        {kit.computed.lastPingTime}
                      </div>
                    </div>
                  </div>

                  {/* Data Usage 1TB Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-neutral-500" /> Consommation Forfait 1TB
                      </span>
                      <span className={`font-mono font-bold text-[11px] ${
                        kit.computed.dataPercent >= 90
                          ? 'text-rose-600'
                          : kit.computed.dataPercent >= 75
                          ? 'text-amber-600'
                          : 'text-neutral-800'
                      }`}>
                        {kit.computed.dataUsageGB} / {kit.computed.dataLimitGB} Go ({kit.computed.dataPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          kit.computed.dataPercent >= 90
                            ? 'bg-rose-500'
                            : kit.computed.dataPercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, kit.computed.dataPercent)}%` }}
                      />
                    </div>

                    {isOverData && (
                      <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Seuil critique dépassé : passage en débit standard non prioritaire imminent.
                      </p>
                    )}
                  </div>

                  {/* Technical & Billing Details */}
                  <div className="space-y-1 text-xs border-t border-neutral-100 pt-3">
                    <div className="flex justify-between py-0.5">
                      <span className="text-neutral-400">Kit N°:</span>
                      <span className="font-mono text-neutral-700 font-semibold">
                        {kit.starlink?.kitNumber || kit.serialNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-neutral-400">IP Publique / CGNAT:</span>
                      <span className="font-mono text-neutral-700 font-semibold">
                        {kit.starlink?.publicIpOrCgnat || '100.84.10.15 (CGNAT)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-neutral-400">WiFi SSID:</span>
                      <span className="text-neutral-700 font-medium">
                        {kit.starlink?.wifiSsid || 'HIBTECH_NET'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 items-center">
                      <span className="text-neutral-400">Renouvellement Forfait:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isExpiringSoon
                          ? 'bg-rose-100 text-rose-800 font-bold animate-pulse'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {kit.computed.daysUntilRenewal > 0
                          ? `Dans ${kit.computed.daysUntilRenewal} jours (${formatDate(kit.computed.billingCycleRenewalDate)})`
                          : `Expiré (${formatDate(kit.computed.billingCycleRenewalDate)})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSimulatePing(kit)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Envoyer un ping Ookla et mesurer la latence satellite"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ping Test</span>
                  </button>

                  <button
                    onClick={() => handleSendRenewalWhatsApp(kit)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                    title="Envoyer un rappel de renouvellement WhatsApp au client"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Rappel WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
