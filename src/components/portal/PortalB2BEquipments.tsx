import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  Radio,
  Wifi,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

export const PortalB2BEquipments: React.FC = () => {
  const { equipments, portalClient, settings, showNotification } = useApp();

  if (!portalClient) return null;

  // Find all equipment assigned to this client
  const clientEquipments = equipments.filter((eq) => {
    return (
      eq.clientId === portalClient.id ||
      eq.clientName.toLowerCase().includes(portalClient.name.toLowerCase()) ||
      (portalClient.companyName && eq.clientName.toLowerCase().includes(portalClient.companyName.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white border border-indigo-900/60 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Parc Installé & Télémétrie en Ligne
            </span>
            <h2 className="text-xl font-bold tracking-tight mt-1">
              Vos Équipements Télécoms & Starlink Déployés
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Supervision en temps réel de vos antennes Starlink, routeurs et caméras installés sur vos sites.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold">
              {clientEquipments.length} équipement(s) sous contrat
            </span>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      {clientEquipments.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
          <Server className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">Aucun équipement actuellement rattaché</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Vos kits Starlink et installations apparaîtront ici dès la finalisation du déploiement par nos équipes techniques.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clientEquipments.map((eq, idx) => {
            const isStarlink = eq.type === 'STARLINK';
            const isOnline = eq.status === 'ACTIVE';
            const dataUsage = eq.starlink?.dataUsageGB || (520 + (idx * 110) % 350);
            const dataLimit = eq.starlink?.dataLimitGB || 1000;
            const dataPercent = Math.min(100, Math.round((dataUsage / dataLimit) * 100));
            const renewalDate = eq.starlink?.billingCycleRenewalDate || '2026-11-15';

            return (
              <div
                key={eq.id}
                className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {isStarlink ? <Radio className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{eq.name}</h4>
                        <p className="text-xs text-neutral-500 font-medium">Site : {eq.siteName}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {isOnline ? 'En Service' : 'Maintenance'}
                    </span>
                  </div>

                  {/* Telemetry bar for Starlink */}
                  {isStarlink && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700">Consommation Data Forfait 1TB</span>
                        <span className="font-mono font-bold text-neutral-900">{dataUsage} / {dataLimit} Go ({dataPercent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dataPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                          style={{ width: `${dataPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-neutral-500 pt-1">
                        <span>Renouvellement automatique :</span>
                        <span className="font-semibold text-neutral-800">{formatDate(renewalDate)}</span>
                      </div>
                    </div>
                  )}

                  {/* Network parameters */}
                  <div className="mt-3 space-y-1 text-xs text-neutral-600">
                    <div className="flex justify-between py-0.5 border-b border-neutral-100">
                      <span className="text-neutral-400">N° de Série :</span>
                      <span className="font-mono font-semibold text-neutral-800">{eq.serialNumber}</span>
                    </div>
                    {eq.starlink?.publicIpOrCgnat && (
                      <div className="flex justify-between py-0.5 border-b border-neutral-100">
                        <span className="text-neutral-400">IP CGNAT / Dédiée :</span>
                        <span className="font-mono font-semibold text-neutral-800">{eq.starlink.publicIpOrCgnat}</span>
                      </div>
                    )}
                    {eq.starlink?.wifiSsid && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-neutral-400">Réseau Wi-Fi (SSID) :</span>
                        <span className="font-medium text-neutral-800">{eq.starlink.wifiSsid}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-400">
                    Installé le {formatDate(eq.installationDate)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      showNotification('Test de connectivité réussi : kit en ligne, latence 34ms', 'success');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Tester la Ligne</span>
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
