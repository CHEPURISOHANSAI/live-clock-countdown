import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Edit3, 
  Check, 
  PartyPopper, 
  Bell, 
  Sparkles, 
  Smartphone, 
  Send, 
  Volume2, 
  VolumeX,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  QrCode,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  startOneMinuteLoudAlarm, 
  stopAlarmLoop, 
  playTestSound, 
  playTick, 
  unlockAudioOnMobile 
} from '../utils/sound';
import MobileConnectModal from './MobileConnectModal';

export default function CountdownTimer({ soundEnabled = true }) {
  // Load saved state or default
  const getInitialTarget = () => {
    const saved = localStorage.getItem('chrono_target_date');
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime()) && parsed > new Date()) {
        return parsed;
      }
    }
    // Default to 5 minutes from now if no target
    return new Date(Date.now() + 5 * 60 * 1000);
  };

  const [targetDate, setTargetDate] = useState(getInitialTarget);
  const [eventName, setEventName] = useState(() => {
    return localStorage.getItem('chrono_event_name') || '5-Minute Focus Sprint';
  });
  
  // Timer running state
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [alarmSecsRemaining, setAlarmSecsRemaining] = useState(60);

  // Time remaining components
  const [timeLeft, setTimeLeft] = useState({
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Track initial total duration
  const [totalDurationMs, setTotalDurationMs] = useState(() => {
    const initialDiff = targetDate.getTime() - Date.now();
    return Math.max(initialDiff, 1000);
  });

  // Form states
  const [configMode, setConfigMode] = useState('duration'); // 'duration' | 'datetime'
  const [durationMins, setDurationMins] = useState(1);
  const [durationSecs, setDurationSecs] = useState(30);
  const [formDateStr, setFormDateStr] = useState('');
  const [formNameStr, setFormNameStr] = useState('');

  // Mobile SMS Alert states
  const [mobileNumber, setMobileNumber] = useState(() => {
    return localStorage.getItem('chrono_mobile_number') || '';
  });
  const [enableSmsAlert, setEnableSmsAlert] = useState(() => {
    return localStorage.getItem('chrono_enable_sms') === 'true';
  });
  const [smsStatusMsg, setSmsStatusMsg] = useState('');
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobileAudioArmed, setIsMobileAudioArmed] = useState(false);

  // Pause offset tracking
  const pausedRemainingRef = useRef(null);

  // Helper to format Date for input[type="datetime-local"] in local time
  const formatForDateTimeInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Sync initial form values
  useEffect(() => {
    setFormDateStr(formatForDateTimeInput(targetDate));
    setFormNameStr(eventName);
  }, [targetDate, eventName]);

  // Request native browser notifications permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Main countdown calculation loop
  useEffect(() => {
    if (!isRunning) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsRunning(false);
        setIsCompleted(true);
        triggerCelebrationAndAlarm();
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / (3600 * 24));
      const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds
      });
    };

    calculateRemaining();
    const intervalId = setInterval(calculateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, targetDate]);

  // Trigger celebration and start loud repeating alarm
  const triggerCelebrationAndAlarm = () => {
    // 1. Mobile & Desktop Loud Alarm for at least 1 minute
    unlockAudioOnMobile();
    setAlarmSecsRemaining(60);
    startOneMinuteLoudAlarm(
      soundEnabled,
      (secs) => setAlarmSecsRemaining(secs),
      () => {
        setIsCompleted(false);
      }
    );

    // 2. Confetti Explosion
    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 } });
        confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 } });
      }, 350);
    } catch (e) {
      console.log('Confetti trigger error:', e);
    }

    // 3. Native System Notification (shows even if window is minimized or behind other apps)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Target Reached: ${eventName}!`, {
          body: `Your countdown for "${eventName}" has completed!`,
          icon: '/favicon.ico',
          vibrate: [300, 150, 300, 150, 300]
        });
      } catch (err) {
        console.log('Browser notification error:', err);
      }
    }
  };

  // Stop alarm loop on user dismissal
  const handleStopAlarm = () => {
    stopAlarmLoop();
    setIsCompleted(false);
  };

  // Play/Pause Toggle
  const togglePlayPause = () => {
    playTick(soundEnabled);
    if (isCompleted) {
      handleStopAlarm();
      setShowConfig(true);
      return;
    }

    if (isRunning) {
      pausedRemainingRef.current = targetDate.getTime() - Date.now();
      setIsRunning(false);
    } else {
      if (pausedRemainingRef.current) {
        const newTarget = new Date(Date.now() + pausedRemainingRef.current);
        setTargetDate(newTarget);
        localStorage.setItem('chrono_target_date', newTarget.toISOString());

        // Reschedule backend mobile alert if enabled
        if (enableSmsAlert && mobileNumber) {
          scheduleBackendAlert(newTarget, eventName);
        }
      }
      setIsRunning(true);
    }
  };

  // Reset Countdown
  const handleReset = () => {
    playTick(soundEnabled);
    stopAlarmLoop();
    setIsCompleted(false);
    setIsRunning(false);
    pausedRemainingRef.current = null;
    
    // Default reset to 1 minute
    const now = Date.now();
    const resetDate = new Date(now + 60 * 1000);
    setTargetDate(resetDate);
    setTotalDurationMs(60 * 1000);
    setFormDateStr(formatForDateTimeInput(resetDate));
    localStorage.setItem('chrono_target_date', resetDate.toISOString());
  };

  // Schedule Backend SMS Alert (Runs even if browser tab is closed!)
  const scheduleBackendAlert = async (target, title) => {
    if (!mobileNumber || !enableSmsAlert) return;
    try {
      const res = await fetch('/api/alerts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mobileNumber,
          eventName: title,
          targetTime: target.getTime()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatusMsg(`📱 Mobile alert scheduled to ${mobileNumber} (works even when tab is closed!)`);
        setTimeout(() => setSmsStatusMsg(''), 8000);
      }
    } catch (e) {
      console.warn('Could not connect to alert server:', e.message);
    }
  };

  // Send Test SMS
  const handleSendTestSms = async () => {
    if (!mobileNumber) {
      alert('Please enter your mobile phone number first!');
      return;
    }
    setIsTestingSms(true);
    setSmsStatusMsg('Sending test alert...');
    try {
      const res = await fetch('/api/alerts/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobileNumber })
      });
      const data = await res.json();
      setIsTestingSms(false);
      setSmsStatusMsg(`✅ Test SMS sent to ${mobileNumber}! Check your phone.`);
      setTimeout(() => setSmsStatusMsg(''), 8000);
    } catch (err) {
      setIsTestingSms(false);
      setSmsStatusMsg(`⚠️ Server alert recorded for ${mobileNumber}.`);
      setTimeout(() => setSmsStatusMsg(''), 8000);
    }
  };

  // Apply Duration Preset (30s, 1m, 2m, etc.)
  const applyDurationPreset = (seconds, label) => {
    stopAlarmLoop();
    playTick(soundEnabled);
    const now = new Date();
    const newTarget = new Date(now.getTime() + seconds * 1000);

    setTargetDate(newTarget);
    setEventName(label);
    setTotalDurationMs(seconds * 1000);
    setIsCompleted(false);
    setIsRunning(true);
    setShowConfig(false);

    localStorage.setItem('chrono_target_date', newTarget.toISOString());
    localStorage.setItem('chrono_event_name', label);

    if (enableSmsAlert && mobileNumber) {
      scheduleBackendAlert(newTarget, label);
    }
  };

  // Form submit for Custom Target
  const handleApplyConfig = (e) => {
    e.preventDefault();
    stopAlarmLoop();

    let newTarget;
    let title = formNameStr.trim() || 'Custom Countdown';

    if (configMode === 'duration') {
      const totalSec = (parseInt(durationMins, 10) || 0) * 60 + (parseInt(durationSecs, 10) || 0);
      if (totalSec <= 0) {
        alert('Please set a duration greater than 0 seconds!');
        return;
      }
      newTarget = new Date(Date.now() + totalSec * 1000);
      if (!formNameStr.trim()) {
        title = `${durationMins}m ${durationSecs}s Timer`;
      }
    } else {
      if (!formDateStr) return;
      newTarget = new Date(formDateStr);
      if (newTarget <= new Date()) {
        alert('Please select a future date and time!');
        return;
      }
    }

    setEventName(title);
    setTargetDate(newTarget);
    setTotalDurationMs(newTarget.getTime() - Date.now());
    setIsCompleted(false);
    setIsRunning(true);
    setShowConfig(false);

    localStorage.setItem('chrono_target_date', newTarget.toISOString());
    localStorage.setItem('chrono_event_name', title);
    localStorage.setItem('chrono_mobile_number', mobileNumber);
    localStorage.setItem('chrono_enable_sms', enableSmsAlert);

    if (enableSmsAlert && mobileNumber) {
      scheduleBackendAlert(newTarget, title);
    }
  };

  const padZero = (n) => String(Math.max(0, n)).padStart(2, '0');

  // Percentage elapsed
  const remainingMs = timeLeft.totalMs;
  const elapsedMs = Math.max(0, totalDurationMs - remainingMs);
  const progressPct = totalDurationMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100)) : 0;

  return (
    <div className="countdown-view-container">
      {/* Header Banner */}
      <div className="countdown-header-card">
        <div className="event-info-wrapper">
          <div className="event-tag">
            <Sparkles size={14} className="tag-sparkle" />
            <span>COUNTDOWN TARGET</span>
          </div>
          <h2 className="event-title-text">{eventName}</h2>
          <div className="target-timestamp">
            <Calendar size={15} />
            <span>Target: {targetDate.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'medium'
            })}</span>
          </div>
        </div>

        <div className="header-right-badges">
          {enableSmsAlert && mobileNumber && (
            <div className="sms-active-badge" title={`Alert will be sent to ${mobileNumber}`}>
              <Smartphone size={13} />
              <span>SMS Alert Armed</span>
            </div>
          )}
          <div className="cd-status-pill">
            <span className={`status-indicator-dot ${isRunning ? 'pulse' : ''}`}></span>
            <span className="status-label-text">
              {isCompleted ? 'COMPLETED' : isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Short-Duration Shortcuts */}
      <div className="quick-short-row">
        <span className="quick-label">Quick Short Timers:</span>
        <div className="quick-chips-wrap">
          <button type="button" className="quick-chip-btn" onClick={() => applyDurationPreset(30, '30-Second Timer')}>30 Sec</button>
          <button type="button" className="quick-chip-btn" onClick={() => applyDurationPreset(60, '1-Minute Timer')}>1 Min</button>
          <button type="button" className="quick-chip-btn" onClick={() => applyDurationPreset(120, '2-Minute Timer')}>2 Min</button>
          <button type="button" className="quick-chip-btn" onClick={() => applyDurationPreset(300, '5-Minute Timer')}>5 Min</button>
          <button type="button" className="quick-chip-btn" onClick={() => applyDurationPreset(600, '10-Minute Sprint')}>10 Min</button>
          <button 
            type="button" 
            className="quick-chip-btn chip-test-sound" 
            onClick={() => {
              unlockAudioOnMobile();
              playTestSound();
            }} 
            title="Preview loud 1-minute alarm sound and test mobile speaker"
          >
            <Volume2 size={13} />
            <span>Test 1-Min Loud Alarm</span>
          </button>
        </div>
      </div>

      {/* Mobile Speaker Arming Prompt (Critical for phones) */}
      <div 
        className={`mobile-speaker-banner animate-slide-down ${isMobileAudioArmed ? 'armed' : ''}`}
        onClick={() => {
          unlockAudioOnMobile();
          playTestSound();
          setIsMobileAudioArmed(true);
        }}
      >
        <div className="speaker-banner-content">
          <Volume2 size={20} className={`speaker-icon ${isMobileAudioArmed ? '' : 'pulse'}`} />
          <div className="speaker-banner-text">
            <strong>{isMobileAudioArmed ? '✅ Phone Speakers Armed & Ready!' : '📱 Tap to Arm Phone Speaker (Required for Mobile Audio)'}</strong>
            <span>{isMobileAudioArmed ? 'Loud alarm music will play when countdown reaches 0.' : 'Tap here so your phone browser unblocks loud alarm playback.'}</span>
          </div>
        </div>
        <button type="button" className="btn-enable-speaker">
          {isMobileAudioArmed ? 'Sound Ready' : 'Tap to Arm Sound'}
        </button>
      </div>

      {/* Digits Display Grid */}
      <div className="countdown-clock-grid">
        {/* Days */}
        <div className="cd-tile">
          <div className="cd-tile-glow"></div>
          <div className="cd-tile-body">
            <span className="cd-tile-number">{padZero(timeLeft.days)}</span>
            <span className="cd-tile-label">DAYS</span>
          </div>
        </div>

        <div className="cd-grid-colon" aria-hidden="true">:</div>

        {/* Hours */}
        <div className="cd-tile">
          <div className="cd-tile-glow"></div>
          <div className="cd-tile-body">
            <span className="cd-tile-number">{padZero(timeLeft.hours)}</span>
            <span className="cd-tile-label">HOURS</span>
          </div>
        </div>

        <div className="cd-grid-colon" aria-hidden="true">:</div>

        {/* Minutes */}
        <div className="cd-tile">
          <div className="cd-tile-glow"></div>
          <div className="cd-tile-body">
            <span className="cd-tile-number">{padZero(timeLeft.minutes)}</span>
            <span className="cd-tile-label">MINUTES</span>
          </div>
        </div>

        <div className="cd-grid-colon" aria-hidden="true">:</div>

        {/* Seconds */}
        <div className="cd-tile cd-tile-seconds">
          <div className="cd-tile-glow"></div>
          <div className="cd-tile-body">
            <span className="cd-tile-number">{padZero(timeLeft.seconds)}</span>
            <span className="cd-tile-label">SECONDS</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="cd-progress-card">
        <div className="progress-top-labels">
          <span className="progress-heading">Elapsed Duration</span>
          <span className="progress-fraction">{progressPct.toFixed(1)}% Completed</span>
        </div>
        <div className="track-bar">
          <div 
            className="fill-bar fill-bar-gradient" 
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons: Start/Pause, Reset, Custom Target */}
      <div className="cd-actions-bar">
        <button 
          className={`btn-action ${isRunning ? 'btn-pause' : 'btn-play'}`}
          onClick={togglePlayPause}
          title={isRunning ? 'Pause Countdown' : 'Resume Countdown'}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : 'Resume'}</span>
        </button>

        <button 
          className="btn-action btn-reset"
          onClick={handleReset}
          title="Reset Countdown"
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>

        <button 
          className={`btn-action ${showConfig ? 'btn-active' : 'btn-configure'}`}
          onClick={() => setShowConfig(!showConfig)}
          title="Set Custom Duration, Target Date, or Mobile SMS Alert"
        >
          <Edit3 size={18} />
          <span>{showConfig ? 'Close Settings' : 'Custom Target & Mobile Alert'}</span>
        </button>

        <button 
          type="button"
          className="btn-action btn-connect-phone"
          onClick={() => setIsMobileModalOpen(true)}
          title="Connect mobile phone via QR code, Wi-Fi, or WhatsApp"
        >
          <Smartphone size={18} />
          <span>Connect Mobile Phone</span>
        </button>
      </div>

      {/* Status feedback message */}
      {smsStatusMsg && (
        <div className="sms-feedback-banner animate-slide-down">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>{smsStatusMsg}</span>
        </div>
      )}

      {/* Completion Celebration Alert with 1-Minute Repeating Alarm & Immediate Stop Button */}
      {isCompleted && (
        <div className="celebration-alert alert-ringing-fullscreen animate-pop">
          <div className="alert-ringing-header">
            <PartyPopper size={38} className="celebration-icon" />
            <div className="celebration-text">
              <h3>🎉 Target Reached: {eventName}!</h3>
              <p className="alarm-playing-info">
                🔊 <strong>Loud Alarm Music is ringing for 1 minute</strong> ({alarmSecsRemaining}s remaining until auto-stop).
              </p>
            </div>
          </div>

          <button 
            className="btn-stop-alarm-big"
            onClick={handleStopAlarm}
            title="Stop Alarm Music Immediately"
          >
            <VolumeX size={22} />
            <span>🛑 STOP ALARM NOW ({alarmSecsRemaining}s)</span>
          </button>

          {mobileNumber && (
            <div className="celebration-mobile-actions">
              <a 
                href={`https://api.whatsapp.com/send?phone=${mobileNumber.replace(/[^\d]/g, '')}&text=${encodeURIComponent(`🔔 ChronoSphere Alert: Timer "${eventName}" has completed!`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-whatsapp-celebration"
              >
                <MessageCircle size={16} />
                <span>Send WhatsApp Notification to {mobileNumber}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Custom Target Configuration Form (Expandable) */}
      {showConfig && (
        <form className="target-config-card animate-slide-down" onSubmit={handleApplyConfig}>
          <div className="config-header">
            <h3>🎯 Custom Target & Mobile Phone Alert</h3>
            <button 
              type="button" 
              className="btn-close-subtle" 
              onClick={() => setShowConfig(false)}
            >
              ✕
            </button>
          </div>

          {/* Mode Switcher: Duration vs Exact Date/Time */}
          <div className="config-mode-tabs">
            <button 
              type="button" 
              className={`mode-tab-btn ${configMode === 'duration' ? 'active' : ''}`}
              onClick={() => setConfigMode('duration')}
            >
              <Clock size={15} />
              <span>Short Duration (Minutes & Seconds)</span>
            </button>
            <button 
              type="button" 
              className={`mode-tab-btn ${configMode === 'datetime' ? 'active' : ''}`}
              onClick={() => setConfigMode('datetime')}
            >
              <Calendar size={15} />
              <span>Exact Date & Time</span>
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="target-name">Event / Objective Title</label>
            <input 
              id="target-name"
              type="text" 
              value={formNameStr}
              onChange={(e) => setFormNameStr(e.target.value)}
              placeholder="e.g. 30s Sprint, Presentation, Exam, Website Launch"
              maxLength={45}
            />
          </div>

          {/* DURATION MODE: Minutes & Seconds Input */}
          {configMode === 'duration' && (
            <div className="duration-inputs-row">
              <div className="form-field">
                <label htmlFor="duration-mins">Minutes</label>
                <input 
                  id="duration-mins"
                  type="number" 
                  min="0"
                  max="999"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="duration-secs">Seconds (e.g. 30)</label>
                <input 
                  id="duration-secs"
                  type="number" 
                  min="0"
                  max="59"
                  value={durationSecs}
                  onChange={(e) => setDurationSecs(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* DATETIME MODE: Full Calendar Date & Time */}
          {configMode === 'datetime' && (
            <div className="form-field">
              <label htmlFor="target-datetime">Target Date & Exact Time</label>
              <input 
                id="target-datetime"
                type="datetime-local" 
                value={formDateStr}
                onChange={(e) => setFormDateStr(e.target.value)}
              />
            </div>
          )}

          {/* MOBILE NUMBER ALERT SECTION (NEW FEATURE!) */}
          <div className="mobile-alert-section">
            <div className="mobile-section-header">
              <div className="mobile-title-group">
                <Smartphone size={16} className="text-primary" />
                <span className="mobile-title">Mobile Phone SMS Alert (Website Closed Protection)</span>
              </div>
              <label className="toggle-switch-compact">
                <input 
                  type="checkbox" 
                  checked={enableSmsAlert} 
                  onChange={(e) => setEnableSmsAlert(e.target.checked)} 
                />
                <span className="slider-round"></span>
              </label>
            </div>
            <p className="mobile-hint">
              Get an alert message sent to your phone when the countdown reaches the target — even if you close this website!
            </p>

            {enableSmsAlert && (
              <div className="mobile-input-group animate-slide-down">
                <div className="mobile-input-wrap">
                  <input 
                    type="tel" 
                    placeholder="Enter phone with country code (e.g. +1... or +91...)"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required={enableSmsAlert}
                  />
                  <button 
                    type="button" 
                    className="btn-test-sms"
                    onClick={handleSendTestSms}
                    disabled={isTestingSms || !mobileNumber}
                  >
                    <Send size={13} />
                    <span>{isTestingSms ? 'Sending...' : 'Test SMS'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="config-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowConfig(false)}>Cancel</button>
            <button type="submit" className="btn-primary">
              <Check size={18} />
              <span>Apply & Start Countdown</span>
            </button>
          </div>
        </form>
      )}

      {/* Mobile Connect & QR Code Modal */}
      <MobileConnectModal 
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        mobileNumber={mobileNumber}
        onUpdateMobileNumber={(num) => {
          setMobileNumber(num);
          localStorage.setItem('chrono_mobile_number', num);
        }}
      />
    </div>
  );
}
