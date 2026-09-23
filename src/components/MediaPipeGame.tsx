import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TopicLevel, PAIQuestionItem, HandGestureState } from '../types/game';
import { MediaPipeCursor } from './MediaPipeCursor';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ChevronLeft, 
  Camera, 
  CameraOff, 
  Hand, 
  Zap, 
  CheckCircle2, 
  BookOpen, 
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface MediaPipeGameProps {
  currentLevel: TopicLevel;
  gestureState: HandGestureState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoadingMediaPipe: boolean;
  mediaPipeError: string | null;
  cameraActive: boolean;
  onToggleCamera: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExitLevel: () => void;
  onCompleteLevel: (score: number, mistakes: number, timeSpentSec: number) => void;
  onOpenHelp: () => void;
}

export const MediaPipeGame: React.FC<MediaPipeGameProps> = ({
  currentLevel,
  gestureState,
  videoRef,
  canvasRef,
  isLoadingMediaPipe,
  mediaPipeError,
  cameraActive,
  onToggleCamera,
  soundEnabled,
  onToggleSound,
  onExitLevel,
  onCompleteLevel,
  onOpenHelp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Matched items state
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [mistakes, setMistakes] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; sub?: string; ok: boolean } | null>(null);

  // Background view mode: 'mirror' (large camera mirror) vs 'card-focus' (subtle background)
  const [viewStyle, setViewStyle] = useState<'mirror' | 'card-focus'>('mirror');

  // Dwell hover state for hands-free pointing
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const hoverStartTimeRef = useRef<number | null>(null);
  const lastPinchStateRef = useRef<boolean>(false);

  // Active question to be solved
  const activeQuestion: PAIQuestionItem | null = useMemo(() => {
    return currentLevel.items.find((item) => !matchedIds.includes(item.id)) || null;
  }, [currentLevel, matchedIds]);

  // Shuffled answer options
  const answersList = useMemo(() => {
    const items = [...currentLevel.items];
    for (let i = items.length - 1; i > 0; i--) {
      const j = (i * 11 + 5) % (i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [currentLevel]);

  // Auto-speak question when active question changes
  useEffect(() => {
    if (activeQuestion && soundEnabled) {
      const timer = setTimeout(() => {
        soundEngine.speakText(activeQuestion.question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeQuestion, soundEnabled]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Process Hand Gesture Hit-Testing
  useEffect(() => {
    if (!gestureState.isDetected || !containerRef.current || !activeQuestion) {
      setHoveredCardId(null);
      setDwellProgress(0);
      hoverStartTimeRef.current = null;
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const cursorPixelX = containerRect.left + gestureState.x * containerRect.width;
    const cursorPixelY = containerRect.top + gestureState.y * containerRect.height;

    // Check hit test across all answer cards
    let targetHitId: string | null = null;
    answersList.forEach((item) => {
      const el = document.getElementById(`ans-card-${item.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          cursorPixelX >= rect.left &&
          cursorPixelX <= rect.right &&
          cursorPixelY >= rect.top &&
          cursorPixelY <= rect.bottom
        ) {
          targetHitId = item.id;
        }
      }
    });

    if (targetHitId && !matchedIds.includes(targetHitId)) {
      setHoveredCardId(targetHitId);

      // Check Pinch Trigger
      const isJustPinched = gestureState.isPinching && !lastPinchStateRef.current;
      if (isJustPinched || gestureState.isPinching) {
        // Triggered via MediaPipe Pinch!
        handleSelectAnswer(targetHitId);
        setDwellProgress(0);
        hoverStartTimeRef.current = null;
      } else {
        // Dwell hover timer (0.85s point to select)
        if (!hoverStartTimeRef.current) {
          hoverStartTimeRef.current = Date.now();
        }
        const elapsed = Date.now() - hoverStartTimeRef.current;
        const progress = Math.min(elapsed / 850, 1);
        setDwellProgress(progress);

        if (progress >= 1) {
          handleSelectAnswer(targetHitId);
          setDwellProgress(0);
          hoverStartTimeRef.current = null;
        }
      }
    } else {
      setHoveredCardId(null);
      setDwellProgress(0);
      hoverStartTimeRef.current = null;
    }

    lastPinchStateRef.current = gestureState.isPinching;
  }, [gestureState, activeQuestion, answersList, matchedIds]);

  // Answer matching logic
  const handleSelectAnswer = (selectedId: string) => {
    if (!activeQuestion) return;

    if (selectedId === activeQuestion.id) {
      // Correct!
      const points = 100 * combo;
      const nextScore = score + points;
      const nextCombo = combo + 1;
      const nextMatched = [...matchedIds, selectedId];

      soundEngine.playMatchSuccess(combo);
      setScore(nextScore);
      setCombo(nextCombo);
      setMatchedIds(nextMatched);

      setFeedbackToast({
        text: `MUMTAZ! +${points} POIN`,
        sub: activeQuestion.explanation,
        ok: true,
      });

      setTimeout(() => setFeedbackToast(null), 2500);

      // Check completion
      if (nextMatched.length >= currentLevel.items.length) {
        setTimeout(() => {
          const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          onCompleteLevel(nextScore, mistakes, timeSpent);
        }, 1200);
      }
    } else {
      // Wrong
      soundEngine.playWrong();
      setMistakes((m) => m + 1);
      setCombo(1);

      setFeedbackToast({
        text: 'BISMILLAH, COBA LAGI YA!',
        sub: 'Buka atau arahkan telunjukmu ke jawaban yang lebih tepat.',
        ok: false,
      });

      setTimeout(() => setFeedbackToast(null), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden touch-none"
    >
      {/* 1. CAMERA & MEDIAPIPE CANVAS SKELETON LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Mirrored Webcam Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
            cameraActive ? (viewStyle === 'mirror' ? 'opacity-35' : 'opacity-15') : 'opacity-0'
          }`}
        />

        {/* MediaPipe Hand Skeleton Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Cyber grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* 2. TOP BAR HUD (MediaPipe Status & Smartboard Controls) */}
      <header className="px-4 sm:px-6 py-3 bg-slate-900/80 border-b border-emerald-500/30 backdrop-blur-md flex items-center justify-between z-30 shrink-0 shadow-lg">
        {/* Left: Back & Level Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExitLevel();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Pilih Materi</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-amber-400 font-mono tracking-wide">{currentLevel.badgeText}</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-200 font-semibold">{currentLevel.title}</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                {isLoadingMediaPipe ? (
                  <span className="text-amber-400 animate-pulse">Memuat MediaPipe Vision...</span>
                ) : gestureState.isDetected ? (
                  <span className="text-emerald-300 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Tangan Terdeteksi (MediaPipe Aktif)
                  </span>
                ) : (
                  <span className="text-slate-400">Angkat tanganmu ke depan kamera</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Score & Progress */}
        <div className="flex items-center gap-3 sm:gap-6 bg-slate-950/70 px-4 py-1.5 rounded-xl border border-slate-800">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 font-medium">SKOR</div>
            <div className="text-sm sm:text-base font-bold text-amber-400 font-mono tabular-nums">
              {score}
            </div>
          </div>
          <div className="border-x border-slate-800 px-3 text-center">
            <div className="text-[10px] text-slate-400 font-medium">COMBO</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {combo}x
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 font-medium">SELESAI</div>
            <div className="text-sm sm:text-base font-bold text-sky-400 font-mono">
              {matchedIds.length}/{currentLevel.items.length}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Camera Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleCamera();
            }}
            className={`p-2 rounded-xl border transition-colors ${
              cameraActive
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Nyalakan/Matikan Kamera"
          >
            {cameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Help Modal */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenHelp();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Cara Bermain Gestur MediaPipe"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>

          {/* Fullscreen for Interactive Board */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-md transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Papan Tulis'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3. MAIN GAME PLAYFIELD: SOAL (Kiri) vs JAWABAN (Kanan) */}
      <div className="relative flex-1 flex flex-col lg:flex-row items-stretch p-4 sm:p-6 gap-4 sm:gap-6 overflow-y-auto z-20">
        {/* LEFT COLUMN: ACTIVE SOAL PAI CONTAINER */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center">
          {activeQuestion ? (
            <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Decorative aura */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Category & Audio Button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    SOAL #{matchedIds.length + 1}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">{activeQuestion.category}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.speakText(activeQuestion.question);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Dengarkan Soal"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Bacakan</span>
                </button>
              </div>

              {/* Big Question Text */}
              <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
                {activeQuestion.question}
              </h2>

              {/* Arabic Snippet if applicable */}
              {activeQuestion.arabicSnippet && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-right">
                  <span className="text-lg sm:text-xl font-serif text-amber-300 tracking-wider">
                    {activeQuestion.arabicSnippet}
                  </span>
                </div>
              )}

              {/* Instructions badge */}
              <div className="mt-5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200/90 text-xs flex items-center gap-2.5">
                <Hand className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Arahkan telunjukmu ke kartu jawaban di sebelah kanan, lalu <strong className="text-emerald-300">jepit (pinch)</strong> atau <strong className="text-emerald-300">tahan telunjuk</strong> untuk memilih!
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">Semua Soal Berhasil Dijawab!</div>
              <div className="text-xs text-slate-400 mt-1">Memproses hasil akhir...</div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FLOATING TARGET ANSWERS (MediaPipe Interactive Target Cards) */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center gap-3 sm:gap-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Pilihan Jawaban (Arahkan Tanganmu)</span>
            <span className="text-emerald-400 text-[11px] font-normal">
              Bisa juga diketuk langsung di layar sentuh
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {answersList.map((item, idx) => {
              const isMatched = matchedIds.includes(item.id);
              const isHovered = hoveredCardId === item.id;

              return (
                <div
                  key={item.id}
                  id={`ans-card-${item.id}`}
                  onClick={() => handleSelectAnswer(item.id)}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 backdrop-blur-xl shadow-lg cursor-pointer flex flex-col justify-between min-h-[110px] ${
                    isMatched
                      ? 'bg-slate-900/60 border-emerald-500/40 opacity-40 pointer-events-none'
                      : isHovered
                      ? 'bg-emerald-950/80 border-emerald-400 ring-4 ring-emerald-400/30 scale-[1.03] shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-emerald-400/60 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Top card metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono text-emerald-400 font-bold">
                      JAWABAN #{String.fromCharCode(65 + idx)}
                    </span>
                    {isMatched && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Cocok
                      </span>
                    )}
                  </div>

                  {/* Answer text */}
                  <div className="text-sm sm:text-base font-bold text-white leading-snug">
                    {item.answer}
                  </div>

                  {/* Dwell Selection Progress Bar on this card */}
                  {isHovered && dwellProgress > 0 && dwellProgress < 1 && (
                    <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-75"
                        style={{ width: `${dwellProgress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MEDIAPIPE GESTURE CURSOR OVERLAY */}
      <MediaPipeCursor
        gestureState={gestureState}
        dwellProgress={dwellProgress}
        isGrabbing={gestureState.isPinching}
      />

      {/* 5. MATCH FEEDBACK TOAST */}
      {feedbackToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4 transition-all">
          <div
            className={`p-4 rounded-2xl border-2 backdrop-blur-xl shadow-2xl text-center animate-bounce duration-500 ${
              feedbackToast.ok
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 ring-4 ring-emerald-500/20'
                : 'bg-rose-950/95 border-rose-400 text-rose-200 ring-4 ring-rose-500/20'
            }`}
          >
            <div className="text-base sm:text-lg font-extrabold">{feedbackToast.text}</div>
            {feedbackToast.sub && (
              <div className="mt-1 text-xs opacity-90 leading-tight">{feedbackToast.sub}</div>
            )}
          </div>
        </div>
      )}

      {/* 6. BOTTOM BAR: GESTURE STATUS GUIDE */}
      <footer className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-emerald-400">💡 Panduan Gestur MediaPipe:</span>
          <span>Arahkan ujung telunjuk ke jawaban ➔ Jepit (pinch) atau tahan sebentar untuk memilih.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewStyle(viewStyle === 'mirror' ? 'card-focus' : 'mirror')}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            {viewStyle === 'mirror' ? 'Ubah: Fokus Kartu' : 'Ubah: Cermin Penuh'}
          </button>
        </div>
      </footer>
    </div>
  );
};
