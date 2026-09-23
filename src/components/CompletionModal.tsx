import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TopicLevel, PlayerScoreRecord } from '../types/game';
import { Star, Trophy, RotateCcw, ArrowRight, Home, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface CompletionModalProps {
  level: TopicLevel;
  score: number;
  stars: number;
  accuracy: number;
  timeSpentSec: number;
  onReplay: () => void;
  onNextLevel: () => void;
  onBackToMenu: () => void;
  hasNextLevel: boolean;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  level,
  score,
  stars,
  accuracy,
  timeSpentSec,
  onReplay,
  onNextLevel,
  onBackToMenu,
  hasNextLevel,
}) => {
  useEffect(() => {
    soundEngine.playCelebration();

    // Trigger celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden my-8">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            Alhamdulillah · Selesai!
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stars === 3 ? 'Mumtaz! (Luar Biasa)' : stars === 2 ? 'Jayyid Jiddan! (Sangat Baik)' : 'Bagus Sekali!'}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Kamu berhasil menyelesaikan materi <span className="text-amber-400 font-semibold">{level.title}</span> dengan gerakan tangan MediaPipe!
          </p>

          {/* Stars display */}
          <div className="flex items-center justify-center gap-2 my-5">
            {[1, 2, 3].map((starIdx) => (
              <div
                key={starIdx}
                className={`p-2 rounded-xl border transition-all duration-300 ${
                  starIdx <= stars
                    ? 'bg-amber-500/20 border-amber-500/60 scale-110'
                    : 'bg-slate-800/40 border-slate-700/50 opacity-40'
                }`}
              >
                <Star
                  className={`w-7 h-7 ${
                    starIdx <= stars ? 'fill-amber-400 text-amber-400 animate-bounce' : 'text-slate-600'
                  }`}
                  style={{ animationDelay: `${starIdx * 150}ms`, animationIterationCount: 2 }}
                />
              </div>
            ))}
          </div>

          {/* Performance Stats Metrics (NO PILLS - Clean unboxed tabular stats) */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center mb-6">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Skor</div>
              <div className="text-base sm:text-lg font-bold text-amber-400 font-mono tabular-nums">
                {score}
              </div>
            </div>
            <div className="border-x border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Akurasi</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono tabular-nums">
                {accuracy}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Waktu</div>
              <div className="text-base sm:text-lg font-bold text-sky-400 font-mono tabular-nums">
                {timeSpentSec}s
              </div>
            </div>
          </div>
        </div>

        {/* Learning Review Summary Accordion */}
        <div className="mb-6 max-h-48 overflow-y-auto pr-1 text-left space-y-2 text-xs border-y border-slate-800 py-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Rangkuman Materi yang Kamu Kuasai:</span>
          </div>
          {level.items.map((item) => (
            <div key={item.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item.answer}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 pl-5 leading-relaxed">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onReplay();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Ulang</span>
          </button>

          {hasNextLevel && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNextLevel();
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Materi Lanjutan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToMenu();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors"
            title="Kembali ke Menu Utama"
          >
            <Home className="w-4 h-4" />
            <span className="sm:hidden">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
