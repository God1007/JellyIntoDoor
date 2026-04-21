const WORLD = { width: 960, height: 540 };

function platform(x, y, width, height = 18, type = 'platform', id = null) {
  return { id, x, y, width, height, type };
}

function wall(x, y, width, height, type = 'wall', id = null) {
  return { id, x, y, width, height, type };
}

function star(id, x, y) {
  return { id, x, y, radius: 12 };
}

function pickup(id, type, x, y) {
  return { id, type, ability: type, x, y, radius: 20 };
}

function button(id, x, y, width = 70) {
  return { id, x, y, width, height: 18 };
}

function spring(x, y, width, height = 22, boost = 1.3, id = null) {
  return {
    id,
    x,
    y,
    width,
    height,
    boost,
    launchBoost: Math.round(boost * 420),
    direction: 'up'
  };
}

function fan(x, y, width, height, strength, id = null) {
  return {
    id,
    x,
    y,
    width,
    height,
    direction: 'up',
    strength
  };
}

function movingPlatform(x, y, width, height, amplitude, axis, speed, id = null) {
  const from = { x, y };
  const to = {
    x: x + (axis === 'x' ? amplitude : 0),
    y: y + (axis === 'y' ? amplitude : 0)
  };

  return {
    id,
    x,
    y,
    width,
    height,
    amplitude,
    axis,
    speed,
    from,
    to,
    position: { ...from }
  };
}

function door(id, x, y, requiresButton = null) {
  return {
    id,
    x,
    y,
    width: 60,
    height: 84,
    requiresButton,
    open: !requiresButton
  };
}

function fragileFloor(id, x, y, width, height = 18) {
  return {
    id,
    x,
    y,
    width,
    height,
    type: 'fragile-floor',
    breakOnHeavy: true,
    breakVelocity: 180
  };
}

export const SKINS = [
  {
    id: 'peach',
    name: 'Peach',
    label: 'Peach',
    theme: 'Soft jam',
    color: '#f8b8a8',
    blush: '#ff8aa1',
    unlockStars: 0
  },
  {
    id: 'mint',
    name: 'Mint',
    label: 'Mint',
    theme: 'Cool breeze',
    color: '#b6f3dc',
    blush: '#7de0c0',
    unlockStars: 4
  },
  {
    id: 'sky',
    name: 'Sky',
    label: 'Sky',
    theme: 'Cloud hop',
    color: '#bfd0ff',
    blush: '#8eb0ff',
    unlockStars: 8
  },
  {
    id: 'lemon',
    name: 'Lemon',
    label: 'Lemon',
    theme: 'Sunny pop',
    color: '#ffe58b',
    blush: '#ffd24d',
    unlockStars: 12
  },
  {
    id: 'cherry',
    name: 'Cherry',
    label: 'Cherry',
    theme: 'Candy punch',
    color: '#ff9aa5',
    blush: '#e65073',
    unlockStars: 18
  },
  {
    id: 'ink',
    name: 'Ink',
    label: 'Ink',
    theme: 'Sketch night',
    color: '#9aa0b9',
    blush: '#4d4e6a',
    unlockStars: 24
  }
];

