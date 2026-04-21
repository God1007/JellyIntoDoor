import { jitterPoints, paletteForSkin, resolveBlobFace } from './doodle.js';

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPaperBackground(ctx, width, height) {
  ctx.fillStyle = '#f7f1df';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#a88d66';
  for (let y = 24; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + ((y / 24) % 2 ? 1 : -1));
    ctx.stroke();
  }
  ctx.restore();
}

function getRuntimeEntity(runtimeMap, id, fallback = {}) {
  return runtimeMap?.[id] ?? fallback;
}

function drawPlatform(ctx, surface) {
  ctx.save();
  ctx.fillStyle = surface.type === 'ground' ? '#d9bd7e' : '#ead9a9';
  ctx.strokeStyle = '#6a5132';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, surface.x, surface.y, surface.width, surface.height, 7);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#8c6f41';
  for (let x = surface.x + 10; x < surface.x + surface.width - 6; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, surface.y + 4);
    ctx.lineTo(x + 8, surface.y + surface.height - 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWall(ctx, wall) {
  ctx.save();
  ctx.fillStyle = '#f2dfb7';
  ctx.strokeStyle = '#6d5839';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, wall.x, wall.y, wall.width, wall.height, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, star, collected) {
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.globalAlpha = collected ? 0.18 : 1;
  ctx.fillStyle = '#ffd85d';
  ctx.strokeStyle = '#8c6c1e';
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let index = 0; index < 5; index += 1) {
    const outerAngle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
    const innerAngle = outerAngle + Math.PI / 5;

    if (index === 0) {
      ctx.moveTo(Math.cos(outerAngle) * 14, Math.sin(outerAngle) * 14);
    }

    ctx.lineTo(Math.cos(innerAngle) * 6, Math.sin(innerAngle) * 6);
    ctx.lineTo(
      Math.cos(outerAngle + (Math.PI * 2) / 5) * 14,
      Math.sin(outerAngle + (Math.PI * 2) / 5) * 14
    );
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPickup(ctx, pickup, collected) {
  ctx.save();
  ctx.translate(pickup.x, pickup.y);
  ctx.globalAlpha = collected ? 0.2 : 1;
  const palette =
    pickup.ability === 'sticky'
      ? { fill: '#8dc8ff', stroke: '#426d9e' }
      : pickup.ability === 'heavy'
        ? { fill: '#8fd37f', stroke: '#4d7b42' }
        : { fill: '#ff9f8b', stroke: '#91483f' };

  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  roundedRectPath(ctx, -14, -14, 28, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDoor(ctx, door, isOpen) {
  ctx.save();
  ctx.translate(door.x, door.y);
  ctx.fillStyle = '#d3b287';
  ctx.strokeStyle = '#7a5838';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 0, 0, door.width, door.height, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isOpen ? '#fff0b4' : '#b9d2ff';
  roundedRectPath(ctx, door.width * 0.18, door.height * 0.18, door.width * 0.42, door.height * 0.28, 7);
  ctx.fill();
  ctx.stroke();

  if (isOpen) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffe982';
    ctx.fillRect(door.width * 0.08, 0, door.width * 0.84, door.height);
  }

  ctx.restore();
}

function drawButton(ctx, button, pressed) {
  ctx.save();
  ctx.fillStyle = pressed ? '#ffb26c' : '#f6d59c';
  ctx.strokeStyle = '#7b5b31';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, button.x, button.y, button.width, button.height, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSpring(ctx, spring) {
  ctx.save();
  ctx.strokeStyle = '#da6f4f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(spring.x, spring.y + spring.height);
  for (let offset = 0; offset <= spring.width; offset += spring.width / 6) {
    const peak = offset % (spring.width / 3) === 0 ? spring.y : spring.y + spring.height;
    ctx.lineTo(spring.x + offset, peak);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFan(ctx, fan) {
  ctx.save();
  ctx.fillStyle = 'rgba(116, 198, 241, 0.18)';
  ctx.strokeStyle = '#5c8aa4';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, fan.x, fan.y, fan.width, fan.height, 12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#5c8aa4';
  ctx.lineWidth = 2;
  const centerX = fan.x + fan.width / 2;
  const centerY = fan.y + fan.height / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, fan.y + fan.height - 10);
  ctx.lineTo(centerX, fan.y + 12);
  ctx.lineTo(centerX - 8, fan.y + 22);
  ctx.moveTo(centerX, fan.y + 12);
  ctx.lineTo(centerX + 8, fan.y + 22);
  ctx.stroke();
  ctx.restore();
}

function drawBlob(ctx, blob) {
  const palette = paletteForSkin(blob.skinId || 'peach');
  const face = resolveBlobFace(blob);
  const radius = blob.radius ?? 18;
  const points = [];

  for (let index = 0; index < 14; index += 1) {
    const angle = (Math.PI * 2 * index) / 14;
    const wobble = 1 + Math.sin(angle * 3 + blob.position.x * 0.01) * 0.05;
    points.push({
      x: blob.position.x + Math.cos(angle) * radius * wobble,
      y: blob.position.y + Math.sin(angle) * radius * wobble
    });
  }

  const outline = jitterPoints(points, radius * 0.04);

  ctx.save();
  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  outline.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.highlight;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(
    blob.position.x - radius * 0.26,
    blob.position.y - radius * 0.3,
    radius * 0.22,
    radius * 0.14,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = palette.outline;
  ctx.beginPath();
  ctx.arc(blob.position.x - radius * 0.22, blob.position.y - radius * 0.08, 2.1, 0, Math.PI * 2);
  ctx.arc(blob.position.x + radius * 0.22, blob.position.y - radius * 0.08, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (face === 'yay') {
    ctx.arc(blob.position.x, blob.position.y + radius * 0.05, radius * 0.24, 0.1, Math.PI - 0.1);
  } else if (face === 'focus') {
    ctx.moveTo(blob.position.x - radius * 0.18, blob.position.y + radius * 0.18);
    ctx.quadraticCurveTo(blob.position.x, blob.position.y + radius * 0.04, blob.position.x + radius * 0.18, blob.position.y + radius * 0.18);
  } else if (face === 'wobble') {
    ctx.moveTo(blob.position.x - radius * 0.18, blob.position.y + radius * 0.16);
    ctx.quadraticCurveTo(blob.position.x, blob.position.y + radius * 0.28, blob.position.x + radius * 0.18, blob.position.y + radius * 0.16);
  } else {
    ctx.moveTo(blob.position.x - radius * 0.14, blob.position.y + radius * 0.16);
    ctx.lineTo(blob.position.x + radius * 0.14, blob.position.y + radius * 0.16);
  }
  ctx.stroke();
  ctx.restore();
}

function drawEffects(ctx, effects) {
  effects.forEach((effect) => {
    const ageRatio = Math.min(1, (effect.age ?? 0) / Math.max(effect.life ?? 1, 0.001));
    ctx.save();
    ctx.globalAlpha = 1 - ageRatio;

    if (effect.kind === 'floating-text') {
      ctx.fillStyle = effect.tone === 'good' ? '#2d6b4f' : '#5a4735';
      ctx.font = '600 18px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effect.text, effect.x, effect.y);
    } else if (effect.kind === 'impact-burst') {
      ctx.strokeStyle = '#7d5f33';
      ctx.lineWidth = 1.5;
      effect.sparks.forEach((spark) => {
        const length = 12 + spark.length;
        const x2 = effect.x + Math.cos(spark.angle) * length;
        const y2 = effect.y + Math.sin(spark.angle) * length;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    ctx.restore();
  });
}

function drawHint(ctx, hint) {
  if (!hint) {
    return;
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 236, 0.86)';
  ctx.strokeStyle = '#6f5736';
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, 16, 16, Math.min(420, 24 + hint.length * 14), 38, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4e3d2a';
  ctx.font = '600 16px "Trebuchet MS", sans-serif';
  ctx.fillText(hint, 30, 41);
  ctx.restore();
}

export function renderFrame(ctx, snapshot = {}) {
  if (!ctx) {
    return;
  }

  const level = snapshot.level;
  const runtime = snapshot.runtime ?? {};
  const width = snapshot.width ?? ctx.canvas.width ?? 960;
  const height = snapshot.height ?? ctx.canvas.height ?? 540;
  const brokenFloorIds = new Set(runtime.brokenFloorIds ?? []);

  ctx.clearRect(0, 0, width, height);
  drawPaperBackground(ctx, width, height);

  if (level) {
    (level.platforms ?? []).forEach((surface) => {
      if (surface.type === 'fragile-floor' && brokenFloorIds.has(surface.id)) {
        return;
      }

      drawPlatform(ctx, surface);
    });

    (level.walls ?? []).forEach((surface) => drawWall(ctx, surface));

    (runtime.movingPlatforms ?? []).forEach((surface) => {
      drawPlatform(ctx, {
        x: surface.position.x,
        y: surface.position.y,
        width: surface.width,
        height: surface.height,
        type: 'moving-platform'
      });
    });

    (level.fans ?? []).forEach((fan) => drawFan(ctx, fan));
    (level.springs ?? []).forEach((spring) => drawSpring(ctx, spring));

    (level.buttons ?? []).forEach((button) => {
      drawButton(ctx, button, Boolean(getRuntimeEntity(runtime.buttons, button.id).pressed));
    });

    (level.stars ?? []).forEach((star) => {
      drawStar(ctx, star, Boolean(getRuntimeEntity(runtime.stars, star.id).collected));
    });

    (level.pickups ?? []).forEach((pickup) => {
      drawPickup(ctx, pickup, Boolean(getRuntimeEntity(runtime.pickups, pickup.id).collected));
    });

    const door = level.door ?? level.doors?.[0];
    if (door) {
      drawDoor(ctx, door, Boolean(getRuntimeEntity(runtime.doors, door.id, door).open));
    }
  }

  if (snapshot.blob) {
    drawBlob(ctx, {
      ...snapshot.blob,
      status: snapshot.status
    });
  }

  drawEffects(ctx, snapshot.effects ?? []);
  drawHint(ctx, snapshot.hint);
}
