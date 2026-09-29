// Robust Multi-Platform Audio Engine (Desktop + iOS Safari + Android Chrome)
// Uses Dual Audio Architecture:
// 1. In-memory synthesized high-energy PCM WAV audio element (guaranteed mobile loop compatibility)
// 2. Web Audio API multi-voice synthesizer (driving loud harmonic music fanfare)
// 3. Vibration API for mobile tactile alert

let audioCtx = null;
let alarmAudioEl = null;
let alarmMusicInterval = null;
let alarmTimeoutTimer = null;
let alarmCountdownInterval = null;
let alarmRemainingSecs = 0;
let onCountdownTickCallback = null;
let isAudioUnlocked = false;

/**
 * Generate a standalone loud, rhythmic 16-bit PCM WAV audio data URL in memory
 */
function createAlarmWavUrl() {
  const sampleRate = 22050;
  const duration = 1.6; // 1.6-second energetic rhythmic loop
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat PCM
  view.setUint16(22, 1, true); // NumChannels Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate an energetic multi-tone alarm rhythm
  // 4 loud distinct notes: D5 (587Hz), G5 (784Hz), B5 (988Hz), E6 (1318Hz)
  const freqs = [587.33, 783.99, 987.77, 1318.51];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.floor((t / duration) * 4) % 4;
    const f = freqs[noteIdx];

    // Square-ish rich harmonic wave + sub-bass
    const w1 = Math.sin(2 * Math.PI * f * t);
    const w2 = Math.sin(2 * Math.PI * (f * 2) * t) * 0.4;
    const wSub = Math.sin(2 * Math.PI * 146.83 * t) * 0.3; // D3 bass beat

    // Attack / decay envelope for punchy percussive attack
    const noteT = (t % (duration / 4)) / (duration / 4);
    const env = Math.exp(-noteT * 3.5);

    const val = (w1 + w2 + wSub) * env * 0.75;
    const clamped = Math.max(-1, Math.min(1, val));
    view.setInt16(44 + i * 2, Math.floor(clamped * 32000), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Pre-create the HTML5 audio element
if (typeof window !== 'undefined') {
  try {
    const wavUrl = createAlarmWavUrl();
    alarmAudioEl = new Audio(wavUrl);
    alarmAudioEl.loop = true;
    alarmAudioEl.volume = 1.0;
  } catch (e) {
    console.warn('WAV creation warning:', e);
  }
}

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Explicit Mobile Audio Unlocker
 * Mobile browsers require an active touch/click to unlock AudioContext and HTML5 Audio
 */
export function unlockAudioOnMobile() {
  if (isAudioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Play a 1-sample silent buffer to unlock iOS Safari WebKit audio pipeline
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }

    // Prime HTML5 audio element
    if (alarmAudioEl) {
      const playPromise = alarmAudioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            alarmAudioEl.pause();
            alarmAudioEl.currentTime = 0;
            isAudioUnlocked = true;
            console.log('[Mobile Audio] Successfully primed and unlocked!');
          })
          .catch((err) => {
            console.log('[Mobile Audio] Pre-play note:', err.message);
          });
      }
    }
  } catch (e) {
    console.error('unlockAudio error:', e);
  }
}

// Auto-attach unlocker to early user gestures
if (typeof window !== 'undefined') {
  const handler = () => {
    unlockAudioOnMobile();
    window.removeEventListener('touchstart', handler);
    window.removeEventListener('touchend', handler);
    window.removeEventListener('click', handler);
  };
  window.addEventListener('touchstart', handler, { passive: true });
  window.addEventListener('touchend', handler, { passive: true });
  window.addEventListener('click', handler, { passive: true });
}

/**
 * Play a short tactile click/tick
 */
export function playTick(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch (e) {
    // ignore
  }
}

/**
 * Synthesizes a loud, driving arpeggiated music fanfare
 */
