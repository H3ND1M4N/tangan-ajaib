import React, { useState } from 'react';
import { PAI_LEVELS } from './data/paiQuestions';
import { TopicLevel, PlayerScoreRecord } from './types/game';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { LevelSelect } from './components/LevelSelect';
import { MediaPipeGame } from './components/MediaPipeGame';
import { CompletionModal } from './components/CompletionModal';
import { HelpModal } from './components/HelpModal';
import { soundEngine } from './utils/audio';

const STORAGE_KEY_SCORES = 'pai_sd_mediapipe_scores_v1';

export default function App() {
  // Screen routing: 'menu' | 'playing'
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'playing'>('menu');
  const [currentLevel, setCurrentLevel] = useState<TopicLevel>(PAI_LEVELS[0]);

  // Modals state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Score & game finish state
  const [completedStats, setCompletedStats] = useState<{
    score: number;
    mistakes: number;
    timeSpentSec: number;
  } | null>(null);

  // Persistent score registry
  const [scores, setScores] = useState<Record<string, PlayerScoreRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCORES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // MediaPipe Vision AI Hook
  const {
    videoRef,
    canvasRef,
    gestureState,
    isLoading: isLoadingMediaPipe,
    error: mediaPipeError,
    cameraActive,
    setCameraActive,
  } = useMediaPipeHands();

  // Sound toggle
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundEngine.setSoundEnabled(nextState);
  };

  // Start selected level
  const handleSelectLevel = (level: TopicLevel) => {
    setCurrentLevel(level);
    setCompletedStats(null);
    setCurrentScreen('playing');
  };

  // Game completed handler
  const handleGameComplete = (score: number, mistakes: number, timeSpentSec: number) => {
    setCompletedStats({ score, mistakes, timeSpentSec });

    const totalItems = currentLevel.items.length;
    const totalAttempts = totalItems + mistakes;
    const accuracy = Math.round((totalItems / Math.max(1, totalAttempts)) * 100);

    let stars: 1 | 2 | 3 = 1;
    if (mistakes === 0) {
      stars = 3;
    } else if (mistakes <= 2) {
      stars = 2;
    }

    const newRecord: PlayerScoreRecord = {
      levelId: currentLevel.id,
      levelTitle: currentLevel.title,
      score,
      stars,
      accuracy,
      date: new Date().toISOString(),
    };

    setScores((prev) => {
      const existing = prev[currentLevel.id];
      if (!existing || score > existing.score) {
        const updated = { ...prev, [currentLevel.id]: newRecord };
        try {
          localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(updated));
        } catch {
          // Fallback
        }
        return updated;
      }
      return prev;
    });
  };

  // Level Progression
  const currentIndex = PAI_LEVELS.findIndex((lvl) => lvl.id === currentLevel.id);
  const hasNextLevel = currentIndex >= 0 && currentIndex < PAI_LEVELS.length - 1;

  const handleNextLevel = () => {
    if (hasNextLevel) {
      handleSelectLevel(PAI_LEVELS[currentIndex + 1]);
    } else {
      setCurrentScreen('menu');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 1. MAIN MENU & LEVEL SELECTION SCREEN */}
      {currentScreen === 'menu' && (
        <div className="w-full h-full overflow-y-auto">
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            scores={scores}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenHelpModal={() => setIsHelpModalOpen(true)}
            gestureState={gestureState}
            isLoadingMediaPipe={isLoadingMediaPipe}
            mediaPipeError={mediaPipeError}
            cameraActive={cameraActive}
            onToggleCamera={() => setCameraActive(!cameraActive)}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
        </div>
      )}

      {/* 2. PLAYING SCREEN: MEDIAPIPE GESTURE GAME */}
      {currentScreen === 'playing' && (
        <div className="relative w-full h-full">
          <MediaPipeGame
            currentLevel={currentLevel}
            gestureState={gestureState}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isLoadingMediaPipe={isLoadingMediaPipe}
            mediaPipeError={mediaPipeError}
            cameraActive={cameraActive}
            onToggleCamera={() => setCameraActive(!cameraActive)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onExitLevel={() => {
              soundEngine.stopSpeaking();
              setCurrentScreen('menu');
            }}
            onCompleteLevel={handleGameComplete}
            onOpenHelp={() => setIsHelpModalOpen(true)}
          />

          {/* Victory Modal */}
          {completedStats && (
            <CompletionModal
              level={currentLevel}
              score={completedStats.score}
              stars={
                completedStats.mistakes === 0
                  ? 3
                  : completedStats.mistakes <= 2
                  ? 2
                  : 1
              }
              accuracy={Math.round(
                (currentLevel.items.length /
                  Math.max(1, currentLevel.items.length + completedStats.mistakes)) *
                  100
              )}
              timeSpentSec={completedStats.timeSpentSec}
              onReplay={() => handleSelectLevel(currentLevel)}
              onNextLevel={handleNextLevel}
              onBackToMenu={() => setCurrentScreen('menu')}
              hasNextLevel={hasNextLevel}
            />
          )}
        </div>
      )}

      {/* 3. HELP & GESTURE INSTRUCTIONS MODAL */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