const RAW_LEVELS = [
  {
    id: '1-1',
    name: 'First Bounce',
    starsTotal: 1,
    medalTargets: { goldTime: 7000, silverTime: 12000, goldLaunches: 2, silverLaunches: 4 },
    world: WORLD,
    spawn: { x: 140, y: 408 },
    door: door('door-1-1', 770, 348),
    platforms: [platform(60, 460, 840, 40, 'ground'), platform(330, 392, 110, 20, 'ledge')],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 410, 340)]
  },
  {
    id: '1-2',
    name: 'Doorstep Hop',
    starsTotal: 2,
    medalTargets: { goldTime: 9000, silverTime: 15000, goldLaunches: 3, silverLaunches: 5 },
    world: WORLD,
    spawn: { x: 150, y: 408 },
    door: door('door-1-2', 760, 280),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(500, 380, 120, 18, 'step'),
      platform(700, 310, 120, 18, 'step')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 540, 330), star('s2', 720, 248)]
  },
  {
    id: '1-3',
    name: 'Tiny Tunnel',
    starsTotal: 2,
    medalTargets: { goldTime: 11000, silverTime: 18000, goldLaunches: 4, silverLaunches: 6 },
    world: WORLD,
    spawn: { x: 150, y: 408 },
    door: door('door-1-3', 770, 348),
    platforms: [platform(60, 460, 840, 40, 'ground'), platform(420, 332, 260, 18, 'tunnel-roof')],
    walls: [
      wall(420, 400, 30, 60, 'tunnel-wall'),
      wall(650, 350, 30, 110, 'tunnel-wall')
    ],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 535, 385), star('s2', 700, 318)]
  },
  {
    id: '1-4',
    name: 'Star Steps',
    starsTotal: 3,
    medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-1-4', 810, 348),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(290, 360, 90, 18, 'step'),
      platform(470, 315, 90, 18, 'step'),
      platform(650, 270, 90, 18, 'step')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 250, 320), star('s2', 515, 270), star('s3', 700, 225)]
  },
  {
    id: '2-1',
    name: 'Button Door',
    starsTotal: 2,
    medalTargets: { goldTime: 12000, silverTime: 19000, goldLaunches: 4, silverLaunches: 7 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-2-1', 790, 348, 'b1'),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(300, 420, 110, 18, 'button-ledge'),
      platform(640, 360, 120, 18, 'goal-ledge')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b1', 320, 402)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 365, 360), star('s2', 680, 310)]
  },
  {
    id: '2-2',
    name: 'Spring Pen',
    starsTotal: 2,
    medalTargets: { goldTime: 11000, silverTime: 17000, goldLaunches: 3, silverLaunches: 6 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-2-2', 780, 218),
    platforms: [platform(60, 460, 840, 40, 'ground'), platform(600, 250, 160, 18, 'goal-ledge')],
    walls: [],
    springs: [spring(310, 438, 90, 22, 1.97, 'spring-2-2')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 350, 330), star('s2', 650, 190)]
  },
  {
    id: '2-3',
    name: 'Fan Page',
    starsTotal: 3,
    medalTargets: { goldTime: 14000, silverTime: 21000, goldLaunches: 4, silverLaunches: 7 },
    world: WORLD,
    spawn: { x: 120, y: 408 },
    door: door('door-2-3', 805, 210),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(420, 390, 120, 18, 'bridge'),
      platform(700, 240, 130, 18, 'goal-ledge')
    ],
    walls: [],
    springs: [spring(250, 438, 88, 22, 1.35, 'spring-2-3')],
    fans: [fan(470, 230, 110, 210, 620, 'fan-2-3')],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [movingPlatform(560, 330, 90, 16, 55, 'x', 1.6, 'moving-2-3')],
    pickups: [],
    stars: [star('s1', 280, 300), star('s2', 515, 205), star('s3', 735, 180)]
  },
  {
    id: '3-1',
    name: 'Blue Grip',
    starsTotal: 2,
    medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-3-1', 800, 220),
    platforms: [platform(60, 460, 840, 40, 'ground'), platform(700, 250, 120, 18, 'goal-ledge')],
    walls: [wall(560, 210, 26, 180, 'sticky-wall')],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-blue', 'sticky', 280, 370)],
    stars: [star('s1', 330, 320), star('s2', 610, 230)]
  },
  {
    id: '3-2',
    name: 'Heavy Drop',
    starsTotal: 3,
    medalTargets: { goldTime: 16000, silverTime: 24000, goldLaunches: 5, silverLaunches: 8 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-3-2', 790, 310, 'b-heavy'),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(280, 402, 130, 16, 'fragile-floor', 'floor-3-2'),
      platform(650, 340, 140, 18, 'goal-ledge')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-heavy', 690, 322)],
    fragileFloors: [fragileFloor('floor-3-2', 280, 402, 130, 16)],
    movingPlatforms: [],
    pickups: [pickup('p-green', 'heavy', 220, 372)],
    stars: [star('s1', 240, 330), star('s2', 520, 385), star('s3', 720, 290)]
  },
  {
    id: '3-3',
    name: 'Elastic Pop',
    starsTotal: 3,
    medalTargets: { goldTime: 16000, silverTime: 25000, goldLaunches: 5, silverLaunches: 8 },
    world: WORLD,
    spawn: { x: 130, y: 408 },
    door: door('door-3-3', 800, 170),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(430, 335, 120, 18, 'mid-ledge'),
      platform(690, 190, 140, 18, 'goal-ledge')
    ],
    walls: [],
    springs: [spring(430, 438, 90, 22, 1.2, 'spring-3-3')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-red', 'elastic', 305, 372)],
    stars: [star('s1', 330, 280), star('s2', 505, 290), star('s3', 730, 140)]
  },
  {
    id: '3-4',
    name: 'Final Scribble',
    starsTotal: 3,
    medalTargets: { goldTime: 20000, silverTime: 30000, goldLaunches: 6, silverLaunches: 10 },
    world: WORLD,
    spawn: { x: 120, y: 408 },
    door: door('door-3-4', 816, 160, 'b-final'),
    platforms: [
      platform(60, 460, 840, 40, 'ground'),
      platform(220, 374, 90, 18, 'ramp'),
      platform(430, 320, 120, 18, 'fragile-floor', 'floor-3-4'),
      platform(650, 250, 140, 18, 'goal-ledge')
    ],
    walls: [wall(350, 250, 24, 160, 'sticky-wall')],
    springs: [spring(220, 438, 88, 22, 1.28, 'spring-3-4')],
    fans: [fan(540, 210, 90, 180, 550, 'fan-3-4')],
    buttons: [button('b-final', 690, 232)],
    fragileFloors: [fragileFloor('floor-3-4', 430, 320, 120, 18)],
    movingPlatforms: [movingPlatform(560, 270, 80, 16, 48, 'y', 1.4, 'moving-3-4')],
    pickups: [pickup('p-blue-final', 'sticky', 260, 340), pickup('p-red-final', 'elastic', 585, 190)],
    stars: [star('s1', 190, 330), star('s2', 480, 270), star('s3', 742, 126)]
  }
];

