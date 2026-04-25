import { useRef, useState, useCallback, useEffect } from 'react';

const REQUIRED_SECONDS = 60;

export function useSpeechRecognition({ onComplete, onUpdate, onTranscript, active }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenSeconds, setSpokenSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef(null);
  const speakingStartRef = useRef(null);
  const totalSpokenRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const completedRef = useRef(false);
  const activeRef = useRef(active);
  const finalTranscriptRef = useRef('');

  useEffect(() => { activeRef.current = active; }, [active]);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }
  }, []);

  const accumulateSpokenTime = useCallback(() => {
    if (speakingStartRef.current !== null) {
      const elapsed = (Date.now() - speakingStartRef.current) / 1000;
      totalSpokenRef.current = Math.min(
        totalSpokenRef.current + elapsed,
        REQUIRED_SECONDS
      );
      speakingStartRef.current = null;
      const rounded = Math.floor(totalSpokenRef.current);
      setSpokenSeconds(rounded);
      onUpdate && onUpdate(rounded);

      if (totalSpokenRef.current >= REQUIRED_SECONDS && !completedRef.current) {
        completedRef.current = true;
        stopListening();
        onComplete && onComplete();
      }
    }
  }, [onComplete, onUpdate]);

  const createRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onspeechstart = () => {
      clearTimeout(silenceTimerRef.current);
      setIsSpeaking(true);
      speakingStartRef.current = Date.now();
    };

    recognition.onspeechend = () => {
      accumulateSpokenTime();
      setIsSpeaking(false);
      setInterimTranscript('');
      silenceTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, 500);
    };

    recognition.onresult = (event) => {
      // Heartbeat: if we get results, we're definitely speaking
      if (speakingStartRef.current === null) {
        speakingStartRef.current = Date.now();
        setIsSpeaking(true);
      }

      let interim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          newFinal += text + ' ';
        } else {
          interim += text;
        }
      }

      if (newFinal) {
        finalTranscriptRef.current += newFinal;
        setFinalTranscript(finalTranscriptRef.current);
        onTranscript && onTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return;
      if (e.error === 'aborted') return;
      setError(`Mic error: ${e.error}`);
      setIsSpeaking(false);
      accumulateSpokenTime();
    };

    recognition.onend = () => {
      accumulateSpokenTime();
      setIsSpeaking(false);
      setInterimTranscript('');
      // Auto-restart if still supposed to be listening
      if (activeRef.current && !completedRef.current) {
        try {
          recognition.start();
        } catch (_) { /* ignore */ }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [accumulateSpokenTime]);

  const startListening = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = false;

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
    }
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        setError(`Could not start mic: ${e.message}`);
      }
    }
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    accumulateSpokenTime();
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) { /* ignore */ }
    }
    setIsListening(false);
    setIsSpeaking(false);
    setInterimTranscript('');
  }, [accumulateSpokenTime]);

  const reset = useCallback(() => {
    stopListening();
    totalSpokenRef.current = 0;
    speakingStartRef.current = null;
    completedRef.current = false;
    recognitionRef.current = null;
    finalTranscriptRef.current = '';
    setSpokenSeconds(0);
    setFinalTranscript('');
    setInterimTranscript('');
    setIsListening(false);
    setIsSpeaking(false);
    setError(null);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    spokenSeconds,
    finalTranscript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    reset,
    requiredSeconds: REQUIRED_SECONDS,
  };
}
