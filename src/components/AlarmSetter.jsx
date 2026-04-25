import { useState } from 'react';
import './AlarmSetter.css';

export default function AlarmSetter({ onSet }) {
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);

  const handleSet = () => {
    if (!time) {
      setError('Please select a time first!');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const alarm = new Date();
    alarm.setHours(hours, minutes, 0, 0);

    if (alarm <= now) {
      // Schedule for tomorrow
      alarm.setDate(alarm.getDate() + 1);
    }

    const diffMs = alarm - now;
    const diffMins = Math.round(diffMs / 60000);

    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      onSet(alarm, diffMs);
    }, 600);
    setError('');
  };

  const formatTime12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="alarm-setter">
      <div className={`setter-card glass-card ${animating ? 'setter-animating' : ''}`}>
        {/* Clock icon header */}
        <div className="setter-header">
          <div className="clock-icon">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="44" r="28" stroke="#ff3b5c" strokeWidth="2.5" strokeDasharray="4 3"/>
              <circle cx="40" cy="44" r="22" fill="rgba(255,59,92,0.08)" stroke="rgba(255,59,92,0.3)" strokeWidth="1"/>
              {/* Clock hands */}
              <line x1="40" y1="44" x2="40" y2="29" stroke="#ff3b5c" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="40" y1="44" x2="50" y2="50" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="40" cy="44" r="2.5" fill="#ff3b5c"/>
              {/* Bell on top */}
              <path d="M28 16 Q30 8 40 8 Q50 8 52 16" stroke="#ff3b5c" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="28" cy="17" r="3" fill="#ff6b35"/>
              <circle cx="52" cy="17" r="3" fill="#ff6b35"/>
              {/* Feet */}
              <path d="M34 72 Q40 76 46 72" stroke="#ff3b5c" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="setter-title-block">
            <h1 className="setter-title">Talk-to-Dismiss</h1>
            <p className="setter-subtitle">Set your alarm & talk your way out</p>
          </div>
        </div>

        {/* Features badge row */}
        <div className="badge-row">
          <span className="badge">🎙 60s Speaking Challenge</span>
          <span className="badge">🧠 Random Topics</span>
          <span className="badge">🔊 Web Audio</span>
        </div>

        {/* Time Picker */}
        <div className="time-input-section">
          <label className="time-label">Set Alarm Time</label>
          <div className="time-input-wrapper">
            <input
              type="time"
              className="time-input"
              value={time}
              onChange={e => { setTime(e.target.value); setError(''); }}
            />
            {time && (
              <div className="time-preview">{formatTime12(time)}</div>
            )}
          </div>
          {error && <p className="input-error">⚠️ {error}</p>}
        </div>

        {/* Action buttons */}
        <div className="setter-actions">
          <button className="btn btn-primary set-btn" onClick={handleSet}>
            <span>⏰</span>
            <span>Set Alarm</span>
          </button>
        </div>

        {/* How it works */}
        <div className="how-it-works">
          <p className="how-title">How it works</p>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <span className="step-text">Set your alarm time</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">2</span>
              <span className="step-text">Alarm fires & you get a topic</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">3</span>
              <span className="step-text">Talk for 60 seconds to dismiss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
