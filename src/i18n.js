export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '\u4e2d\u6587' }
];

const TEXT = {
  en: {
    metaTitle: 'Doodle Blob: Into the Door!',
    canvasLabel: 'Doodle Blob game canvas',
    common: {
      language: 'Language',
      backToTitle: 'Back to title',
      retry: 'Retry',
      nextLevel: 'Next level',
      time: 'Time',
      jumps: 'Jumps',
      launches: 'Jumps',
      stars: 'Stars',
      medal: 'Medal',
      landscapeRecommended: 'Landscape recommended'
    },
    title: {
      eyebrow: 'Paper platformer',
      heading: 'Doodle Blob',
      subtitle: 'Into the Door!',
      start: 'Start',
      levelSelect: 'Level select',
      skins: 'Skins',
      soundOn: 'Sound: on',
      soundOff: 'Sound: off',
      skinChip: 'Skin: {skin}',
      soundChipOn: 'Sound: on',
      soundChipOff: 'Sound: off',
      help: 'Move, jump, collect every star, and reach the door.'
    },
    levelSelect: {
      title: 'Choose a level',
      best: 'Best'
    },
    skinPicker: {
      title: 'Pick a skin'
    },
    results: {
      eyebrow: 'Run complete',
      title: 'Results',
      summary: 'The door opened and the blob made it through.'
    },
    hud: {
      level: 'Level {level}',
      stars: 'Stars {count}',
      jumps: 'Jumps {count}',
      launches: 'Jumps {count}',
      pause: 'Pause',
      resume: 'Resume',
      settings: 'Settings',
      soundOn: 'Sound: on',
      soundOff: 'Sound: off',
      starsProgress: 'Stars {count} / {total}',
      failedCenter: 'Fell out. Retry and go again.',
      starsMissing: '{count} star left',
      paused: 'Paused',
      back: 'Back',
      keepMoving: 'Keep the blob moving.',
      failed: 'The blob slipped off the page.',
      ability: 'Power: {ability}',
      drag: 'Move and jump toward the door.',
      jump: 'Jump',
      microcopy: 'A/D or arrows to move. Space to jump.'
    },
    world: {
      title: 'Move across the paper, grab every star, and reach the little door.',
      levelSelect: 'Long stages, cleaner routes, and faster movement.',
      skinPicker: 'More stars unlock more themed blobs.'
    },
    effects: {
      pickedAbility: 'Picked up {ability}',
      star: 'Star +1',
      fellOff: 'Blob down'
    },
    medalNames: {
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze'
    },
    abilityNames: {
      sticky: 'sticky',
      heavy: 'heavy',
      elastic: 'elastic'
    },
    skins: {
      peach: { label: 'Peach', theme: 'Soft jam' },
      mint: { label: 'Mint', theme: 'Cool breeze' },
      sky: { label: 'Sky', theme: 'Cloud hop' },
      lemon: { label: 'Lemon', theme: 'Sunny pop' },
      cherry: { label: 'Cherry', theme: 'Candy punch' },
      ink: { label: 'Ink', theme: 'Sketch night' }
    }
  },
  zh: {
    metaTitle: '\u6d82\u9e26\u56e2\u5b50\uff1a\u51b2\u8fdb\u95e8\u91cc\uff01',
    canvasLabel: '\u6d82\u9e26\u56e2\u5b50\u6e38\u620f\u753b\u5e03',
    common: {
      language: '\u8bed\u8a00',
      backToTitle: '\u56de\u5230\u6807\u9898',
      retry: '\u91cd\u8bd5',
      nextLevel: '\u4e0b\u4e00\u5173',
      time: '\u65f6\u95f4',
      jumps: '\u8df3\u8dc3',
      launches: '\u8df3\u8dc3',
      stars: '\u661f\u661f',
      medal: '\u5956\u724c',
      landscapeRecommended: '\u63a8\u8350\u6a2a\u5c4f\u4f53\u9a8c'
    },
    title: {
      eyebrow: '\u7eb8\u9762\u5e73\u53f0\u95ef\u5173',
      heading: '\u6d82\u9e26\u56e2\u5b50',
      subtitle: '\u51b2\u8fdb\u95e8\u91cc\uff01',
      start: '\u5f00\u59cb',
      levelSelect: '\u9009\u5173',
      skins: '\u6362\u76ae\u80a4',
      soundOn: '\u58f0\u97f3\uff1a\u5f00',
      soundOff: '\u58f0\u97f3\uff1a\u5173',
      skinChip: '\u76ae\u80a4\uff1a{skin}',
      soundChipOn: '\u58f0\u97f3\uff1a\u5f00',
      soundChipOff: '\u58f0\u97f3\uff1a\u5173',
      help: '\u79fb\u52a8\u3001\u8df3\u8dc3\uff0c\u6536\u96c6\u5168\u90e8\u661f\u661f\uff0c\u518d\u8fdb\u5165\u5c0f\u95e8\u3002'
    },
    levelSelect: {
      title: '\u9009\u62e9\u5173\u5361',
      best: '\u6700\u4f73'
    },
    skinPicker: {
      title: '\u9009\u62e9\u76ae\u80a4'
    },
    results: {
      eyebrow: '\u8fc7\u5173',
      title: '\u7ed3\u7b97',
      summary: '\u95e8\u5df2\u6253\u5f00\uff0c\u56e2\u5b50\u987a\u5229\u51b2\u4e86\u8fdb\u53bb\u3002'
    },
    hud: {
      level: '\u5173\u5361 {level}',
      stars: '\u661f\u661f {count}',
      jumps: '\u8df3\u8dc3 {count}',
      launches: '\u8df3\u8dc3 {count}',
      pause: '\u6682\u505c',
      resume: '\u7ee7\u7eed',
      settings: '\u8bbe\u7f6e',
      soundOn: '\u58f0\u97f3\uff1a\u5f00',
      soundOff: '\u58f0\u97f3\uff1a\u5173',
      starsProgress: '\u661f\u661f {count} / {total}',
      failedCenter: '\u6389\u51fa\u53bb\u4e86\uff0c\u91cd\u8bd5\u518d\u6765\u4e00\u6b21\u3002',
      starsMissing: '\u8fd8\u5dee {count} \u9897\u661f',
      paused: '\u5df2\u6682\u505c',
      back: '\u8fd4\u56de',
      keepMoving: '\u7ee7\u7eed\u5411\u524d\u63a8\u8fdb\u3002',
      failed: '\u56e2\u5b50\u6ed1\u51fa\u4e86\u7eb8\u9762\u3002',
      ability: '\u5f53\u524d\u80fd\u529b\uff1a{ability}',
      drag: '\u79fb\u52a8\u5e76\u8df3\u8dc3\u5230\u5c0f\u95e8\u3002',
      jump: '\u8df3\u8dc3',
      microcopy: 'A/D \u6216\u65b9\u5411\u952e\u79fb\u52a8\uff0cSpace \u8df3\u8dc3\u3002'
    },
    world: {
      title: '\u5728\u7eb8\u9762\u4e0a\u5411\u524d\u79fb\u52a8\uff0c\u6536\u96c6\u5168\u90e8\u661f\u661f\uff0c\u518d\u627e\u5230\u5c0f\u95e8\u3002',
      levelSelect: '\u66f4\u957f\u7684\u5173\u5361\uff0c\u66f4\u5e73\u6ed1\u7684\u8def\u7ebf\uff0c\u66f4\u5feb\u7684\u901a\u5173\u8282\u594f\u3002',
      skinPicker: '\u6536\u96c6\u66f4\u591a\u661f\u661f\uff0c\u89e3\u9501\u66f4\u591a\u4e3b\u9898\u56e2\u5b50\u3002'
    },
    effects: {
      pickedAbility: '\u83b7\u5f97 {ability}',
      star: '\u661f\u661f +1',
      fellOff: '\u6389\u4e0b\u53bb\u4e86'
    },
    medalNames: {
      gold: '\u91d1\u724c',
      silver: '\u94f6\u724c',
      bronze: '\u94dc\u724c'
    },
    abilityNames: {
      sticky: '\u9ecf\u6027',
      heavy: '\u91cd\u529b',
      elastic: '\u5f39\u6027'
    },
    skins: {
      peach: { label: '\u6843\u5b50', theme: '\u8f6f\u7cd6\u679c\u9171' },
      mint: { label: '\u8584\u8377', theme: '\u51c9\u98ce' },
      sky: { label: '\u5929\u7a7a', theme: '\u4e91\u7aef\u8df3\u8dc3' },
      lemon: { label: '\u67e0\u6aac', theme: '\u6674\u5929\u6ce1\u6ce1' },
      cherry: { label: '\u6a31\u6843', theme: '\u7cd6\u679c\u51b2\u51fb' },
      ink: { label: '\u58a8\u8272', theme: '\u591c\u8272\u901f\u5199' }
    }
  }
};

function getPathValue(source, path) {
  return path.split('.').reduce((value, segment) => value?.[segment], source);
}

function fillTemplate(template, variables) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(variables?.[key] ?? ''));
}

export function normalizeLanguage(language) {
  return language === 'zh' ? 'zh' : DEFAULT_LANGUAGE;
}

export function t(language, key, variables = {}) {
  const activeLanguage = normalizeLanguage(language);
  const template =
    getPathValue(TEXT[activeLanguage], key) ??
    getPathValue(TEXT[DEFAULT_LANGUAGE], key) ??
    key;

  return fillTemplate(template, variables);
}

export function getLanguageOptions() {
  return LANGUAGES.map((entry) => ({ ...entry }));
}

export function getSkinCopy(language, skinId) {
  const activeLanguage = normalizeLanguage(language);

  return (
    TEXT[activeLanguage].skins?.[skinId] ??
    TEXT[DEFAULT_LANGUAGE].skins?.[skinId] ?? {
      label: skinId,
      theme: skinId
    }
  );
}

export function getAbilityLabel(language, ability) {
  return t(language, `abilityNames.${ability}`);
}

export function getMedalLabel(language, medal) {
  return t(language, `medalNames.${medal}`);
}
