const MEDAL_RANK = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3
};

function normalizeMedal(medal) {
  return MEDAL_RANK[medal] ? medal : 'none';
}

function pickLowerNumber(current, incoming) {
  if (typeof current !== 'number') {
    return typeof incoming === 'number' ? incoming : current ?? null;
  }

  if (typeof incoming !== 'number') {
    return current;
  }

  return Math.min(current, incoming);
}

function pickHigherNumber(current, incoming) {
  if (typeof current !== 'number') {
    return typeof incoming === 'number' ? incoming : current ?? 0;
  }

  if (typeof incoming !== 'number') {
    return current;
  }

  return Math.max(current, incoming);
}

export function evaluateRun(level, stats) {
  const medalTargets = level?.medalTargets ?? {};
  const goldTime = medalTargets.goldTime ?? Number.POSITIVE_INFINITY;
  const silverTime = medalTargets.silverTime ?? Number.POSITIVE_INFINITY;
  const goldJumps = medalTargets.goldJumps ?? medalTargets.goldLaunches ?? Number.POSITIVE_INFINITY;
  const silverJumps =
    medalTargets.silverJumps ?? medalTargets.silverLaunches ?? Number.POSITIVE_INFINITY;
  const jumps = stats.jumps ?? stats.launches ?? Number.POSITIVE_INFINITY;
  const starsCollected = stats.starsCollected ?? 0;
  const starsTotal = level?.starsTotal ?? 0;
  const meetsGold =
    stats.timeMs <= goldTime &&
    jumps <= goldJumps &&
    starsCollected === starsTotal;
  const meetsSilver = stats.timeMs <= silverTime && jumps <= silverJumps;
  const result = {
    ...stats,
    jumps,
    launches: stats.launches ?? jumps,
    starsCollected
  };

  if (meetsGold) {
    return { ...result, medal: 'gold', perfect: true, completed: true };
  }

  if (meetsSilver) {
    return { ...result, medal: 'silver', perfect: false, completed: true };
  }

  return { ...result, medal: 'bronze', perfect: false, completed: true };
}

export function pickBetterMedal(current, incoming) {
  const currentMedal = normalizeMedal(current);
  const nextMedal = normalizeMedal(incoming);

  return MEDAL_RANK[nextMedal] > MEDAL_RANK[currentMedal] ? nextMedal : currentMedal;
}

export function unlocksNextLevel(currentIndex, result, levelCount) {
  if (!result.completed) {
    return currentIndex;
  }

  if (levelCount <= 0) {
    return 0;
  }

  return Math.min(currentIndex + 1, levelCount - 1);
}

export function mergeRunRecord(previous = {}, result = {}) {
  const bestJumps = pickLowerNumber(
    previous.bestJumps ?? previous.bestLaunches,
    result.jumps ?? result.launches
  );

  return {
    bestTimeMs: pickLowerNumber(previous.bestTimeMs, result.timeMs),
    bestJumps,
    bestLaunches: bestJumps,
    starsCollected: pickHigherNumber(previous.starsCollected, result.starsCollected),
    medal: pickBetterMedal(previous.medal, result.medal)
  };
}
