import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  X,
  ExternalLink,
  HelpCircle,
  Sparkles,
  QrCode,
  Copy,
  Check,
  Share2,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { QRCodeSVG } from 'qrcode.react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    return 'android';
  });
  const [isPrompting, setIsPrompting] = useState(false);

  const getPublicAppUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://ais-pre-f5hsq76g3veiyvy4qir7jw-510847259178.europe-west2.run.app';
    }
    const origin = window.location.origin;
    // When running inside AI Studio dev frame, convert ais-dev- to ais-pre- for standalone PWA capability
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const publicUrl = getPublicAppUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleClick = async () => {
    if (isInstallable) {
      setIsPrompting(true);
      const outcome = await install();
      setIsPrompting(false);
      if (outcome !== 'accepted') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  // If already installed in standalone mode and in header, show small status
  if (isInstalled && variant === 'header') {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        PWA Active
      </span>
    );
  }

  return (
    <>
      {/* 1. Header Variant */}
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Télécharger l'APK CongoBiz ou installer sur Android"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 transform active:scale-95 border border-emerald-500/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Télécharger APK</span>
          <span className="sm:hidden">APK</span>
          <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[9px] bg-white/20 uppercase tracking-wider font-mono">
            Android
          </span>
        </button>
      )}

      {/* 2. Sidebar Variant */}
      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Download className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="font-bold flex items-center gap-1.5">
              <span>Télécharger l'APK</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-mono font-bold">.apk</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-normal">Application Android 100% Hors-ligne</div>
          </div>
        </button>
      )}

      {/* Installation Guide & Troubleshooting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-800 my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-emerald-950 p-5 sm:p-6 text-white border-b border-neutral-700">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-lg shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">
                      Télécharger CongoBiz (APK & Mobile)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-neutral-950">
                      Fichier .APK
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    Téléchargez directement le fichier APK officiel ou ajoutez l'app en 1 clic
                  </p>
                </div>
              </div>
            </div>

            {/* Quick QR Code & Link Sharing Card */}
            <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="bg-white p-2 rounded-xl border border-neutral-200 shadow-2xs shrink-0 flex items-center justify-center">
                  <QRCodeSVG
                    value={publicUrl}
                    size={90}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-neutral-800">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Scannez ce QR Code avec votre téléphone</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Pointez l'appareil photo de votre smartphone Android ou iPhone pour ouvrir l'application et télécharger l'APK directement.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 hover:bg-neutral-900 text-white shadow-xs'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Lien copié dans le presse-papier !' : 'Copier le lien public'}</span>
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ouvrir</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-100 p-1.5 gap-1 text-xs font-semibold text-neutral-600">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  activeTab === 'android'
                    ? 'bg-white text-emerald-700 shadow-xs border border-neutral-200 font-bold'
                    : 'hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Android (APK)</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  activeTab === 'ios'
                    ? 'bg-white text-neutral-800 shadow-xs border border-neutral-200 font-bold'
                    : 'hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                <span className="truncate">iPhone</span>
              </button>

              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-white text-blue-700 shadow-xs border border-neutral-200 font-bold'
                    : 'hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">PC / Mac</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[55vh] overflow-y-auto">
              {/* TAB 1: ANDROID APK DIRECT DOWNLOAD */}
              {activeTab === 'android' && (
                <div className="space-y-4">
                  {/* DIRECT APK DOWNLOAD BUTTON */}
                  <a
                    href="/congobiz-pos.apk"
                    download="congobiz-pos.apk"
                    className="w-full p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center justify-between gap-3 group border border-emerald-400/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-sm sm:text-base leading-tight flex items-center gap-2">
                          <span>Télécharger l'APK CongoBiz</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-neutral-950 font-bold">
                            Direct
                          </span>
                        </div>
                        <div className="text-xs text-emerald-100 mt-0.5">
                          Fichier d'installation natif Android (.apk)
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/20">
                        26 Ko
                      </div>
                      <div className="text-[10px] text-emerald-200 mt-0.5">v1.0.0</div>
                    </div>
                  </a>

                  {/* 3 Steps to install the downloaded APK */}
                  <div className="space-y-2.5 text-xs text-neutral-800 font-medium">
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        1
                      </span>
                      <div>
                        <div className="font-bold text-neutral-900">Téléchargez le fichier</div>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Touchez le bouton vert ci-dessus. Le fichier <strong>congobiz-pos.apk</strong> se télécharge directement sur votre téléphone en 1 seconde.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        2
                      </span>
                      <div>
                        <div className="font-bold text-neutral-900">Ouvrez le fichier téléchargé</div>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Touchez la notification de fin de téléchargement ou ouvrez votre application <strong>Téléchargements / Fichiers</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        3
                      </span>
                      <div>
                        <div className="font-bold text-neutral-900">Autorisez et Installez</div>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Si Android demande d'autoriser l'installation des applications inconnues pour votre navigateur ou gestionnaire de fichiers, activez <strong>« Autoriser cette source »</strong> puis appuyez sur <strong>« Installer »</strong>. L'icône CongoBiz s'ajoute à vos applications !
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alternative direct 1-tap browser install without file */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-emerald-950 leading-relaxed">
                      <strong>Astuce :</strong> Vous pouvez également ajouter l'application directement depuis Google Chrome sans télécharger de fichier via le menu <strong>⋮ (trois points)</strong> &gt; <strong>« Installer l'application »</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: IPHONE / IOS */}
              {activeTab === 'ios' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-neutral-100 rounded-2xl border border-neutral-200 flex items-start gap-3">
                    <Apple className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-800 space-y-1">
                      <div className="font-bold">Sur iPhone & iPad (Safari) :</div>
                      <p className="text-neutral-600 leading-relaxed">
                        Apple exige d'utiliser le navigateur <strong>Safari</strong> pour ajouter l'application sur l'écran d'accueil iOS.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-neutral-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                      <p>Ouvrez le lien dans <strong>Safari</strong> sur votre iPhone.</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-neutral-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                      <p>Appuyez sur le bouton <strong>Partager</strong> <span className="inline-block px-1.5 py-0.5 bg-neutral-200 rounded font-mono text-[10px]">⎋</span> situé en bas de l'écran.</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-neutral-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                      <p>Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong> <span className="inline-block px-1.5 py-0.5 bg-neutral-200 rounded font-mono text-[10px]">⊞</span>, puis validez <strong>« Ajouter »</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PC / MAC */}
              {activeTab === 'desktop' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 space-y-1">
                      <div className="font-bold">Sur PC Windows ou Mac :</div>
                      <p className="text-blue-800 leading-relaxed">
                        L'application se lance dans sa propre fenêtre ultra-fluide, indépendante de l'onglet de navigateur, avec raccourci sur le Bureau.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                      <p>Dans Google Chrome ou Microsoft Edge, regardez tout à droite de la barre d'adresse pour trouver l'icône d'ordinateur <strong>« Installer »</strong>.</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="w-6 h-6 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                      <p>Ou cliquez sur le menu <strong>⋮ (trois points)</strong> &gt; <strong>Enregistrer et partager</strong> &gt; <strong>Installer CongoBiz</strong>.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {isInstallable ? (
                <button
                  disabled={isPrompting}
                  onClick={async () => {
                    setIsPrompting(true);
                    await install();
                    setIsPrompting(false);
                    setShowModal(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isPrompting ? 'Installation en cours...' : 'Lancer l\'installation immédiate'}
                </button>
              ) : (
                <div className="text-[11px] text-neutral-500 text-center sm:text-left flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Suivez les étapes ci-dessus sur votre téléphone Android ou iPhone</span>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-xl transition"
              >
                J'ai compris / Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
