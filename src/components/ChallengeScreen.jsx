import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { analyzeSpeech } from '../utils/analyzeSpeech';
import './ChallengeScreen.css';

const REQUIRED_SECONDS = 60;
const CIRCUMFERENCE = 2 * Math.PI * 90;

export default function ChallengeScreen({ topic, onDismiss, onSnooze }) {
  const [phase, setPhase] = useState('idle'); // idle | active | done
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [transcriptFull, setTranscriptFull] = useState('');

  const tickerRef = useRef(null);
  const liveStartRef = useRef(null);
  const liveAccRef = useRef(0);
  const analysisTimerRef = useRef(null);

  const handleComplete = useCallback(() => {
    setPhase('done');
    clearInterval(tickerRef.current);
    setTimeout(() => onDismiss(), 2200);
  }, [onDismiss]);

  const handleUpdate = useCallback((seconds) => {
    liveAccRef.current = seconds;
    setLiveSeconds(seconds);
  }, []);

  const handleTranscript = useCallback((text) => {
    setTranscriptFull(text);
    // Debounce analysis updates to every 1.5 seconds
    clearTimeout(analysisTimerRef.current);
    analysisTimerRef.current = setTimeout(() => {
      setAnalysis(analyzeSpeech(text, topic));
    }, 1500);
  }, [topic]);

  const {
    isListening,
    isSpeaking,
    spokenSeconds,
    finalTranscript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onComplete: handleComplete,
    onUpdate: handleUpdate,
    onTranscript: handleTranscript,
    active: phase === 'active',
  });

  // Sync transcript from hook
  useEffect(() => {
    if (finalTranscript) {
      setTranscriptFull(finalTranscript);
    }
  }, [finalTranscript]);

  // Real-time ticker
  useEffect(() => {
    if (isSpeaking) {
      liveStartRef.current = Date.now();
      tickerRef.current = setInterval(() => {
        const extra = (Date.now() - liveStartRef.current) / 1000;
        const live = Math.min(liveAccRef.current + extra, REQUIRED_SECONDS);
        setLiveSeconds(Math.floor(live));
        if (live >= REQUIRED_SECONDS && phase === 'active') {
          clearInterval(tickerRef.current);
        }
      }, 100);
    } else {
      clearInterval(tickerRef.current);
      liveStartRef.current = null;
    }
    return () => clearInterval(tickerRef.current);
  }, [isSpeaking, phase]);

  // Final analysis when done
  useEffect(() => {
    if (phase === 'done' && transcriptFull) {
      setAnalysis(analyzeSpeech(transcriptFull, topic));
    }
  }, [phase, transcriptFull, topic]);

  // Cleanup timers
  useEffect(() => () => clearTimeout(analysisTimerRef.current), []);

  const handleMicClick = () => {
    if (phase === 'idle') {
      setPhase('active');
      startListening();
    } else if (phase === 'active') {
      stopListening();
      setPhase('idle');
    }
  };

  const secondsLeft = Math.max(0, REQUIRED_SECONDS - liveSeconds);
  const progress = liveSeconds / REQUIRED_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const waveBars = Array.from({ length: 24 }, (_, i) => i);

  // Combine final + interim for display
  const displayTranscript = (transcriptFull + (interimTranscript ? ' ' + interimTranscript : '')).trim();

  return (
    <div className="challenge-wrap">
      {/* Alarm banner */}
      <div className="alarm-banner">
        <span className="alarm-bell" role="img" aria-label="alarm">🔔</span>
        <span>ALARM RINGING — Speak to dismiss!</span>
        <span className="alarm-bell" role="img" aria-label="alarm">🔔</span>
      </div>

      <div className="challenge-layout">
        {/* ── LEFT: Mic + Controls ── */}
        <div className="challenge-card glass-card">

          {/* Topic */}
          <div className="topic-section">
            <div className="topic-eyebrow">🎯 Your Challenge Topic</div>
            <div className="topic-text">"{topic}"</div>
            <div className="topic-hint">Pauses are fine — only speaking time counts</div>
          </div>

          {/* Mic ring */}
          <div className="mic-ring-container">
            <svg className="progress-ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="100" cy="100" r="90"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '100px 100px',
                  transition: 'stroke-dashoffset 0.2s ease',
                  filter: phase === 'active' ? 'drop-shadow(0 0 8px rgba(0,229,160,0.6))' : 'none',
                }}
              />
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e5a0" />
                  <stop offset="100%" stopColor="#4a9eff" />
                </linearGradient>
              </defs>
            </svg>

            <button
              className={`mic-btn ${phase === 'active' ? 'mic-active' : ''} ${isSpeaking ? 'mic-speaking' : ''} ${phase === 'done' ? 'mic-done' : ''}`}
              onClick={handleMicClick}
              disabled={!isSupported || phase === 'done'}
              aria-label={phase === 'active' ? 'Stop listening' : 'Start speaking'}
            >
              {phase === 'done' ? (
                <span className="mic-icon">✓</span>
              ) : (
                <svg className="mic-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>

            <div className="ring-counter">
              <div className="ring-seconds">{secondsLeft}</div>
              <div className="ring-seconds-label">sec left</div>
            </div>
          </div>

          {/* Status */}
          <div className={`status-badge ${isSpeaking ? 'status-speaking' : phase === 'active' ? 'status-waiting' : 'status-idle'}`}>
            {isSpeaking ? (
              <><span className="status-dot dot-green" />Detected — Keep talking!</>
            ) : phase === 'active' ? (
              <><span className="status-dot dot-yellow" />Listening… Start speaking</>
            ) : (
              <><span className="status-dot dot-gray" />Tap mic to start</>
            )}
          </div>

          {/* Wave visualizer */}
          {phase === 'active' && (
            <div className="wave-visualizer">
              {waveBars.map(i => (
                <div
                  key={i}
                  className={`wave-bar ${isSpeaking ? 'wave-bar-active' : ''}`}
                  style={{
                    animationDelay: `${(i * 0.07) % 0.8}s`,
                    animationDuration: `${0.4 + (i % 5) * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="progress-text-row">
            <span className="progress-text-label">Speaking time</span>
            <span className="progress-text-val">{liveSeconds}s / {REQUIRED_SECONDS}s</span>
          </div>
          <div className="linear-progress-track">
            <div className="linear-progress-bar" style={{ width: `${progress * 100}%` }} />
          </div>

          {error && <div className="error-box"><strong>⚠️</strong> {error}</div>}
          {!isSupported && <div className="error-box">⚠️ Speech recognition not supported. Use Chrome or Edge.</div>}

          {/* Snooze */}
          <div className="challenge-footer">
            <button className="btn btn-secondary snooze-btn" onClick={onSnooze}>⏱ Snooze 5 min</button>
          </div>
        </div>

        {/* ── RIGHT: Transcript + Analysis ── */}
        <div className="analysis-column">

          {/* Live Transcript */}
          <div className="transcript-card glass-card">
            <div className="panel-header">
              <span className="panel-icon">📝</span>
              <span className="panel-title">Live Transcript</span>
              {displayTranscript && (
                <span className="word-count-badge">
                  {transcriptFull.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>

            <div className="transcript-body">
              {displayTranscript ? (
                <p className="transcript-text">
                  <span className="transcript-final">{transcriptFull}</span>
                  {interimTranscript && (
                    <span className="transcript-interim"> {interimTranscript}</span>
                  )}
                </p>
              ) : (
                <div className="transcript-placeholder">
                  <div className="placeholder-icon">🎙</div>
                  <p>Your speech will appear here as you talk…</p>
                </div>
              )}
            </div>
          </div>

          {/* Speech Analysis */}
          {analysis && analysis.score > 0 && (
            <div className="analysis-card glass-card">
              <div className="panel-header">
                <span className="panel-icon">📊</span>
                <span className="panel-title">Speech Analysis</span>
                <span className={`rating-badge rating-${analysis.score >= 7 ? 'high' : analysis.score >= 4 ? 'mid' : 'low'}`}>
                  {analysis.score}/10
                </span>
              </div>

              {/* Score dial */}
              <div className="score-section">
                <div className="score-dial-wrap">
                  <ScoreDial score={analysis.score} />
                </div>
                <div className="score-details">
                  <div className="score-label">{analysis.label}</div>
                  {analysis.summary && (
                    <p className="score-summary">"{analysis.summary}"</p>
                  )}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="metrics-grid">
                <MetricChip icon="📖" label="Words" value={analysis.metrics.wordCount} />
                <MetricChip icon="🔤" label="Vocab %" value={`${analysis.metrics.vocabularyRatio}%`} />
                <MetricChip icon="😬" label="Fillers" value={analysis.metrics.fillerCount} bad={analysis.metrics.fillerCount > 5} />
                <MetricChip icon="🎯" label="On-topic" value={`${analysis.metrics.topicRelevance}%`} />
                <MetricChip icon="🔗" label="Flow" value={analysis.metrics.connectorCount} />
                <MetricChip icon="📏" label="Avg sentence" value={`${analysis.metrics.avgWordsPerSentence}w`} />
              </div>

              {/* Suggestions */}
              <div className="suggestions-section">
                <div className="suggestions-title">💡 Suggestions</div>
                <ul className="suggestions-list">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="suggestion-item">
                      <span className="suggestion-bullet">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Placeholder when no analysis yet */}
          {(!analysis || analysis.score === 0) && (
            <div className="analysis-placeholder glass-card">
              <div className="placeholder-icon">📊</div>
              <p className="placeholder-text">Start speaking to get real-time analysis of your vocabulary, topic relevance, filler words, and more.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ScoreDial({ score }) {
  const pct = score / 10;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = score >= 7 ? '#00e5a0' : score >= 4 ? '#fbbf24' : '#ff3b5c';

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle
        cx="45" cy="45" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '45px 45px',
          transition: 'stroke-dashoffset 0.6s ease',
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
      />
      <text x="45" y="45" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="20" fontWeight="800" fontFamily="'Space Mono', monospace">
        {score}
      </text>
    </svg>
  );
}

function MetricChip({ icon, label, value, bad }) {
  return (
    <div className={`metric-chip ${bad ? 'metric-bad' : ''}`}>
      <span className="metric-icon">{icon}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}
