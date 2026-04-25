import { useRef, useCallback, useEffect } from 'react';

export function useAlarmSound() {
  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainRef = useRef(null);
  const intervalRef = useRef(null);
  const playingRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback((ctx, time, freq, duration) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.05);
    oscillatorsRef.current.push(osc);
  }, []);

  const playPattern = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    // Classic alarm beep pattern: 3 beeps
    playBeep(ctx, now + 0.0, 880, 0.15);
    playBeep(ctx, now + 0.2, 880, 0.15);
    playBeep(ctx, now + 0.4, 1100, 0.2);

    // Clean up old oscillators
    oscillatorsRef.current = oscillatorsRef.current.filter(o => {
      try { return o.context.state !== 'closed'; } catch { return false; }
    });
  }, [getCtx, playBeep]);

  const start = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    playPattern();
    intervalRef.current = setInterval(playPattern, 1000);
  }, [playPattern]);

  const stop = useCallback(() => {
    playingRef.current = false;
    clearInterval(intervalRef.current);
    // Ramp down gracefully
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      oscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch (_) { /* ignore */ }
      });
      oscillatorsRef.current = [];
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stop]);

  return { start, stop };
}
