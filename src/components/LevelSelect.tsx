import React, { useState } from 'react';
import { PAI_LEVELS } from '../data/paiQuestions';
import { TopicLevel, GradeLevel, PlayerScoreRecord, HandGestureState } from '../types/game';
import { MediaPipeHandPreview } from './MediaPipeHandPreview';
import { 
  Sparkles, 
  Star, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Hand,
  Play,
  Award
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface LevelSelectProps {
  onSelectLevel: (level: TopicLevel) => void;
  scores: Record<string, PlayerScoreRecord>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelpModal: () => void;
  gestureState: HandGestureState;
  isLoadingMediaPipe: boolean;
  mediaPipeError: string | null;
  cameraActive: boolean;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  onSelectLevel,
  scores,
  soundEnabled,
  onToggleSound,
  onOpenHelpModal,
  gestureState,
  isLoadingMediaPipe,
  mediaPipeError,
  cameraActive,
  onToggleCamera,
  videoRef,
  canvasRef,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'semua'>('semua');

  const filteredLevels = PAI_LEVELS.filter((level) => {
    if (selectedGrade === 'semua') return true;
    return level.grade === selectedGrade;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP BAR */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Hand className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              PAI SD · MediaPipe Gestur
            </span>
          </div>
        </div>

        {/* Grade Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setSelectedGrade('semua')}
            className={`transition-colors ${selectedGrade === 'semua' ? 'text-amber-400 font-semibold' : 'hover:text-white'}`}
          >
            Semua Modul
          </button>
          <button
            type="button"
            onClick={() => setSelectedGrade('kelas-1-2')}
            className={`transition-colors ${selectedGrade === 'kelas-1-2' ? 'text-amber-400 font-semibold' : 'hover:text-white'}`}
          >
            Kelas 1 - 2 SD
          </button>
          <button
            type="button"
            onClick={() => setSelectedGrade('kelas-3-4')}
            className={`transition-colors ${selectedGrade === 'kelas-3-4' ? 'text-amber-400 font-semibold' : 'hover:text-white'}`}
          >
            Kelas 3 - 4 SD
          </button>
          <button
            type="button"
            onClick={() => setSelectedGrade('kelas-5-6')}
            className={`transition-colors ${selectedGrade === 'kelas-5-6' ? 'text-amber-400 font-semibold' : 'hover:text-white'}`}
          >
            Kelas 5 - 6 SD
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenHelpModal();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Cara Bermain Gestur MediaPipe"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </header>

      {/* 2. HERO & MEDIAPIPE CALIBRATION SECTION */}
      <section className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Intro */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Teknologi Google MediaPipe Hand Tracking</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Mencocokkan Soal PAI dengan Gerakan Tangan
            </h1>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Mainkan Pendidikan Agama Islam secara interaktif di depan kamera atau layar sentuh kelas! Cukup angkat tanganmu, arahkan telunjuk ke kartu jawaban, lalu jepit <span className="text-amber-400 font-semibold">(pinch)</span> untuk mencocokkan.
            </p>

            {/* Segmented Filter Pills */}
            <div className="mt-6 flex flex-wrap gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGrade('semua');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedGrade === 'semua'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Tingkat
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGrade('kelas-1-2');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedGrade === 'kelas-1-2'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kelas 1 - 2
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGrade('kelas-3-4');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedGrade === 'kelas-3-4'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kelas 3 - 4
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedGrade('kelas-5-6');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedGrade === 'kelas-5-6'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kelas 5 - 6
              </button>
            </div>
          </div>

          {/* Right Live Camera MediaPipe Hand Calibration Pod */}
          <div className="lg:col-span-5">
            <MediaPipeHandPreview
              gestureState={gestureState}
              isLoading={isLoadingMediaPipe}
              error={mediaPipeError}
              cameraActive={cameraActive}
              onToggleCamera={onToggleCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
            />
          </div>
        </div>
      </section>

      {/* 3. LEVEL CARDS GRID */}
      <section className="px-4 sm:px-8 pb-16 max-w-5xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredLevels.map((lvl) => {
            const record = scores[lvl.id];
            const isCompleted = !!record;

            return (
              <div
                key={lvl.id}
                className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 hover:border-emerald-500/50 transition-all duration-200 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-semibold font-mono">{lvl.badgeText}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lvl.items.length} Soal</span>
                    </div>

                    {record && (
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= record.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {lvl.title}
                  </h3>
                  <div className="text-xs text-emerald-400/90 font-medium mt-0.5">
                    {lvl.subTitle}
                  </div>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {lvl.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>Pokok Bahasan:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs text-slate-300">
                      {lvl.items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="bg-slate-800/60 px-2 py-0.5 rounded text-[11px] text-slate-300"
                        >
                          {item.answer}
                        </span>
                      ))}
                      {lvl.items.length > 3 && (
                        <span className="text-[11px] text-slate-500 self-center">
                          +{lvl.items.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 font-mono tabular-nums">
                    {record ? (
                      <span className="text-emerald-400 font-semibold">
                        Skor: {record.score} pts ({record.accuracy}%)
                      </span>
                    ) : (
                      <span className="text-slate-500">Belum dimainkan</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectLevel(lvl);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 group-hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCompleted ? 'Main Ulang' : 'Mulai Main'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <p>Game Edukasi PAI SD · Didukung Google MediaPipe AI Hand Landmark Tracking</p>
      </footer>
    </div>
  );
};
