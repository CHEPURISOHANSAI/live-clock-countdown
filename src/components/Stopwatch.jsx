import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Clock } from 'lucide-react';
import { playTick } from '../utils/sound';

export default function Stopwatch({ soundEnabled = true }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedTime;
      const update = () => {
        setElapsedTime(performance.now() - startTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isRunning]);

  const handleStartPause = () => {
    playTick(soundEnabled);
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    playTick(soundEnabled);
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning) return;
    playTick(soundEnabled);
    const lastLapTime = laps.length > 0 ? laps[0].totalTime : 0;
    const splitTime = elapsedTime - lastLapTime;
    setLaps([
      {
        id: laps.length + 1,
        splitTime,
        totalTime: elapsedTime
      },
      ...laps
    ]);
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const milli = Math.floor((ms % 1000) / 10);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      minutes: pad(m),
      seconds: pad(s),
      millis: pad(milli)
    };
  };

  const t = formatTime(elapsedTime);

  return (
    <div className="stopwatch-view-container">
      <div className="meta-badge-row">
        <div className="live-status-pill">
          <Clock size={14} />
          <span>PRECISION STOPWATCH</span>
        </div>
      </div>

      {/* Stopwatch Readout */}
      <div className="stopwatch-display">
        <div className="sw-time-group">
          <span className="sw-digit-val">{t.minutes}</span>
          <span className="sw-label">MIN</span>
        </div>
        <div className="digit-sep">:</div>
        <div className="sw-time-group">
          <span className="sw-digit-val">{t.seconds}</span>
          <span className="sw-label">SEC</span>
        </div>
        <div className="digit-sep">:</div>
        <div className="sw-time-group sw-millis-group">
          <span className="sw-digit-val sw-millis-val">{t.millis}</span>
          <span className="sw-label">MS</span>
        </div>
      </div>

      {/* Stopwatch Controls */}
      <div className="cd-actions-bar">
        <button 
          className={`btn-action ${isRunning ? 'btn-pause' : 'btn-play'}`}
          onClick={handleStartPause}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button 
          className="btn-action btn-lap"
          onClick={handleLap}
          disabled={!isRunning && elapsedTime === 0}
        >
          <Flag size={18} />
          <span>Lap</span>
        </button>

        <button 
          className="btn-action btn-reset"
          onClick={handleReset}
          disabled={elapsedTime === 0}
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

      {/* Laps Table */}
      {laps.length > 0 && (
        <div className="laps-table-card animate-slide-down">
          <div className="laps-header">
            <span>Lap</span>
            <span>Split Time</span>
            <span>Overall Time</span>
          </div>
          <div className="laps-scroll-area">
            {laps.map((lap) => {
              const split = formatTime(lap.splitTime);
              const total = formatTime(lap.totalTime);
              return (
                <div key={lap.id} className="lap-row">
                  <span className="lap-num">#{lap.id}</span>
                  <span className="lap-split">+{split.minutes}:{split.seconds}.{split.millis}</span>
                  <span className="lap-total">{total.minutes}:{total.seconds}.{total.millis}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