function playMusicFanfareSequence(ctx) {
  if (!ctx || ctx.state === 'closed') return;

  // Energetic upbeat musical sequence (120 BPM driving melody)
  // Notes: E5 (659Hz), G#5 (831Hz), B5 (988Hz), E6 (1318Hz), B5 (988Hz), G#5 (831Hz), F#5 (740Hz), E5 (659Hz)
  const notes = [
    { f: 659.25, d: 0.15 },
    { f: 830.61, d: 0.15 },
    { f: 987.77, d: 0.15 },
    { f: 1318.51, d: 0.25 },
    { f: 987.77, d: 0.15 },
    { f: 830.61, d: 0.15 },
    { f: 739.99, d: 0.15 },
    { f: 659.25, d: 0.35 }
  ];

  let timeOffset = ctx.currentTime;

  notes.forEach((note) => {
    // Voice 1: Main Lead Sawtooth/Square (bright & piercing)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(note.f, timeOffset);

    // Voice 2: Octave Doubler / Harmony (full body loudness)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note.f * 0.5, timeOffset); // Sub-octave

    // Envelope
    gain.gain.setValueAtTime(0, timeOffset);
    gain.gain.linearRampToValueAtTime(0.35, timeOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + note.d);

    gain2.gain.setValueAtTime(0, timeOffset);
    gain2.gain.linearRampToValueAtTime(0.25, timeOffset + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, timeOffset + note.d);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(timeOffset);
    osc.stop(timeOffset + note.d + 0.05);

    osc2.start(timeOffset);
    osc2.stop(timeOffset + note.d + 0.05);

    timeOffset += note.d * 0.95;
  });
}

/**
 * Start LOUD ALARM MUSIC that plays for at least 1 MINUTE (60 seconds)
 * Supports user stopping at any moment
 * @param {boolean} enabled
 * @param {Function} onTick - callback receiving remaining seconds (60 -> 0)
 * @param {Function} onComplete - callback when 1 minute expires
 */
export function startOneMinuteLoudAlarm(enabled = true, onTick = null, onComplete = null) {
  if (!enabled) return;
  stopAlarmLoop(); // Ensure any previous alarm is stopped

  alarmRemainingSecs = 60; // Full 1 minute duration
  onCountdownTickCallback = onTick;

  // 1. Play HTML5 Audio element loop (works robustly on mobile)
  if (alarmAudioEl) {
    try {
      alarmAudioEl.currentTime = 0;
      const playPromise = alarmAudioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('[HTML5 Audio play warning]:', e.message);
        });
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 2. Play Web Audio API musical fanfare loop
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      playMusicFanfareSequence(ctx);

      alarmMusicInterval = setInterval(() => {
        if (ctx && ctx.state !== 'closed') {
          playMusicFanfareSequence(ctx);
        }
      }, 1500);
    }
  } catch (e) {
    console.warn('Web Audio start error:', e);
  }

  // 3. Mobile Phone Vibration (repeating 500ms buzzes)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([500, 200, 500, 200, 500]);
    } catch (e) {
      // ignore
    }
  }

  // 4. Update live seconds countdown every second
  if (onCountdownTickCallback) {
    onCountdownTickCallback(alarmRemainingSecs);
  }

  alarmCountdownInterval = setInterval(() => {
    alarmRemainingSecs -= 1;

    // Trigger physical phone vibration every 3 seconds during alarm
    if (alarmRemainingSecs % 3 === 0 && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 150, 400]);
      } catch (e) {}
    }

    if (onCountdownTickCallback) {
      onCountdownTickCallback(alarmRemainingSecs);
    }

    if (alarmRemainingSecs <= 0) {
      stopAlarmLoop();
      if (onComplete) onComplete();
    }
  }, 1000);

  // 5. Hard stop after 60 seconds (1 minute)
  alarmTimeoutTimer = setTimeout(() => {
    stopAlarmLoop();
    if (onComplete) onComplete();
  }, 60000);
}

/**
 * STOP ALARM completely (stops audio element, web audio loop, vibration, and timers)
 */
export function stopAlarmLoop() {
  // Stop HTML5 Audio
  if (alarmAudioEl) {
    try {
      alarmAudioEl.pause();
      alarmAudioEl.currentTime = 0;
    } catch (e) {}
  }

  // Stop Web Audio loop
  if (alarmMusicInterval) {
    clearInterval(alarmMusicInterval);
    alarmMusicInterval = null;
  }

  // Stop countdown intervals
  if (alarmCountdownInterval) {
    clearInterval(alarmCountdownInterval);
    alarmCountdownInterval = null;
  }

  // Stop hard timeout
  if (alarmTimeoutTimer) {
    clearTimeout(alarmTimeoutTimer);
    alarmTimeoutTimer = null;
  }

  // Stop mobile vibration
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (e) {}
  }

  alarmRemainingSecs = 0;
  if (onCountdownTickCallback) {
    onCountdownTickCallback(0);
  }
}

/**
 * Play a preview of the loud alarm (e.g. 4 seconds) to test volume on mobile or desktop
 */
export function playTestSound() {
  unlockAudioOnMobile();
  startOneMinuteLoudAlarm(true);
  setTimeout(() => {
    stopAlarmLoop();
  }, 4000);
}

// Backward-compatible aliases
export const startAlarmLoop = startOneMinuteLoudAlarm;
export const playAlarm = startOneMinuteLoudAlarm;
