import React from 'react';
import { HandGestureState } from '../types/game';
import { Hand, Sparkles } from 'lucide-react';

interface MediaPipeCursorProps {
  gestureState: HandGestureState;
  dwellProgress?: number; // 0 to 1
  isGrabbing?: boolean;
}

export const MediaPipeCursor: React.FC<MediaPipeCursorProps> = ({
  gestureState,
  dwellProgress = 0,
  isGrabbing = false,
}) => {
  if (!gestureState.isDetected) {
    return null;
  }

  // Position is normalized (0 to 1) -> percentage
  const posX = `${gestureState.x * 100}%`;
  const posY = `${gestureState.y * 100}%`;

  const isPinching = gestureState.isPinching || isGrabbing;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
      style={{ left: posX, top: posY }}
    >
      {/* Outer Dwell Progress Ring */}
      {dwellProgress > 0 && dwellProgress < 1 && (
        <svg className="w-20 h-20 -m-10 absolute inset-0 -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeDasharray={200}
            strokeDashoffset={200 * (1 - dwellProgress)}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Main Cursor Core */}
      <div className="relative flex items-center justify-center">
        {/* Pulsating outer reticle */}
        <div
          className={`w-12 h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
            isPinching
              ? 'scale-75 border-amber-400 bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
              : 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
          }`}
        >
          {/* Center target dot */}
          <div
            className={`w-3 h-3 rounded-full ${
              isPinching ? 'bg-amber-300' : 'bg-white'
            }`}
          />
        </div>

        {/* Hand Status Floating Tag */}
        <div
          className={`absolute top-10 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider backdrop-blur-md shadow-md flex items-center gap-1 border ${
            isPinching
              ? 'bg-amber-950/90 text-amber-300 border-amber-400/60'
              : 'bg-slate-900/90 text-emerald-300 border-emerald-400/50'
          }`}
        >
          {isPinching ? (
            <>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PINCH / MEMEGANG</span>
            </>
          ) : (
            <>
              <Hand className="w-3 h-3 text-emerald-400" />
              <span>ARAHKAN / JEPIT</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
