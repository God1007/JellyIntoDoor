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

  function playTone(startHz, endHz, duration, type = 'triangle', gainValue = 0.04) {
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
      oscillator.frequency.linearRampToValueAtTime(
        endHz,
        audio.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  return {
    setEnabled(next) {
      enabled = Boolean(next);
    },
    isEnabled() {
      return enabled;
    },
    playBoing() {
      playTone(240, 320, 0.09, 'triangle', 0.03);
    },
    playPickup() {
      playTone(540, 760, 0.08, 'sine', 0.025);
    },
    playWin() {
      playTone(420, 660, 0.18, 'triangle', 0.04);
    }
  };
}
