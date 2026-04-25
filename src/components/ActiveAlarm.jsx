import { useEffect, useState } from 'react';
import './ActiveAlarm.css';

export default function ActiveAlarm({ alarm, onTrigger, onSnooze }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [diffMs, setDiffMs] = useState(alarm - Date.now());

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = alarm - now;
      if (diff <= 0) {
        onTrigger();
        return;
      }
      setDiffMs(diff);
      const totalSecs = Math.floor(diff / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      if (h > 0) {
        setTimeLeft(`${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`);
      } else {
        setTimeLeft(`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [alarm, onTrigger]);

  const totalMs = alarm - (Date.now() - (alarm - Date.now()) + (alarm - Date.now()));
  // Simpler: progress based on initial diff at mount
  const [initDiff] = useState(() => alarm - Date.now());
  const progress = Math.max(0, Math.min(1, diffMs / initDiff));

  const alarmTimeStr = alarm.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="active-alarm-wrap">
      <div className="active-alarm glass-card">
        {/* Animated rings */}
        <div className="rings-container">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="alarm-time-display">
            <div className="alarm-time-label">ALARM SET FOR</div>
            <div className="alarm-time-value">{alarmTimeStr}</div>
          </div>
        </div>

        {/* Countdown */}
        <div className="countdown-section">
          <p className="countdown-label">Fires in</p>
          <div className="countdown-time">{timeLeft}</div>
        </div>

        {/* Thin progress bar */}
        <div className="wait-progress-track">
          <div
            className="wait-progress-bar"
            style={{ width: `${(1 - progress) * 100}%` }}
          />
        </div>

        {/* Info */}
        <p className="active-alarm-hint">
          🎙 When the alarm fires, speak about a random topic for 60 seconds to dismiss it.
        </p>

        {/* Actions */}
        <div className="active-actions">
          <button className="btn btn-secondary" onClick={onSnooze}>
            ⏱ Test Alarm Now
          </button>
        </div>
      </div>
    </div>
  );
}
