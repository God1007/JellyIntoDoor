function createBaseEffect(kind, x, y, tone, life) {
  return {
    kind,
    x,
    y,
    tone,
    age: 0,
    life
  };
}

export function createFloatingText(text, x, y, tone = 'info') {
  const driftX = (Math.random() * 2 - 1) * 10;
  const rise = -18 - Math.random() * 8;

  return {
    ...createBaseEffect('floating-text', x, y, tone, 0.9),
    text: String(text),
    driftX,
    driftY: rise
  };
}

export function createImpactBurst(x, y, strength = 1) {
  const normalizedStrength = Math.max(0.25, Number(strength) || 0.25);
  const sparkCount = Math.max(5, Math.round(6 + normalizedStrength * 5));

  return {
    ...createBaseEffect('impact-burst', x, y, 'impact', 0.45),
    strength: normalizedStrength,
    sparks: Array.from({ length: sparkCount }, (_, index) => {
      const angle = (index / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;

      return {
        angle,
        speed: 28 + Math.random() * 34,
        length: 6 + Math.random() * 8,
        wobble: Math.random() * 0.5 + 0.5
      };
    })
  };
}

export function stepEffects(effects, dt) {
  const delta = Math.max(0, Number(dt) || 0);

  return (effects || []).flatMap((effect) => {
    const next = {
      ...effect,
      age: (effect.age || 0) + delta
    };

    if (next.kind === 'floating-text') {
      next.x += (next.driftX || 0) * delta;
      next.y += (next.driftY || -16) * delta;
    }

    if (next.age >= (next.life || 0)) {
      return [];
    }

    return [next];
  });
}
