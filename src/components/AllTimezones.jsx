import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Sun, 
  Moon, 
  Star, 
  Check, 
  ArrowRight, 
  Clock, 
  Compass, 
  MapPin, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Common popular timezones for quick filtering
const POPULAR_ZONES = new Set([
  'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Toronto',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
  'Africa/Cairo', 'Africa/Johannesburg', 'America/Sao_Paulo'
]);

export default function AllTimezones({ 
  is24Hour, 
  selectedMainZone, 
  onSelectMainZone,
  pinnedZones,
  onTogglePinZone 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [now, setNow] = useState(new Date());

  // Get all standard IANA timezones
  const allZones = useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
        return Intl.supportedValuesOf('timeZone');
      }
    } catch (e) {
      // fallback
    }
    return [
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'America/Mexico_City', 'America/New_York', 'America/Phoenix',
      'America/Santiago', 'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
      'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Karachi',
      'Asia/Kolkata', 'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai',
      'Asia/Singapore', 'Asia/Taipei', 'Asia/Tokyo',
      'Atlantic/Reykjavik',
      'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
      'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels', 'Europe/Dublin',
      'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
      'Europe/Moscow', 'Europe/Paris', 'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw',
      'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu'
    ];
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format details for a given timezone
  const getZoneInfo = (zone) => {
    try {
      const opts = {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour
      };
      const timeStr = now.toLocaleTimeString(undefined, opts);

      // Extract 24-hr hour to determine daylight/night
      const hourPart = parseInt(
        now.toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', hour12: false }),
        10
      );
      const isDay = hourPart >= 6 && hourPart < 18;

      // Date string
      const dateStr = now.toLocaleDateString(undefined, {
        timeZone: zone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      // Calculate UTC offset
      const nowUtc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const nowTz = new Date(now.toLocaleString('en-US', { timeZone: zone }));
      const diffMinutes = Math.round((nowTz - nowUtc) / (1000 * 60));
      const sign = diffMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(diffMinutes);
      const offH = String(Math.floor(absMinutes / 60)).padStart(2, '0');
      const offM = String(absMinutes % 60).padStart(2, '0');
      const offsetStr = `UTC${sign}${offH}:${offM}`;

      // Clean city name from zone string
      const parts = zone.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      const region = parts[0];

      return {
        zone,
        city,
        region,
        timeStr,
        dateStr,
        offsetStr,
        isDay
      };
    } catch (e) {
      return {
        zone,
        city: zone,
        region: 'Other',
        timeStr: '--:--',
        dateStr: '',
        offsetStr: '',
        isDay: true
      };
    }
  };

  // Regions list for filtering
  const REGIONS = ['ALL', 'POPULAR', 'ASIA', 'EUROPE', 'AMERICA', 'AFRICA', 'AUSTRALIA', 'PACIFIC'];

  // Filtered zones
  const filteredZones = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return allZones.filter((zone) => {
      // Region filter
      if (selectedRegion === 'POPULAR' && !POPULAR_ZONES.has(zone)) return false;
      if (selectedRegion === 'ASIA' && !zone.startsWith('Asia/')) return false;
      if (selectedRegion === 'EUROPE' && !zone.startsWith('Europe/')) return false;
      if (selectedRegion === 'AMERICA' && !zone.startsWith('America/')) return false;
      if (selectedRegion === 'AFRICA' && !zone.startsWith('Africa/')) return false;
      if (selectedRegion === 'AUSTRALIA' && !zone.startsWith('Australia/')) return false;
      if (selectedRegion === 'PACIFIC' && !zone.startsWith('Pacific/')) return false;

      // Search filter
      if (query) {
        const cleanName = zone.toLowerCase().replace(/_/g, ' ');
        return cleanName.includes(query);
      }
      return true;
    });
  }, [allZones, searchTerm, selectedRegion]);

  return (
    <div className="all-timezones-container">
      {/* Header and Controls */}
      <div className="timezones-header-card">
        <div className="header-title-box">
          <div className="tz-live-badge">
            <Globe size={14} className="globe-rot" />
            <span>GLOBAL TIMEZONE EXPLORER</span>
          </div>
          <h2>Access All World Timezones ({allZones.length} Locations)</h2>
          <p className="tz-subtitle">
            Search, view real-time clocks worldwide, pin favorites to your bar, or switch the main digital clock to any timezone.
          </p>
        </div>

        {/* Current Active Main Clock Zone Badge */}
        <div className="active-zone-status">
          <span className="active-zone-label">MAIN CLOCK TIMEZONE:</span>
          <div className="active-zone-chip">
            <MapPin size={14} className="text-primary" />
            <span className="active-zone-name">
              {selectedMainZone ? selectedMainZone.replace(/_/g, ' ') : 'Local Device Time'}
            </span>
            {selectedMainZone && (
              <button 
                type="button" 
                className="btn-reset-zone" 
                onClick={() => onSelectMainZone(null)}
                title="Reset to local time"
              >
                Reset to Local
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar & Region Tabs */}
      <div className="tz-search-filter-card">
        <div className="tz-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by city, country, or timezone (e.g. Tokyo, London, Kolkata, New York, Cairo...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        {/* Region Filter Chips */}
        <div className="tz-region-tabs">
          {REGIONS.map((region) => (
            <button 
              key={region}
              className={`region-tab-btn ${selectedRegion === region ? 'active' : ''}`}
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Timezone Results Grid */}
      <div className="timezones-grid">
        {filteredZones.length === 0 ? (
          <div className="no-tz-found">
            <Compass size={32} />
            <p>No timezones matching "{searchTerm}"</p>
            <button className="btn-secondary" onClick={() => { setSearchTerm(''); setSelectedRegion('ALL'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          filteredZones.map((zone) => {
            const info = getZoneInfo(zone);
            const isMainClock = selectedMainZone === zone;
            const isPinned = pinnedZones.includes(zone);

            return (
              <div 
                key={zone} 
                className={`tz-card ${isMainClock ? 'tz-card-active-main' : ''}`}
              >
                <div className="tz-card-top">
                  <div className="tz-location">
                    <span className="tz-city-name">{info.city}</span>
                    <span className="tz-region-name">{info.zone}</span>
                  </div>
                  <div className="tz-top-actions">
                    {/* Day / Night indicator */}
                    <span className="tz-daylight-icon" title={info.isDay ? 'Daytime' : 'Nighttime'}>
                      {info.isDay ? <Sun size={15} className="sun-icon" /> : <Moon size={15} className="moon-icon" />}
                    </span>

                    {/* Pin / Favorite toggle */}
                    <button 
                      type="button" 
                      className={`btn-pin-tz ${isPinned ? 'pinned' : ''}`}
                      onClick={() => onTogglePinZone(zone)}
                      title={isPinned ? 'Remove from World Clock bar' : 'Pin to World Clock bar'}
                    >
                      <Star size={15} fill={isPinned ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <div className="tz-card-time-row">
                  <span className="tz-time-digits">{info.timeStr}</span>
                  <span className="tz-offset-tag">{info.offsetStr}</span>
                </div>

                <div className="tz-card-footer">
                  <span className="tz-date-label">{info.dateStr}</span>

                  <button 
                    type="button" 
                    className={`btn-set-main ${isMainClock ? 'is-current' : ''}`}
                    onClick={() => onSelectMainZone(isMainClock ? null : zone)}
                    title={isMainClock ? 'Click to reset to local device time' : 'Set as main digital clock display'}
                  >
                    {isMainClock ? (
                      <>
                        <Check size={13} />
                        <span>Active Main Clock</span>
                      </>
                    ) : (
                      <>
                        <span>Set as Clock</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
