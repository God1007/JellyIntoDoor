export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' }
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
      launches: 'Launches',
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
      help: 'Drag the blob, then release to bounce into the door.'
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
      launches: 'Launches {count}',
      pause: 'Pause',
      resume: 'Resume',
      paused: 'Paused',
      back: 'Back',
      keepMoving: 'Keep the blob moving.',
      failed: 'The blob slipped off the page.',
      ability: 'Power: {ability}',
      drag: 'Drag the blob, then release to launch.',
      microcopy: 'Esc to pause. R to retry.'
    },
    world: {
      title: 'Bounce off the paper and find the little door.',
      levelSelect: 'Short stages, fast retries, feel first.',
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
    metaTitle: '涂鸦团子：冲进门里！',
    canvasLabel: '涂鸦团子游戏画布',
    common: {
      language: '语言',
      backToTitle: '回到标题',
      retry: '再来一遍',
      nextLevel: '下一关',
      time: '时间',
      launches: '发射',
      stars: '星星',
      medal: '奖牌',
      landscapeRecommended: '推荐横屏体验'
    },
    title: {
      eyebrow: '纸面弹射闯关',
      heading: '涂鸦团子',
      subtitle: '冲进门里！',
      start: '开始冒险',
      levelSelect: '选关',
      skins: '换皮肤',
      soundOn: '声音：开',
      soundOff: '声音：关',
      skinChip: '皮肤：{skin}',
      soundChipOn: '声音：开',
      soundChipOff: '声音：关',
      help: '按住团子拖拽，松手发射，弹进小门。'
    },
    levelSelect: {
      title: '选择关卡',
      best: '最佳'
    },
    skinPicker: {
      title: '选择皮肤'
    },
    results: {
      eyebrow: '过关啦',
      title: '结算',
      summary: '门开了，团子顺利冲了进去。'
    },
    hud: {
      level: '关卡 {level}',
      stars: '星星 {count}',
      launches: '发射 {count}',
      pause: '暂停',
      resume: '继续',
      paused: '已暂停',
      back: '返回',
      keepMoving: '继续把团子送进门里。',
      failed: '团子滑出纸面了。',
      ability: '当前能力：{ability}',
      drag: '按住团子拖拽，松手发射。',
      microcopy: 'Esc 暂停，R 重试。'
    },
    world: {
      title: '从纸面弹起，找到通往小门的路。',
      levelSelect: '短关卡、快重试、手感优先。',
      skinPicker: '收集更多星星，就能解锁更多主题团子。'
    },
    effects: {
      pickedAbility: '拿到 {ability}',
      star: '星星 +1',
      fellOff: '掉出去了'
    },
    medalNames: {
      gold: '金牌',
      silver: '银牌',
      bronze: '铜牌'
    },
    abilityNames: {
      sticky: '黏黏',
      heavy: '沉沉',
      elastic: '弹弹'
    },
    skins: {
      peach: { label: '桃桃团', theme: '软桃果酱' },
      mint: { label: '薄荷团', theme: '凉凉薄荷风' },
      sky: { label: '云朵团', theme: '轻轻跳云层' },
      lemon: { label: '柠檬团', theme: '亮亮太阳味' },
      cherry: { label: '樱桃团', theme: '糖果果酱感' },
      ink: { label: '墨团子', theme: '夜色速写风' }
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
