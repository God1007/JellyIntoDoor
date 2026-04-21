import { describe, expect, it } from 'vitest';
import { LEVELS, SKINS } from '../src/game/level-data.js';

describe('level data', () => {
  it('exposes six themed skins for the picker', () => {
    expect(SKINS.map((skin) => skin.id)).toEqual([
      'peach',
      'mint',
      'sky',
      'lemon',
      'cherry',
      'ink'
    ]);
  });

  it('uses the smaller door dimensions across every level', () => {
    LEVELS.forEach((level) => {
      expect(level.door).toMatchObject({
        width: 68,
        height: 92
      });
    });
  });
});
