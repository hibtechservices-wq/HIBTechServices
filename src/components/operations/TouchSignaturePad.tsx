import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, Sparkles } from 'lucide-react';

interface TouchSignaturePadProps {
  value?: string;
  onChange: (base64Signature: string) => void;
  label?: string;
  signeeName?: string;
}

export const TouchSignaturePad: React.FC<TouchSignaturePadProps> = ({
  value,
  onChange,
  label = 'Signature Tactile du Client',
  signeeName = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setHasDrawn(true);
    }
  }, [value]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset with clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle signature guideline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Watermark text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('X Signer ici (doigt ou stylet)', 24, canvas.height - 18);

    // If there is existing value
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => initCanvas(), 50);
    }
  }, [isModalOpen]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a'; // Deep ink blue/slate
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw guideline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('X Signer ici (doigt ou stylet)', 24, canvas.height - 18);

    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-400" /> {label}
        </label>
        {value && (
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Signature apposée
          </span>
        )}
      </div>

      {value ? (
        <div className="relative border border-slate-700 bg-white rounded-xl p-2 flex flex-col items-center">
          <img
            src={value}
            alt="Signature"
            className="h-20 object-contain max-w-full"
          />
          <div className="w-full mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">
              {signeeName ? `Signé par : ${signeeName}` : 'Signature enregistrée'}
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Modifier / Remplacer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/60 hover:bg-slate-800/60 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-300 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <PenTool className="w-5 h-5" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-white block">
              Cliquer pour signer sur l'écran
            </span>
            <span className="text-[10px] text-slate-400">
              Compatible smartphone, tablette ou souris PC
            </span>
          </div>
        </button>
      )}

      {/* Signature Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-400" /> Signature Tactile & Bon de Réception
                </h4>
                <p className="text-[11px] text-slate-400">
                  {signeeName ? `Apposition du visa de ${signeeName}` : "Signez à l'aide de votre doigt ou d'un stylet"}
                </p>
              </div>
            </div>

            {/* Canvas Box */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <canvas
                ref={canvasRef}
                width={450}
                height={220}
                className="w-full touch-none cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tracer la signature au centre</span>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-slate-300 hover:text-red-400 transition-colors cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Effacer
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasDrawn}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Valider la Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
