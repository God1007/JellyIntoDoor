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
  const { goldTime, silverTime, goldLaunches, silverLaunches } = level.medalTargets;
  const meetsGold =
    stats.timeMs <= goldTime &&
    stats.launches <= goldLaunches &&
    stats.starsCollected === level.starsTotal;
  const meetsSilver = stats.timeMs <= silverTime && stats.launches <= silverLaunches;

  if (meetsGold) {
    return { ...stats, medal: 'gold', perfect: true, completed: true };
  }

  if (meetsSilver) {
    return { ...stats, medal: 'silver', perfect: false, completed: true };
  }

  return { ...stats, medal: 'bronze', perfect: false, completed: true };
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
  return {
    bestTimeMs: pickLowerNumber(previous.bestTimeMs, result.timeMs),
    bestLaunches: pickLowerNumber(previous.bestLaunches, result.launches),
    starsCollected: pickHigherNumber(previous.starsCollected, result.starsCollected),
    medal: pickBetterMedal(previous.medal, result.medal)
  };
}
