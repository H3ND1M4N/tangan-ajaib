import React, { useState } from 'react';
import { HandGestureState } from '../types/game';
import { Hand, Sparkles, CheckCircle2, Video, Camera } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface MediaPipeHandPreviewProps {
  gestureState: HandGestureState;
  isLoading: boolean;
  error: string | null;
  cameraActive: boolean;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const MediaPipeHandPreview: React.FC<MediaPipeHandPreviewProps> = ({
  gestureState,
  isLoading,
  error,
  cameraActive,
  onToggleCamera,
  videoRef,
  canvasRef,
}) => {
  const [testScore, setTestScore] = useState<number>(0);

  const handleTestPinch = () => {
    soundEngine.playMatchSuccess(1);
    setTestScore((s) => s + 1);
  };

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Hand className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sensor Gestur Tangan (MediaPipe AI)</h3>
            <p className="text-[11px] text-slate-400">Uji coba deteksi tanganmu sebelum bermain</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>{cameraActive ? 'Kamera Aktif' : 'Nyalakan'}</span>
        </button>
      </div>

      {/* Video & Skeleton Canvas Box */}
      <div className="relative w-full h-52 sm:h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Mirrored webcam */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${
            cameraActive ? 'opacity-40' : 'hidden'
          }`}
        />

        {/* Skeleton Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Loading / Status State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div className="text-xs text-emerald-400 font-semibold">Memuat Model MediaPipe AI...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center z-20">
            <div className="text-xs text-rose-400 font-semibold">{error}</div>
            <button
              type="button"
              onClick={onToggleCamera}
              className="mt-2 px-3 py-1 bg-rose-900/60 border border-rose-500 text-rose-200 text-xs rounded-lg"
            >
              Coba Nyalakan Kamera
            </button>
          </div>
        )}

        {/* Status Badge in Corner */}
        <div className="absolute top-3 left-3 z-20">
          {gestureState.isDetected ? (
            <div className="px-3 py-1 bg-emerald-950/90 border border-emerald-400 text-emerald-300 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Tangan Terlacak</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-900/90 border border-slate-700 text-slate-400 rounded-full text-xs flex items-center gap-1.5">
              <span>Angkat tangan ke arah kamera</span>
            </div>
          )}
        </div>

        {/* Interactive Pinch Test Target in center */}
        {gestureState.isDetected && (
          <div
            onClick={handleTestPinch}
            className={`absolute bottom-3 right-3 z-20 p-2.5 rounded-2xl border transition-all ${
              gestureState.isPinching
                ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                : 'bg-slate-900/90 text-emerald-400 border-emerald-500/50'
            }`}
          >
            <div className="text-[10px] font-mono font-bold">
              {gestureState.isPinching ? 'JEPIT / PINCH AKTIF!' : 'COBA JEPIT JARI'}
            </div>
          </div>
        )}
      </div>

      {/* Quick Gestures Guide */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            ☝️
          </div>
          <div className="text-[11px] text-slate-300">
            <strong>Telunjuk:</strong> Arahkan ke kartu jawaban
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            🤏
          </div>
          <div className="text-[11px] text-slate-300">
            <strong>Jepit (Pinch):</strong> Memilih jawaban
          </div>
        </div>
      </div>
    </div>
  );
};
