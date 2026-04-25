import './DismissScreen.css';

export default function DismissScreen({ onReset }) {
  // Confetti particles
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: ['#ff3b5c','#00e5a0','#4a9eff','#fbbf24','#a855f7','#ff6b35'][i % 6],
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="dismiss-wrap">
      {/* Confetti */}
      {confetti.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '0',
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}

      <div className="dismiss-card glass-card">
        {/* Success icon */}
        <div className="success-icon">
          <div className="success-ring success-ring-outer" />
          <div className="success-ring success-ring-inner" />
          <div className="success-checkmark">✓</div>
        </div>

        <h1 className="dismiss-title">Well Done! 🎉</h1>
        <p className="dismiss-subtitle">Alarm Dismissed</p>

        <div className="dismiss-stat-row">
          <div className="dismiss-stat">
            <div className="dismiss-stat-val">60s</div>
            <div className="dismiss-stat-label">You Spoke For</div>
          </div>
          <div className="dismiss-stat-divider" />
          <div className="dismiss-stat">
            <div className="dismiss-stat-val">💪</div>
            <div className="dismiss-stat-label">Challenge Met</div>
          </div>
          <div className="dismiss-stat-divider" />
          <div className="dismiss-stat">
            <div className="dismiss-stat-val">🧠</div>
            <div className="dismiss-stat-label">Brain Warmed Up</div>
          </div>
        </div>

        <p className="dismiss-message">
          You talked your way out of bed. That's the spirit!
          Your morning brain is now officially awake. Go crush the day.
        </p>

        <button className="btn btn-primary set-new-btn" onClick={onReset}>
          ⏰ Set New Alarm
        </button>
      </div>
    </div>
  );
}
