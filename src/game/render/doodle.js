const PALETTES = {
  peach: {
    fill: '#f8b8a8',
    outline: '#7c4a40',
    highlight: '#ffe4da',
    blush: '#ff8aa1',
    shadow: 'rgba(124, 74, 64, 0.18)',
    glow: 'rgba(255, 209, 195, 0.45)'
  },
  mint: {
    fill: '#b6f3dc',
    outline: '#35685c',
    highlight: '#ebfff7',
    blush: '#7de0c0',
    shadow: 'rgba(53, 104, 92, 0.18)',
    glow: 'rgba(182, 243, 220, 0.45)'
  },
  sky: {
    fill: '#bfd0ff',
    outline: '#42558e',
    highlight: '#f1f5ff',
    blush: '#8eb0ff',
    shadow: 'rgba(66, 85, 142, 0.18)',
    glow: 'rgba(191, 208, 255, 0.45)'
  },
  lemon: {
    fill: '#ffe58b',
    outline: '#8c6a18',
    highlight: '#fff9d8',
    blush: '#ffd24d',
    shadow: 'rgba(140, 106, 24, 0.18)',
    glow: 'rgba(255, 229, 139, 0.45)'
  },
  cherry: {
    fill: '#ff9aa5',
    outline: '#8a314b',
    highlight: '#ffe1e5',
    blush: '#e65073',
    shadow: 'rgba(138, 49, 75, 0.18)',
    glow: 'rgba(255, 154, 165, 0.45)'
  },
  ink: {
    fill: '#9aa0b9',
    outline: '#404253',
    highlight: '#ebeef8',
    blush: '#4d4e6a',
    shadow: 'rgba(64, 66, 83, 0.2)',
    glow: 'rgba(154, 160, 185, 0.4)'
  }
};

function offset(amount) {
  return (Math.random() * 2 - 1) * amount;
}

export function jitterPoints(points, amount = 0) {
  const spread = Math.max(0, Number(amount) || 0);

  return (points || []).map((point) => {
    if (Array.isArray(point)) {
      const [x = 0, y = 0] = point;
      return [x + offset(spread), y + offset(spread)];
    }

    return {
      ...point,
      x: (point?.x ?? 0) + offset(spread),
      y: (point?.y ?? 0) + offset(spread)
    };
  });
}

export function resolveBlobFace(state = {}) {
  const status = String(state.status || state.phase || state.mode || '').toLowerCase();

  if (
    state.goalReached ||
    state.reachedGoal ||
    state.isGoal ||
    status === 'goal' ||
    status === 'won' ||
    status === 'win' ||
    status === 'victory'
  ) {
    return 'yay';
  }

  if (state.paused || status === 'paused') {
    return 'calm';
  }

  if (state.hit || state.hurt || status === 'hurt') {
    return 'ouch';
  }

  if (state.charging || status === 'charge') {
    return 'focus';
  }

  if (state.velocity && (Math.abs(state.velocity.x || 0) > 80 || Math.abs(state.velocity.y || 0) > 80)) {
    return 'wobble';
  }

  return 'idle';
}

export function paletteForSkin(skinId) {
  return {
    ...(PALETTES[skinId] || PALETTES.peach)
  };
}
