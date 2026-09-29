import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Sparkles, Clock, MapPin } from 'lucide-react';

export default function DigitalClock({ 
  is24Hour, 
  showSeconds = true, 
  showMillis = false,
  targetTimeZone = null,
  onResetToLocal = null
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let animFrameId;
    const updateTime = () => {
      setTime(new Date());
      animFrameId = requestAnimationFrame(updateTime);
    };
    animFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const padZero = (n) => String(n).padStart(2, '0');
  const padMillis = (n) => String(n).padStart(3, '0');

  // Compute hours, minutes, seconds either in local time or chosen target timezone
  let rawHours = time.getHours();
  let rawMinutes = time.getMinutes();
  let rawSeconds = time.getSeconds();
  let rawMillis = time.getMilliseconds();
  let displayHours = rawHours;
  let ampm = '';

  let dayName = '';
  let monthName = '';
  let dayNum = 1;
  let yearNum = time.getFullYear();
  let timezoneDisplayStr = '';

  if (targetTimeZone) {
    try {
      // Extract parts for target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimeZone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(time);
      const getPart = (type) => parts.find(p => p.type === type)?.value;

      rawHours = parseInt(getPart('hour'), 10) || 0;
      rawMinutes = parseInt(getPart('minute'), 10) || 0;
      rawSeconds = parseInt(getPart('second'), 10) || 0;
      dayName = getPart('weekday') || '';
      monthName = getPart('month') || '';
      dayNum = parseInt(getPart('day'), 10) || 1;
      yearNum = parseInt(getPart('year'), 10) || time.getFullYear();

      // UTC offset calculation for target timezone
      const nowUtc = new Date(time.toLocaleString('en-US', { timeZone: 'UTC' }));
      const nowTz = new Date(time.toLocaleString('en-US', { timeZone: targetTimeZone }));
      const diffMinutes = Math.round((nowTz - nowUtc) / (1000 * 60));
      const sign = diffMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(diffMinutes);
      const offH = padZero(Math.floor(absMinutes / 60));
      const offM = padZero(absMinutes % 60);
      const offsetStr = `UTC${sign}${offH}:${offM}`;

      const cleanCity = targetTimeZone.split('/').pop().replace(/_/g, ' ');
      timezoneDisplayStr = `${cleanCity} (${offsetStr})`;
    } catch (e) {
      targetTimeZone = null;
    }
  }

  if (!targetTimeZone) {
    dayName = time.toLocaleDateString(undefined, { weekday: 'long' });
    monthName = time.toLocaleDateString(undefined, { month: 'long' });
    dayNum = time.getDate();
    yearNum = time.getFullYear();

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = -time.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const offsetHours = padZero(Math.floor(Math.abs(offset) / 60));
      const offsetMins = padZero(Math.abs(offset) % 60);
      timezoneDisplayStr = `Local Time (${tz} UTC${sign}${offsetHours}:${offsetMins})`;
    } catch (e) {
      timezoneDisplayStr = 'Local Device Time';
    }
  }

  // 12-hour or 24-hour display format
  if (!is24Hour) {
    ampm = rawHours >= 12 ? 'PM' : 'AM';
    displayHours = rawHours % 12 || 12;
  } else {
    displayHours = rawHours;
  }

  // Day completion percentage
  const totalSecondsInDay = rawHours * 3600 + rawMinutes * 60 + rawSeconds;
  const dayProgressPct = ((totalSecondsInDay / 86400) * 100).toFixed(1);

  // Day of year calculation
  const startOfYear = new Date(yearNum, 0, 1);
  const diffDays = Math.floor((time - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const weekNum = Math.ceil((((time - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);

  return (
    <div className="clock-view-container">
      {/* Timezone and Live Badge */}
      <div className="meta-badge-row">
        <div className="live-status-pill">
          <span className="pulsing-live-dot"></span>
          <span>LIVE CLOCK</span>
        </div>
        <div className="timezone-tag">
          <Globe size={14} className="tag-icon" />
          <span>{timezoneDisplayStr}</span>
          {targetTimeZone && onResetToLocal && (
            <button 
              type="button" 
              className="btn-badge-reset"
              onClick={onResetToLocal}
              title="Reset clock back to your local time"
            >
              Reset to Local
            </button>
          )}
        </div>
      </div>

      {/* Large Digital Clock Face */}
      <div className="clock-face">
        {/* Hours */}
        <div className="digit-card" aria-label="Hours">
          <div className="digit-glow"></div>
          <div className="digit-content">
            <span className="digit-value">{padZero(displayHours)}</span>
            <span className="digit-sublabel">HOURS</span>
          </div>
        </div>

        {/* Pulsing Colon Separator */}
        <div className="digit-sep" aria-hidden="true">:</div>

        {/* Minutes */}
        <div className="digit-card" aria-label="Minutes">
          <div className="digit-glow"></div>
          <div className="digit-content">
            <span className="digit-value">{padZero(rawMinutes)}</span>
            <span className="digit-sublabel">MINUTES</span>
          </div>
        </div>

        {/* Seconds */}
        {showSeconds && (
          <>
            <div className="digit-sep" aria-hidden="true">:</div>
            <div className="digit-card digit-card-seconds" aria-label="Seconds">
              <div className="digit-glow"></div>
              <div className="digit-content">
                <span className="digit-value">{padZero(rawSeconds)}</span>
                <span className="digit-sublabel">SECONDS</span>
              </div>
            </div>
          </>
        )}

        {/* AM / PM and Milliseconds indicator column */}
        <div className="clock-meta-column">
          {!is24Hour && (
            <div className="ampm-chip">
              <span className="ampm-text">{ampm}</span>
            </div>
          )}
          {showMillis && (
            <div className="millis-chip">
              <span className="millis-dot">.</span>
              <span className="millis-text">{padMillis(rawMillis)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Display */}
      <div className="current-date-card">
        <div className="date-icon-box">
          <Calendar size={28} className="calendar-svg" />
        </div>
        <div className="date-text-group">
          <div className="date-primary">
            {dayName}, {monthName} {dayNum}, {yearNum}
          </div>
          <div className="date-secondary">
            <span>Day {diffDays > 0 ? diffDays : 1} of {yearNum}</span>
            <span className="dot-divider">&bull;</span>
            <span>Week {weekNum > 0 ? weekNum : 1}</span>
            <span className="dot-divider">&bull;</span>
            <span>Q{Math.floor(time.getMonth() / 3) + 1}</span>
            {targetTimeZone && (
              <>
                <span className="dot-divider">&bull;</span>
                <span className="tz-active-pill">{targetTimeZone.replace(/_/g, ' ')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Progress Metrics */}
      <div className="progress-metrics-grid">
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">DAY PROGRESS</span>
            <span className="metric-pct">{dayProgressPct}%</span>
          </div>
          <div className="track-bar">
            <div className="fill-bar fill-bar-primary" style={{ width: `${dayProgressPct}%` }}></div>
          </div>
          <span className="metric-hint">{Math.max(0, 24 - rawHours)}h remaining in this timezone today</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">CURRENT MINUTE</span>
            <span className="metric-pct">{rawSeconds}s / 60s</span>
          </div>
          <div className="track-bar">
            <div className="fill-bar fill-bar-accent" style={{ width: `${(rawSeconds / 60) * 100}%` }}></div>
          </div>
          <span className="metric-hint">Cycle refreshes continuously</span>
        </div>
      </div>
    </div>
  );
}