function normalizeButtons(level, doorList) {
  return (level.buttons ?? []).map((entry, index) => {
    const id = entry.id ?? `${level.id}-button-${index + 1}`;
    const linkedDoor = doorList.find((doorEntry) => doorEntry.requiresButton === id);

    return {
      ...entry,
      id,
      opensDoorId: entry.opensDoorId ?? linkedDoor?.id ?? null
    };
  });
}

function normalizeMovingPlatforms(level) {
  return (level.movingPlatforms ?? []).map((entry, index) => ({
    ...entry,
    id: entry.id ?? `${level.id}-moving-${index + 1}`,
    from: entry.from ?? { x: entry.x, y: entry.y },
    to:
      entry.to ??
      {
        x: entry.x + (entry.axis === 'x' ? entry.amplitude ?? 0 : 0),
        y: entry.y + (entry.axis === 'y' ? entry.amplitude ?? 0 : 0)
      },
    position: entry.position ?? { x: entry.x, y: entry.y }
  }));
}

function normalizeLevel(level) {
  const doors = level.doors ?? (level.door ? [level.door] : []);
  const buttons = normalizeButtons(level, doors);
  const movingPlatforms = normalizeMovingPlatforms(level);
  const surfaces = [...(level.platforms ?? []), ...(level.walls ?? [])];

  return {
    ...level,
    buttons,
    doors,
    door: doors[0] ?? null,
    movingPlatforms,
    surfaces
  };
}

export const LEVELS = RAW_LEVELS.map(normalizeLevel);
