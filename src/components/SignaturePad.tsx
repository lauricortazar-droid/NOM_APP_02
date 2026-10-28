import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  signerName: string;
  signerRole: string;
}

export default function SignaturePad({ onSave, onCancel, signerName, signerRole }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0E2A47';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Captura de Firma Digital en Pantalla</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Firmante: <span className="font-semibold text-slate-800">{signerName}</span> ({signerRole})
          </p>
        </div>

        {/* Lienzo Interactivo */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={450}
            height={180}
            className="w-full h-44 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="w-full text-center py-1 text-[11px] text-slate-400 bg-white/70 border-t border-slate-200">
            Dibuja tu firma con el dedo o puntero sobre esta área
          </div>
        </div>

        {/* Aviso Legal Obligatorio según Especificación */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 leading-tight">
          <strong>Aviso institucional:</strong> La firma capturada en pantalla no equivale por sí sola a una firma electrónica avanzada (e.firma). Verifica con asesoría legal y la normatividad sanitaria correspondiente su validez para este documento institucional.
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs px-3 py-2 text-slate-600 hover:text-slate-900 font-medium underline"
          >
            Borrar trazo
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!hasContent}
              onClick={handleConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow transition ${
                hasContent ? 'bg-[#0E2A47] hover:bg-[#153a61]' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              Confirmar y Estampar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
