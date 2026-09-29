import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, Check, Clock, Volume2 } from 'lucide-react';
import { playAlarm } from '../utils/sound';

export default function AlarmClock({ soundEnabled = true, is24Hour }) {
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('chrono_alarms');
    return saved ? JSON.parse(saved) : [
      { id: '1', time: '08:00', label: 'Morning Wakeup', enabled: true },
      { id: '2', time: '13:00', label: 'Lunch Break', enabled: false }
    ];
  });

  const [inputTime, setInputTime] = useState('09:00');
  const [inputLabel, setInputLabel] = useState('');
  const [activeRingingAlarm, setActiveRingingAlarm] = useState(null);

  // Save alarms
  useEffect(() => {
    localStorage.setItem('chrono_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Check alarm matches every second
  useEffect(() => {
    const checkAlarm = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentSeconds = now.getSeconds();
      const currentTimeStr = `${currentHours}:${currentMins}`;

      // Trigger at exactly :00 of the minute
      if (currentSeconds === 0) {
        alarms.forEach((alarm) => {
          if (alarm.enabled && alarm.time === currentTimeStr && (!activeRingingAlarm || activeRingingAlarm.id !== alarm.id)) {
            setActiveRingingAlarm(alarm);
            playAlarm(soundEnabled);
          }
        });
      }
    };

    const interval = setInterval(checkAlarm, 1000);
    return () => clearInterval(interval);
  }, [alarms, soundEnabled, activeRingingAlarm]);

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const handleAddAlarm = (e) => {
    e.preventDefault();
    if (!inputTime) return;

    const newAlarm = {
      id: Date.now().toString(),
      time: inputTime,
      label: inputLabel.trim() || 'Scheduled Alarm',
      enabled: true
    };

    setAlarms([...alarms, newAlarm]);
    setInputLabel('');
  };

  const handleDismiss = () => {
    setActiveRingingAlarm(null);
  };

  const handleSnooze = () => {
    if (!activeRingingAlarm) return;
    const now = new Date();
    const snoozedDate = new Date(now.getTime() + 5 * 60 * 1000);
    const snoozeHours = String(snoozedDate.getHours()).padStart(2, '0');
    const snoozeMins = String(snoozedDate.getMinutes()).padStart(2, '0');
    const snoozeTimeStr = `${snoozeHours}:${snoozeMins}`;

    // Add snoozed alarm
    setAlarms([
      ...alarms,
      {
        id: Date.now().toString(),
        time: snoozeTimeStr,
        label: `Snooze: ${activeRingingAlarm.label}`,
        enabled: true
      }
    ]);
    setActiveRingingAlarm(null);
  };

  const formatDisplayTime = (timeStr) => {
    if (!is24Hour) {
      const [h, m] = timeStr.split(':');
      let hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      hourNum = hourNum % 12 || 12;
      return `${String(hourNum).padStart(2, '0')}:${m} ${ampm}`;
    }
    return timeStr;
  };

  return (
    <div className="alarm-view-container">
      <div className="meta-badge-row">
        <div className="live-status-pill">
          <Bell size={14} />
          <span>SMART ALARM MANAGER</span>
        </div>
      </div>

      {/* Ringing Notification Banner */}
      {activeRingingAlarm && (
        <div className="ringing-alert-banner animate-pop">
          <div className="ringing-icon-wrap">
            <Volume2 size={26} className="alarm-pulse-bell" />
          </div>
          <div className="ringing-details">
            <h4>🔔 Alarm Ringing!</h4>
            <p className="ringing-label">{activeRingingAlarm.label} ({formatDisplayTime(activeRingingAlarm.time)})</p>
          </div>
          <div className="ringing-buttons">
            <button className="btn-snooze" onClick={handleSnooze}>Snooze 5m</button>
            <button className="btn-dismiss" onClick={handleDismiss}>Dismiss</button>
          </div>
        </div>
      )}

      {/* New Alarm Form */}
      <form onSubmit={handleAddAlarm} className="alarm-form-card">
        <div className="alarm-form-inputs">
          <div className="form-group-compact">
            <label htmlFor="alarm-time">Time</label>
            <input 
              id="alarm-time"
              type="time" 
              value={inputTime} 
              onChange={(e) => setInputTime(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group-compact form-group-grow">
            <label htmlFor="alarm-label">Alarm Label</label>
            <input 
              id="alarm-label"
              type="text" 
              placeholder="e.g. Wake up, Meeting, Hydrate" 
              value={inputLabel} 
              onChange={(e) => setInputLabel(e.target.value)} 
              maxLength={35}
            />
          </div>
          <button type="submit" className="btn-add-alarm">
            <Plus size={18} />
            <span>Add Alarm</span>
          </button>
        </div>
      </form>

      {/* Alarm List */}
      <div className="alarms-grid">
        {alarms.length === 0 ? (
          <div className="no-alarms-msg">No alarms configured. Add one above!</div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.id} className={`alarm-card ${alarm.enabled ? 'alarm-active' : 'alarm-disabled'}`}>
              <div className="alarm-left">
                <span className="alarm-time-text">{formatDisplayTime(alarm.time)}</span>
                <span className="alarm-label-text">{alarm.label}</span>
              </div>
              <div className="alarm-right">
                <button 
                  type="button" 
                  className={`alarm-toggle-switch ${alarm.enabled ? 'switch-on' : ''}`}
                  onClick={() => toggleAlarm(alarm.id)}
                  title={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
                  aria-label="Toggle alarm"
                >
                  <span className="switch-thumb"></span>
                </button>
                <button 
                  type="button" 
                  className="btn-delete-alarm" 
                  onClick={() => deleteAlarm(alarm.id)}
                  title="Delete alarm"
                  aria-label="Delete alarm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
