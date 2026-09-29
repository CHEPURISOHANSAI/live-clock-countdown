import React, { useState, useEffect } from 'react';
import { Globe, Sun, Moon, Plus } from 'lucide-react';

const DEFAULT_ZONES = [
  'Europe/London',
  'America/New_York',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/Los_Angeles'
];

export default function WorldClock({ is24Hour, pinnedZones = DEFAULT_ZONES, onOpenAllTimezones }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCityTime = (timeZone) => {
    try {
      const opts = {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour
      };
      const timeStr = now.toLocaleTimeString(undefined, opts);

      const hourPart = parseInt(
        now.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', hour12: false }),
        10
      );
      const isDay = hourPart >= 6 && hourPart < 18;

      const parts = timeZone.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');

      return { city, timeStr, isDay };
    } catch (e) {
      return { city: timeZone, timeStr: '--:--', isDay: true };
    }
  };

  const zonesToDisplay = pinnedZones && pinnedZones.length > 0 ? pinnedZones : DEFAULT_ZONES;

  return (
    <div className="world-clock-strip">
      <div className="world-clock-title">
        <Globe size={14} className="globe-icon" />
        <span>WORLD TIMEZONES</span>
      </div>

      <div className="world-cities-scroll">
        {zonesToDisplay.map((zone) => {
          const { city, timeStr, isDay } = formatCityTime(zone);
          return (
            <div key={zone} className="city-pill">
              <span className="city-day-icon">
                {isDay ? <Sun size={12} className="sun-icon" /> : <Moon size={12} className="moon-icon" />}
              </span>
              <div className="city-info">
                <span className="city-name">{city}</span>
                <span className="city-time">{timeStr}</span>
              </div>
            </div>
          );
        })}

        {/* Button to open All Timezones Explorer */}
        <button 
          type="button" 
          className="btn-more-timezones" 
          onClick={onOpenAllTimezones}
          title="Explore and access all 418 world timezones"
        >
          <Plus size={12} />
          <span>All Timezones</span>
        </button>
      </div>
    </div>
  );
}
