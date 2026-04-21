export function createInitialAppState() {
  return {
    screen: 'title',
    selectedLevel: 0,
    soundEnabled: true,
    skinId: 'peach',
    lastResult: null
  };
}

export function reduceAppState(state, action) {
  switch (action.type) {
    case 'OPEN_LEVEL_SELECT':
      return { ...state, screen: 'level-select' };
    case 'OPEN_SKIN_PICKER':
      return { ...state, screen: 'skin-picker' };
    case 'START_LEVEL':
      return { ...state, screen: 'playing', selectedLevel: action.levelIndex };
    case 'LEVEL_FINISHED':
      return { ...state, screen: 'results', lastResult: action.result };
    case 'BACK_TO_TITLE':
      return { ...state, screen: 'title' };
    case 'SELECT_SKIN':
      return { ...state, skinId: action.skinId };
    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };
    default:
      return state;
  }
}
