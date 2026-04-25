import { useState, useEffect, useRef, useCallback } from 'react';
import AlarmSetter from './components/AlarmSetter';
import ActiveAlarm from './components/ActiveAlarm';
import ChallengeScreen from './components/ChallengeScreen';
import DismissScreen from './components/DismissScreen';
import { useAlarmSound } from './hooks/useAlarmSound';
import './App.css';

const TOPICS = [
  "Talk about your favorite movie of all time",
  "Describe your perfect morning routine",
  "Explain what you did yesterday in detail",
  "Talk about a place you'd love to visit",
  "Describe your favorite meal and why you love it",
  "Talk about a skill you wish you had",
  "Describe the best day you've ever had",
  "Talk about your favorite book or TV show",
  "Explain three things you're grateful for today",
  "Describe your dream home",
  "Talk about someone who has inspired you",
  "Explain what you'd do with a million dollars",
  "Describe a challenge you've overcome",
  "Talk about your favorite childhood memory",
  "Explain what your ideal weekend looks like",
  "Talk about a hobby you enjoy or want to start",
  "Describe your favorite season and why",
  "Talk about the last movie or show you watched",
  "Explain where you see yourself in 5 years",
  "Describe an adventure you'd love to have",
];

const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

// App states
const STATE = {
  SETTER: 'setter',
  WAITING: 'waiting',
  CHALLENGE: 'challenge',
  DISMISSED: 'dismissed',
};

function getRandomTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

export default function App() {
  const [appState, setAppState] = useState(STATE.SETTER);
  const [alarmTime, setAlarmTime] = useState(null);
  const [topic, setTopic] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const checkTimerRef = useRef(null);
  const { start: startAlarm, stop: stopAlarm } = useAlarmSound();

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), duration);
  }, []);

  // Alarm trigger
  const triggerAlarm = useCallback(() => {
    clearInterval(checkTimerRef.current);
    setTopic(getRandomTopic());
    setAppState(STATE.CHALLENGE);
    startAlarm();
  }, [startAlarm]);

  // Set alarm handler
  const handleSetAlarm = useCallback((alarmDate, diffMs) => {
    setAlarmTime(alarmDate);
    setAppState(STATE.WAITING);

    const mins = Math.round(diffMs / 60000);
    showToast(`⏰ Alarm set! Fires in ${mins < 1 ? 'less than 1' : mins} minute${mins !== 1 ? 's' : ''}`);

    // Poll every second for alarm trigger
    clearInterval(checkTimerRef.current);
    checkTimerRef.current = setInterval(() => {
      if (Date.now() >= alarmDate.getTime()) {
        triggerAlarm();
      }
    }, 500);
  }, [triggerAlarm, showToast]);

  // Test alarm immediately (from waiting screen)
  const handleTestNow = useCallback(() => {
    triggerAlarm();
  }, [triggerAlarm]);

  // Dismiss alarm
  const handleDismiss = useCallback(() => {
    stopAlarm();
    setAppState(STATE.DISMISSED);
    clearInterval(checkTimerRef.current);
  }, [stopAlarm]);

  // Snooze
  const handleSnooze = useCallback(() => {
    stopAlarm();
    const snoozeUntil = new Date(Date.now() + SNOOZE_MS);
    setAlarmTime(snoozeUntil);
    setAppState(STATE.WAITING);
    showToast('⏱ Snoozed for 5 minutes. Stay awake!');

    clearInterval(checkTimerRef.current);
    checkTimerRef.current = setInterval(() => {
      if (Date.now() >= snoozeUntil.getTime()) {
        triggerAlarm();
      }
    }, 500);
  }, [stopAlarm, triggerAlarm, showToast]);

  // Reset to setter
  const handleReset = useCallback(() => {
    stopAlarm();
    clearInterval(checkTimerRef.current);
    setAppState(STATE.SETTER);
    setAlarmTime(null);
    setTopic('');
  }, [stopAlarm]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(checkTimerRef.current);
      stopAlarm();
    };
  }, [stopAlarm]);

  return (
    <div className="app">
      {/* Background ambient blobs */}
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />
      <div className="ambient-blob blob-3" />

      {/* Content */}
      <div className="app-content">
        {appState === STATE.SETTER && (
          <AlarmSetter onSet={handleSetAlarm} />
        )}
        {appState === STATE.WAITING && alarmTime && (
          <ActiveAlarm
            alarm={alarmTime}
            onTrigger={triggerAlarm}
            onSnooze={handleTestNow}
          />
        )}
        {appState === STATE.CHALLENGE && (
          <ChallengeScreen
            topic={topic}
            onDismiss={handleDismiss}
            onSnooze={handleSnooze}
          />
        )}
        {appState === STATE.DISMISSED && (
          <DismissScreen onReset={handleReset} />
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="toast">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
