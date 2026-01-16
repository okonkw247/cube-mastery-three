import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Trophy, Timer, TrendingUp, TrendingDown, Minus, Volume2, VolumeX } from "lucide-react";
import { usePracticeAttempts } from "@/hooks/usePracticeAttempts";
import confetti from "canvas-confetti";

interface Props {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type Phase = "ready" | "countdown" | "running" | "paused" | "completed";

// Audio context for timer sounds
const createTickSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

const createCountdownBeep = (audioContext: AudioContext, isLast: boolean) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = isLast ? 1200 : 600;
  oscillator.type = "sine";
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};

export function PracticeCoach({ lessonId, lessonTitle, open, onOpenChange, onComplete }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSecondRef = useRef<number>(0);

  const { addAttempt, getBestTimeForLesson, getLastAttemptForLesson } = usePracticeAttempts();
  const bestTime = getBestTimeForLesson(lessonId);
  const lastAttempt = getLastAttemptForLesson(lessonId);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      createTickSound(ctx);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled, getAudioContext]);

  const playCountdownBeep = useCallback((isLast: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      createCountdownBeep(ctx, isLast);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled, getAudioContext]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  // Countdown phase
  useEffect(() => {
    if (phase === "countdown" && countdown > 0) {
      playCountdownBeep(countdown === 1);
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "countdown" && countdown === 0) {
      playCountdownBeep(true);
      setPhase("running");
    }
  }, [phase, countdown, playCountdownBeep]);

  // Running phase with tick sounds
  useEffect(() => {
    if (phase === "running") {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const newElapsed = prev + 100;
          const currentSecond = Math.floor(newElapsed / 1000);
          
          // Play tick every second
          if (currentSecond > lastSecondRef.current) {
            lastSecondRef.current = currentSecond;
            playTick();
          }
          
          return newElapsed;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, playTick]);

  const reset = () => {
    setPhase("ready");
    setCountdown(3);
    setElapsed(0);
    setShowCelebration(false);
    lastSecondRef.current = 0;
  };

  const handleStart = () => {
    setPhase("countdown");
  };

  const handleStop = async () => {
    setPhase("completed");
    const seconds = Math.round(elapsed / 1000);
    await addAttempt(lessonId, seconds);

    const isNewBest = !bestTime || seconds < bestTime;
    if (isNewBest) {
      setShowCelebration(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const currentSeconds = Math.round(elapsed / 1000);
  const comparison = lastAttempt
    ? currentSeconds - lastAttempt.duration_seconds
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              {t('practice.practiceCoach')}: {lessonTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="py-8 text-center">
          {phase === "ready" && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Timer className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('lessons.startPractice')}?</h3>
                <p className="text-sm text-muted-foreground">
                  {t('common.click')} {t('common.play')} {t('common.to')} {t('common.getStarted')}
                </p>
              </div>
              <Button size="lg" onClick={handleStart} className="px-12">
                <Play className="w-5 h-5 mr-2" />
                {t('practice.startTimer')}
              </Button>
            </div>
          )}

          {phase === "countdown" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">{t('common.getStarted')}!</p>
              <div className="text-8xl font-bold text-primary animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {(phase === "running" || phase === "paused") && (
            <div className="space-y-6">
              <div className="text-6xl font-mono font-bold">{formatTime(elapsed)}</div>

              {lastAttempt && phase === "running" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {comparison !== null && (
                    <>
                      {comparison < 0 ? (
                        <TrendingDown className="w-4 h-4 text-primary" />
                      ) : comparison > 0 ? (
                        <TrendingUp className="w-4 h-4 text-destructive" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      <span>
                        {comparison < 0 
                          ? t('practice.faster', { seconds: Math.abs(comparison) })
                          : comparison > 0 
                            ? t('practice.slower', { seconds: comparison })
                            : t('practice.samePace')}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPhase(phase === "running" ? "paused" : "running")}
                >
                  {phase === "running" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button size="lg" onClick={handleStop} className="px-8">
                  {t('practice.stopTimer')}
                </Button>
              </div>
            </div>
          )}

          {phase === "completed" && (
            <div className="space-y-6">
              {showCelebration ? (
                <div className="space-y-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                  <h3 className="text-2xl font-bold text-primary">{t('practice.bestTime')}!</h3>
                </div>
              ) : (
                <h3 className="text-xl font-semibold">{t('lessons.completed')}!</h3>
              )}

              <div className="text-5xl font-mono font-bold">{formatTime(elapsed)}</div>

              {bestTime && !showCelebration && (
                <p className="text-sm text-muted-foreground">
                  {t('practice.bestTime')}: {Math.floor(bestTime / 60)}:{(bestTime % 60).toString().padStart(2, "0")}
                </p>
              )}

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-2" /> {t('practice.reset')}
                </Button>
                <Button onClick={() => { onOpenChange(false); onComplete?.(); }}>
                  {t('common.continue')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {bestTime && phase !== "completed" && phase !== "ready" && (
          <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
            <span className="flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {t('practice.bestTime')}: {Math.floor(bestTime / 60)}:{(bestTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}