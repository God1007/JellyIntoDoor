import { mergeRunRecord } from './game/scoring.js';

export const STORAGE_KEY = 'doodle-blob-save-v1';

function getStorage() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return globalThis.localStorage ?? null;
}

function normalizeLevelRecords(levels) {
  if (!levels || typeof levels !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(levels).map(([levelIndex, record]) => [
      levelIndex,
      mergeRunRecord(record)
    ])
  );
}

function normalizeProfile(profile) {
  const defaults = createDefaultProfile();

  if (!profile || typeof profile !== 'object') {
    return defaults;
  }

  return {
    ...defaults,
    ...profile,
    unlockedLevelIndex:
      Number.isInteger(profile.unlockedLevelIndex) && profile.unlockedLevelIndex >= 0
        ? profile.unlockedLevelIndex
        : defaults.unlockedLevelIndex,
    selectedSkin:
      typeof profile.selectedSkin === 'string' ? profile.selectedSkin : defaults.selectedSkin,
    soundEnabled:
      typeof profile.soundEnabled === 'boolean' ? profile.soundEnabled : defaults.soundEnabled,
    levels: normalizeLevelRecords(profile.levels)
  };
}

export function createDefaultProfile() {
  return {
    unlockedLevelIndex: 0,
    selectedSkin: 'peach',
    soundEnabled: true,
    levels: {}
  };
}

export function mergeLevelResult(profile, levelIndex, result) {
  const currentProfile = normalizeProfile(profile);
  const previousRecord = currentProfile.levels[levelIndex] ?? {};
  const nextRecord = mergeRunRecord(previousRecord, result);
  const completed = Boolean(result?.completed);

  return {
    ...currentProfile,
    unlockedLevelIndex: Math.max(
      currentProfile.unlockedLevelIndex,
      completed ? levelIndex + 1 : currentProfile.unlockedLevelIndex
    ),
    levels: {
      ...currentProfile.levels,
      [levelIndex]: nextRecord
    }
  };
}

export function getUnlockedSkinIds(profile, skins) {
  const totalStars = Object.values(profile?.levels ?? {}).reduce(
    (sum, level) => sum + (level?.starsCollected ?? 0),
    0
  );

  return skins
    .filter((skin) => totalStars >= skin.unlockStars)
    .map((skin) => skin.id);
}

export function loadProfile() {
  const storage = getStorage();

  if (!storage) {
    return createDefaultProfile();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultProfile();
    }

    return normalizeProfile(JSON.parse(raw));
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile) {
  const storage = getStorage();
  const nextProfile = normalizeProfile(profile);

  if (!storage) {
    return nextProfile;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  } catch {
    // Ignore storage quota / availability issues and keep the normalized profile.
  }

  return nextProfile;
}
