const WORLD_HEIGHT = 540;

function world(width) {
  return { width, height: WORLD_HEIGHT };
}

function platform(x, y, width, height = 18, type = 'platform', id = null) {
  return { id, x, y, width, height, type };
}

function ground(width) {
  return platform(0, 460, width, 40, 'ground');
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

function floorDoor(id, x, floorY, requiresButton = null) {
  return door(id, x, floorY - 84, requiresButton);
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
    name: 'Warm-Up Run',
    starsTotal: 3,
    medalTargets: { goldTime: 22000, silverTime: 34000, goldJumps: 10, silverJumps: 18 },
    world: world(2240),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-1', 2100, 460),
    platforms: [
      ground(2240),
      platform(320, 398, 140, 18, 'step'),
      platform(590, 348, 160, 18, 'step'),
      platform(920, 392, 180, 18, 'step'),
      platform(1260, 330, 180, 18, 'step'),
      platform(1640, 392, 180, 18, 'step'),
      platform(1980, 460, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 420, 350), star('s2', 1360, 282), star('s3', 1850, 352)]
  },
  {
    id: '1-2',
    name: 'Three Lanes',
    starsTotal: 3,
    medalTargets: { goldTime: 24000, silverTime: 36000, goldJumps: 12, silverJumps: 20 },
    world: world(2320),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-2', 2170, 392),
    platforms: [
      ground(2320),
      platform(300, 390, 150, 18, 'step'),
      platform(560, 318, 160, 18, 'step'),
      platform(820, 390, 170, 18, 'step'),
      platform(1140, 300, 170, 18, 'step'),
      platform(1480, 390, 170, 18, 'step'),
      platform(1840, 324, 160, 18, 'step'),
      platform(2120, 392, 130, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 640, 270), star('s2', 1215, 252), star('s3', 1890, 276)]
  },
  {
    id: '1-3',
    name: 'Spring Intro',
    starsTotal: 3,
    medalTargets: { goldTime: 23000, silverTime: 35000, goldJumps: 12, silverJumps: 22 },
    world: world(2280),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-3', 2100, 340),
    platforms: [
      ground(2280),
      platform(620, 420, 160, 18, 'spring-ledge'),
      platform(980, 308, 170, 18, 'step'),
      platform(1380, 370, 180, 18, 'step'),
      platform(1740, 300, 180, 18, 'step'),
      platform(2040, 340, 150, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(660, 438, 92, 22, 1.75, 'spring-1-3')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 710, 360), star('s2', 1070, 260), star('s3', 1820, 252)]
  },
  {
    id: '1-4',
    name: 'Button Jog',
    starsTotal: 3,
    medalTargets: { goldTime: 26000, silverTime: 38000, goldJumps: 14, silverJumps: 24 },
    world: world(2400),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-4', 2230, 392, 'b-1-4'),
    platforms: [
      ground(2400),
      platform(500, 390, 160, 18, 'button-ledge'),
      platform(930, 330, 190, 18, 'step'),
      platform(1320, 390, 190, 18, 'step'),
      platform(1730, 314, 180, 18, 'step'),
      platform(2180, 392, 160, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-1-4', 540, 372)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 342), star('s2', 1410, 342), star('s3', 1810, 264)]
  },
  {
    id: '1-5',
    name: 'First Long Push',
    starsTotal: 3,
    medalTargets: { goldTime: 28000, silverTime: 42000, goldJumps: 15, silverJumps: 26 },
    world: world(2520),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-5', 2330, 460),
    platforms: [
      ground(2520),
      platform(360, 394, 140, 18, 'step'),
      platform(760, 342, 180, 18, 'step'),
      platform(1180, 394, 180, 18, 'step'),
      platform(1610, 326, 180, 18, 'step'),
      platform(2010, 394, 180, 18, 'step'),
      platform(2280, 460, 190, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1040, 438, 90, 22, 1.88, 'spring-1-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 450, 346), star('s2', 1085, 288), star('s3', 2080, 344)]
  },
  {
    id: '2-1',
    name: 'Twin Springs',
    starsTotal: 3,
    medalTargets: { goldTime: 30000, silverTime: 44000, goldJumps: 16, silverJumps: 28 },
    world: world(2600),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-1', 2400, 350),
    platforms: [
      ground(2600),
      platform(520, 410, 150, 18, 'spring-ledge'),
      platform(960, 334, 170, 18, 'step'),
      platform(1350, 410, 170, 18, 'spring-ledge'),
      platform(1820, 320, 180, 18, 'step'),
      platform(2340, 350, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [
      spring(560, 438, 90, 22, 1.95, 'spring-2-1-a'),
      spring(1390, 438, 90, 22, 2.02, 'spring-2-1-b')
    ],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 356), star('s2', 1450, 356), star('s3', 1900, 270)]
  },
  {
    id: '2-2',
    name: 'Spring Pen',
    starsTotal: 3,
    medalTargets: { goldTime: 29000, silverTime: 43000, goldJumps: 15, silverJumps: 26 },
    world: world(2320),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-2', 2140, 280),
    platforms: [
      ground(2320),
      platform(520, 410, 180, 18, 'runway'),
      platform(930, 312, 190, 18, 'landing'),
      platform(1380, 220, 180, 18, 'upper'),
      platform(1840, 280, 220, 18, 'goal-floor'),
      platform(2080, 280, 120, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(610, 438, 100, 22, 2.35, 'spring-2-2')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 680, 362), star('s2', 1460, 170), star('s3', 1910, 230)]
  },
  {
    id: '2-3',
    name: 'Fan Ribbon',
    starsTotal: 3,
    medalTargets: { goldTime: 32000, silverTime: 47000, goldJumps: 17, silverJumps: 30 },
    world: world(2700),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-3', 2500, 298),
    platforms: [
      ground(2700),
      platform(460, 394, 180, 18, 'step'),
      platform(920, 350, 180, 18, 'step'),
      platform(1480, 394, 180, 18, 'step'),
      platform(1960, 320, 180, 18, 'step'),
      platform(2440, 298, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1110, 438, 90, 22, 1.92, 'spring-2-3')],
    fans: [fan(1700, 210, 120, 210, 640, 'fan-2-3')],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 560, 346), star('s2', 1180, 362), star('s3', 2030, 264)]
  },
  {
    id: '2-4',
    name: 'Door Relay',
    starsTotal: 3,
    medalTargets: { goldTime: 33000, silverTime: 48000, goldJumps: 18, silverJumps: 30 },
    world: world(2820),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-4', 2590, 352, 'b-2-4'),
    platforms: [
      ground(2820),
      platform(540, 388, 190, 18, 'button-ledge'),
      platform(970, 312, 180, 18, 'step'),
      platform(1460, 388, 180, 18, 'step'),
      platform(1940, 322, 180, 18, 'step'),
      platform(2530, 352, 200, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-2-4', 600, 370)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 670, 340), star('s2', 1550, 340), star('s3', 2000, 272)]
  },
  {
    id: '2-5',
    name: 'Chapter Stretch',
    starsTotal: 3,
    medalTargets: { goldTime: 36000, silverTime: 52000, goldJumps: 19, silverJumps: 33 },
    world: world(2960),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-5', 2740, 300),
    platforms: [
      ground(2960),
      platform(400, 390, 180, 18, 'step'),
      platform(820, 330, 200, 18, 'step'),
      platform(1320, 390, 180, 18, 'step'),
      platform(1780, 316, 180, 18, 'step'),
      platform(2200, 390, 180, 18, 'step'),
      platform(2680, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1040, 438, 90, 22, 2.08, 'spring-2-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 500, 344), star('s2', 1100, 274), star('s3', 2260, 344)]
  }
];

RAW_LEVELS.push(
  {
    id: '3-1',
    name: 'Sticky Reach',
    starsTotal: 3,
    medalTargets: { goldTime: 34000, silverTime: 50000, goldJumps: 18, silverJumps: 31 },
    world: world(3000),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-1', 2780, 332),
    platforms: [
      ground(3000),
      platform(560, 390, 180, 18, 'step'),
      platform(1080, 330, 180, 18, 'step'),
      platform(1640, 390, 180, 18, 'step'),
      platform(2200, 322, 180, 18, 'step'),
      platform(2720, 332, 180, 18, 'goal-floor')
    ],
    walls: [wall(1320, 180, 24, 210, 'sticky-wall')],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-3-1', 'sticky', 930, 360)],
    stars: [star('s1', 620, 344), star('s2', 1390, 230), star('s3', 2260, 274)]
  },
  {
    id: '3-2',
    name: 'Heavy Footing',
    starsTotal: 3,
    medalTargets: { goldTime: 36000, silverTime: 52000, goldJumps: 19, silverJumps: 33 },
    world: world(3040),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-2', 2820, 340, 'b-3-2'),
    platforms: [
      ground(3040),
      platform(520, 390, 180, 18, 'fragile-floor', 'floor-3-2-a'),
      platform(980, 330, 180, 18, 'step'),
      platform(1520, 390, 180, 18, 'fragile-floor', 'floor-3-2-b'),
      platform(2140, 320, 200, 18, 'step'),
      platform(2760, 340, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-3-2', 2190, 302)],
    fragileFloors: [
      fragileFloor('floor-3-2-a', 520, 390, 180, 18),
      fragileFloor('floor-3-2-b', 1520, 390, 180, 18)
    ],
    movingPlatforms: [],
    pickups: [pickup('p-3-2', 'heavy', 860, 360)],
    stars: [star('s1', 610, 340), star('s2', 1600, 340), star('s3', 2230, 272)]
  },
  {
    id: '3-3',
    name: 'Elastic Ladder',
    starsTotal: 3,
    medalTargets: { goldTime: 38000, silverTime: 54000, goldJumps: 20, silverJumps: 35 },
    world: world(3080),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-3', 2860, 280),
    platforms: [
      ground(3080),
      platform(480, 394, 180, 18, 'step'),
      platform(980, 320, 180, 18, 'step'),
      platform(1540, 250, 180, 18, 'step'),
      platform(2140, 320, 180, 18, 'step'),
      platform(2800, 280, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [
      spring(700, 438, 90, 22, 2.1, 'spring-3-3-a'),
      spring(1760, 438, 90, 22, 2.18, 'spring-3-3-b')
    ],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-3-3', 'elastic', 900, 360)],
    stars: [star('s1', 760, 346), star('s2', 1620, 202), star('s3', 2220, 272)]
  },
  {
    id: '3-4',
    name: 'Crosswind Walk',
    starsTotal: 3,
    medalTargets: { goldTime: 40000, silverTime: 56000, goldJumps: 21, silverJumps: 36 },
    world: world(3160),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-4', 2920, 300),
    platforms: [
      ground(3160),
      platform(520, 390, 180, 18, 'step'),
      platform(1080, 338, 180, 18, 'step'),
      platform(1640, 390, 180, 18, 'step'),
      platform(2260, 328, 190, 18, 'step'),
      platform(2860, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [
      fan(1320, 230, 120, 210, 620, 'fan-3-4-a'),
      fan(2480, 210, 120, 220, 700, 'fan-3-4-b')
    ],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 344), star('s2', 1700, 344), star('s3', 2350, 278)]
  },
  {
    id: '3-5',
    name: 'Moving Margin',
    starsTotal: 3,
    medalTargets: { goldTime: 42000, silverTime: 60000, goldJumps: 22, silverJumps: 38 },
    world: world(3200),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-5', 2960, 310),
    platforms: [
      ground(3200),
      platform(560, 390, 170, 18, 'step'),
      platform(1260, 310, 160, 18, 'landing'),
      platform(1860, 390, 180, 18, 'step'),
      platform(2900, 310, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [
      movingPlatform(900, 350, 120, 18, 180, 'x', 1.5, 'moving-3-5-a'),
      movingPlatform(2300, 300, 120, 18, 140, 'y', 1.3, 'moving-3-5-b')
    ],
    pickups: [],
    stars: [star('s1', 960, 300), star('s2', 1920, 344), star('s3', 2360, 246)]
  },
  {
    id: '4-1',
    name: 'Final Chapter Run',
    starsTotal: 3,
    medalTargets: { goldTime: 43000, silverTime: 62000, goldJumps: 22, silverJumps: 39 },
    world: world(3240),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-1', 3000, 300),
    platforms: [
      ground(3240),
      platform(540, 390, 180, 18, 'step'),
      platform(1040, 322, 180, 18, 'step'),
      platform(1580, 390, 180, 18, 'step'),
      platform(2140, 314, 180, 18, 'step'),
      platform(2940, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1280, 438, 90, 22, 2.15, 'spring-4-1')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 640, 344), star('s2', 1340, 272), star('s3', 2190, 264)]
  },
  {
    id: '4-2',
    name: 'Mixed Signals',
    starsTotal: 3,
    medalTargets: { goldTime: 45000, silverTime: 64000, goldJumps: 23, silverJumps: 40 },
    world: world(3300),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-2', 3060, 280, 'b-4-2'),
    platforms: [
      ground(3300),
      platform(560, 390, 180, 18, 'step'),
      platform(1180, 312, 180, 18, 'step'),
      platform(1820, 390, 180, 18, 'fragile-floor', 'floor-4-2'),
      platform(2420, 320, 180, 18, 'step'),
      platform(3000, 280, 180, 18, 'goal-floor')
    ],
    walls: [wall(1500, 180, 24, 210, 'sticky-wall')],
    springs: [spring(820, 438, 90, 22, 2.08, 'spring-4-2')],
    fans: [fan(2100, 210, 110, 210, 660, 'fan-4-2')],
    buttons: [button('b-4-2', 2460, 302)],
    fragileFloors: [fragileFloor('floor-4-2', 1820, 390, 180, 18)],
    movingPlatforms: [],
    pickups: [pickup('p-4-2', 'sticky', 1360, 360)],
    stars: [star('s1', 910, 352), star('s2', 1540, 228), star('s3', 2140, 274)]
  },
  {
    id: '4-3',
    name: 'Elastic Conveyor',
    starsTotal: 3,
    medalTargets: { goldTime: 47000, silverTime: 66000, goldJumps: 24, silverJumps: 42 },
    world: world(3360),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-3', 3120, 300),
    platforms: [
      ground(3360),
      platform(620, 390, 180, 18, 'step'),
      platform(1180, 320, 180, 18, 'step'),
      platform(1740, 390, 180, 18, 'step'),
      platform(2380, 300, 180, 18, 'step'),
      platform(3060, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [
      spring(880, 438, 90, 22, 2.18, 'spring-4-3-a'),
      spring(2040, 438, 90, 22, 2.24, 'spring-4-3-b')
    ],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [movingPlatform(1440, 350, 120, 18, 160, 'x', 1.7, 'moving-4-3')],
    pickups: [pickup('p-4-3', 'elastic', 760, 360)],
    stars: [star('s1', 960, 280), star('s2', 1520, 300), star('s3', 2440, 252)]
  },
  {
    id: '4-4',
    name: 'Pressure Route',
    starsTotal: 3,
    medalTargets: { goldTime: 50000, silverTime: 70000, goldJumps: 25, silverJumps: 44 },
    world: world(3440),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-4', 3200, 292),
    platforms: [
      ground(3440),
      platform(560, 390, 180, 18, 'fragile-floor', 'floor-4-4-a'),
      platform(1220, 320, 180, 18, 'step'),
      platform(1860, 390, 180, 18, 'fragile-floor', 'floor-4-4-b'),
      platform(2500, 322, 180, 18, 'step'),
      platform(3140, 292, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [fan(2040, 220, 120, 210, 700, 'fan-4-4')],
    buttons: [],
    fragileFloors: [
      fragileFloor('floor-4-4-a', 560, 390, 180, 18),
      fragileFloor('floor-4-4-b', 1860, 390, 180, 18)
    ],
    movingPlatforms: [],
    pickups: [pickup('p-4-4', 'heavy', 980, 360)],
    stars: [star('s1', 640, 338), star('s2', 1930, 338), star('s3', 2570, 274)]
  },
  {
    id: '4-5',
    name: 'Door Into Night',
    starsTotal: 3,
    medalTargets: { goldTime: 52000, silverTime: 74000, goldJumps: 26, silverJumps: 46 },
    world: world(3520),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-5', 3280, 260, 'b-4-5'),
    platforms: [
      ground(3520),
      platform(560, 390, 180, 18, 'step'),
      platform(1160, 320, 180, 18, 'step'),
      platform(1760, 390, 180, 18, 'step'),
      platform(2380, 310, 180, 18, 'step'),
      platform(3000, 260, 180, 18, 'goal-floor'),
      platform(3240, 260, 120, 18, 'goal-floor')
    ],
    walls: [wall(1490, 170, 24, 220, 'sticky-wall')],
    springs: [spring(860, 438, 90, 22, 2.22, 'spring-4-5')],
    fans: [fan(2100, 200, 120, 220, 720, 'fan-4-5')],
    buttons: [button('b-4-5', 3050, 242)],
    fragileFloors: [fragileFloor('floor-4-5', 1760, 390, 180, 18)],
    movingPlatforms: [movingPlatform(2640, 320, 120, 18, 170, 'x', 1.6, 'moving-4-5')],
    pickups: [
      pickup('p-4-5-a', 'sticky', 1360, 360),
      pickup('p-4-5-b', 'elastic', 2240, 272)
    ],
    stars: [star('s1', 920, 344), star('s2', 1510, 220), star('s3', 2690, 260)]
  }
);

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
