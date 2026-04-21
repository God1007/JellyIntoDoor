export const AUDIO_PRESETS = {
  boing: { startHz: 240, endHz: 320, duration: 0.09, type: 'triangle', gain: 0.055 },
  pickup: { startHz: 540, endHz: 760, duration: 0.08, type: 'sine', gain: 0.04 },
  win: { startHz: 420, endHz: 660, duration: 0.18, type: 'triangle', gain: 0.07 },
  fail: { startHz: 190, endHz: 120, duration: 0.12, type: 'sawtooth', gain: 0.06 }
};

export function createAudioManager() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let enabled = true;

  function getContext() {
    if (!AudioContextCtor) {
      return null;
    }

    if (!context) {
      context = new AudioContextCtor();
    }

    return context;
  }

  function playTone(startHz, endHz, duration, type, gainValue) {
    if (!enabled) {
      return;
    }

    const audio = getContext();

    if (!audio) {
      return;
    }

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startHz, audio.currentTime);

    if (endHz !== startHz) {
      oscillator.frequency.linearRampToValueAtTime(endHz, audio.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playPreset(preset) {
    playTone(preset.startHz, preset.endHz, preset.duration, preset.type, preset.gain);
  }

  return {
    setEnabled(next) {
      enabled = Boolean(next);
    },
    isEnabled() {
      return enabled;
    },
    playBoing() {
      playPreset(AUDIO_PRESETS.boing);
    },
    playPickup() {
      playPreset(AUDIO_PRESETS.pickup);
    },
    playWin() {
      playPreset(AUDIO_PRESETS.win);
    },
    playFail() {
      playPreset(AUDIO_PRESETS.fail);
    }
  };
}
