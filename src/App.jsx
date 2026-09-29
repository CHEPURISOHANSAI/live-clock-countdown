import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Hourglass, 
  Timer, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Palette, 
  Bell,
  Globe,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import DigitalClock from './components/DigitalClock';
import CountdownTimer from './components/CountdownTimer';
import Stopwatch from './components/Stopwatch';
import AlarmClock from './components/AlarmClock';
import WorldClock from './components/WorldClock';
import AllTimezones from './components/AllTimezones';
import './App.css';

const THEMES = [
  { id: 'cyber-blue', name: 'Cyber Cyan', color: '#00f2fe' },
  { id: 'aurora-purple', name: 'Aurora Violet', color: '#b05bf8' },
  { id: 'emerald-matrix', name: 'Matrix Emerald', color: '#00f5a0' },
  { id: 'sunset-amber', name: 'Solar Sunset', color: '#ff9900' },
  { id: 'oled-dark', name: 'Minimal OLED', color: '#e2e8f0' },
];

const DEFAULT_PINNED_ZONES = [
  'Europe/London',
  'America/New_York',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/Los_Angeles'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('clock'); // 'clock' | 'countdown' | 'timezones' | 'alarms' | 'stopwatch'
  const [is24Hour, setIs24Hour] = useState(() => {
    return localStorage.getItem('chrono_24h') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('chrono_sound') !== 'false';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('chrono_theme') || 'cyber-blue';
  });
  const [showWorldClock, setShowWorldClock] = useState(() => {
    return localStorage.getItem('chrono_world') === 'true';
  });
  const [showMillis, setShowMillis] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Custom Main Clock Target Timezone
  const [selectedMainZone, setSelectedMainZone] = useState(() => {
    return localStorage.getItem('chrono_main_zone') || null;
  });

  // Pinned World Clock Zones
  const [pinnedZones, setPinnedZones] = useState(() => {
    const saved = localStorage.getItem('chrono_pinned_zones');
    return saved ? JSON.parse(saved) : DEFAULT_PINNED_ZONES;
  });

  // Apply theme class to document body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('chrono_theme', theme);
  }, [theme]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('chrono_24h', is24Hour);
  }, [is24Hour]);

  useEffect(() => {
    localStorage.setItem('chrono_sound', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('chrono_world', showWorldClock);
  }, [showWorldClock]);

  useEffect(() => {
    if (selectedMainZone) {
      localStorage.setItem('chrono_main_zone', selectedMainZone);
    } else {
      localStorage.removeItem('chrono_main_zone');
    }
  }, [selectedMainZone]);

  useEffect(() => {
    localStorage.setItem('chrono_pinned_zones', JSON.stringify(pinnedZones));
  }, [pinnedZones]);

  // Toggle Pinned Timezone
  const handleTogglePinZone = (zone) => {
    if (pinnedZones.includes(zone)) {
      setPinnedZones(pinnedZones.filter((z) => z !== zone));
    } else {
      setPinnedZones([...pinnedZones, zone]);
    }
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div className={`app-container ${isZenMode ? 'zen-active' : ''}`}>
      {/* Background ambient lighting */}
      <div className="bg-glow bg-glow-primary" aria-hidden="true"></div>
      <div className="bg-glow bg-glow-secondary" aria-hidden="true"></div>
      <div className="bg-grid-overlay" aria-hidden="true"></div>

      {/* Main Glassmorphic Card Container */}
      <div className="main-wrapper">
        
        {/* Top Navigation & Controls Bar (Hidden in Zen Mode) */}
        {!isZenMode && (
          <header className="navbar">
            {/* Brand Logo & Title */}
            <div className="logo-group">
              <div className="logo-icon-wrap">
                <Clock size={20} className="logo-icon-svg" />
              </div>
              <div className="logo-text">
                <span className="logo-name">ChronoSphere</span>
                <span className="logo-badge">PRO</span>
              </div>
            </div>

            {/* Direct Tab Switcher - Simple and Direct Clicking */}
            <nav className="tab-switcher" role="tablist" aria-label="Feature navigation">
              <button 
                className={`tab-btn ${activeTab === 'clock' ? 'active' : ''}`}
                onClick={() => setActiveTab('clock')}
                role="tab"
                aria-selected={activeTab === 'clock'}
              >
                <Clock size={16} />
                <span>Clock</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'countdown' ? 'active' : ''}`}
                onClick={() => setActiveTab('countdown')}
                role="tab"
                aria-selected={activeTab === 'countdown'}
              >
                <Hourglass size={16} />
                <span>Countdown</span>
              </button>

              {/* All World Timezones Tab */}
              <button 
                className={`tab-btn ${activeTab === 'timezones' ? 'active' : ''}`}
                onClick={() => setActiveTab('timezones')}
                role="tab"
                aria-selected={activeTab === 'timezones'}
              >
                <Globe size={16} />
                <span>All Timezones</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'alarms' ? 'active' : ''}`}
                onClick={() => setActiveTab('alarms')}
                role="tab"
                aria-selected={activeTab === 'alarms'}
              >
                <Bell size={16} />
                <span>Alarms</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'stopwatch' ? 'active' : ''}`}
                onClick={() => setActiveTab('stopwatch')}
                role="tab"
                aria-selected={activeTab === 'stopwatch'}
              >
                <Timer size={16} />
                <span>Stopwatch</span>
              </button>
            </nav>

            {/* Right Controls Bar */}
            <div className="controls-group">
              {/* World Timezones Strip Quick-Toggle */}
              <button 
                className={`icon-ctrl-btn ${showWorldClock ? 'btn-active' : ''}`}
                onClick={() => setShowWorldClock(!showWorldClock)}
                title="Toggle Quick World Timezones Bar"
                aria-label="Toggle Quick World Timezones Bar"
              >
                <Globe size={18} />
              </button>

              {/* 12h/24h Toggle */}
              <button 
                className="icon-ctrl-btn time-mode-btn"
                onClick={() => setIs24Hour(!is24Hour)}
                title={`Switch to ${is24Hour ? '12-Hour' : '24-Hour'} format`}
                aria-label="Toggle 12/24 hour format"
              >
                <span>{is24Hour ? '24H' : '12H'}</span>
              </button>

              {/* Milliseconds toggle (in clock tab) */}
              {activeTab === 'clock' && (
                <button 
                  className={`icon-ctrl-btn ms-toggle-btn ${showMillis ? 'btn-active' : ''}`}
                  onClick={() => setShowMillis(!showMillis)}
                  title="Toggle Milliseconds"
                  aria-label="Toggle Milliseconds"
                >
                  <span>.ms</span>
                </button>
              )}

              {/* Sound On/Off */}
              <button 
                className="icon-ctrl-btn"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Alert Sounds' : 'Enable Alert Sounds'}
                aria-label="Toggle sound alerts"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="muted-icon" />}
              </button>

              {/* Theme Picker Dropdown */}
              <div className="theme-select-relative">
                <button 
                  className="icon-ctrl-btn"
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  title="Change Color Theme"
                  aria-label="Change color theme"
                >
                  <Palette size={18} />
                </button>

                {isThemeOpen && (
                  <div className="theme-popover animate-scale-in">
                    <div className="theme-popover-title">Color Palette</div>
                    <div className="theme-list">
                      {THEMES.map((t) => (
                        <button 
                          key={t.id}
                          className={`theme-item ${theme === t.id ? 'theme-active' : ''}`}
                          onClick={() => {
                            setTheme(t.id);
                            setIsThemeOpen(false);
                          }}
                        >
                          <span className="theme-dot" style={{ backgroundColor: t.color }}></span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Zen / Clean Mode */}
              <button 
                className="icon-ctrl-btn"
                onClick={() => setIsZenMode(true)}
                title="Zen Mode (Distraction-Free)"
                aria-label="Zen Mode"
              >
                <Eye size={18} />
              </button>

              {/* Fullscreen Button */}
              <button 
                className="icon-ctrl-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>
        )}

        {/* Exit Zen Mode Floating Button */}
        {isZenMode && (
          <button 
            className="zen-exit-btn animate-fade-in"
            onClick={() => setIsZenMode(false)}
            title="Exit Zen Mode"
          >
            <EyeOff size={16} />
            <span>Exit Zen Mode</span>
          </button>
        )}

        {/* Quick World Clock Strip (Feature) */}
        {showWorldClock && !isZenMode && (
          <WorldClock 
            is24Hour={is24Hour} 
            pinnedZones={pinnedZones} 
            onOpenAllTimezones={() => setActiveTab('timezones')} 
          />
        )}

        {/* Dynamic Main Body Content Area */}
        <main className="content-viewport">
          {activeTab === 'clock' && (
            <DigitalClock 
              is24Hour={is24Hour} 
              showSeconds={true} 
              showMillis={showMillis}
              targetTimeZone={selectedMainZone}
              onResetToLocal={() => setSelectedMainZone(null)}
            />
          )}

          {activeTab === 'countdown' && (
            <CountdownTimer 
              soundEnabled={soundEnabled} 
            />
          )}

          {activeTab === 'timezones' && (
            <AllTimezones 
              is24Hour={is24Hour}
              selectedMainZone={selectedMainZone}
              onSelectMainZone={(zone) => setSelectedMainZone(zone)}
              pinnedZones={pinnedZones}
              onTogglePinZone={handleTogglePinZone}
            />
          )}

          {activeTab === 'alarms' && (
            <AlarmClock 
              soundEnabled={soundEnabled}
              is24Hour={is24Hour}
            />
          )}

          {activeTab === 'stopwatch' && (
            <Stopwatch 
              soundEnabled={soundEnabled} 
            />
          )}
        </main>

        {/* Clean Footer Bar */}
        {!isZenMode && (
          <footer className="footer-bar">
            <div className="footer-simple-left">
              <span>ChronoSphere &bull; High Precision Live Timepiece & All Timezones Explorer</span>
            </div>
            <div className="footer-simple-right">
              <span>Dual Audio Engine (Desktop & Mobile) &bull; Background Alerts</span>
            </div>
          </footer>
        )}

      </div>
    </div>
  );
}
