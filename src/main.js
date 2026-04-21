import './style.css';
import { createInitialAppState, reduceAppState } from './app/store.js';
import {
  DEFAULT_LANGUAGE,
  getAbilityLabel,
  getLanguageOptions,
  getMedalLabel,
  getSkinCopy,
  normalizeLanguage,
  t
} from './i18n.js';
import { createAudioManager } from './game/audio.js';
import { createFloatingText, createImpactBurst, stepEffects } from './game/effects.js';
import { createGameSession, resetGameSession, stepGameSession } from './game/game.js';
import {
  createInputState,
  markJumpConsumed,
  setJumpPressed,
  setKeyboardDirection
} from './game/input.js';
import { LEVELS, SKINS } from './game/level-data.js';
import { renderFrame } from './game/render/canvas-renderer.js';
import { createCameraState, updateCamera } from './game/render/camera.js';
import { bindTouchControls } from './game/touch-controls.js';
import {
  getUnlockedSkinIds,
  loadProfile,
  mergeLevelResult,
  saveProfile
} from './storage.js';
import {
  renderHud,
  renderLevelSelectScreen,
  renderResultsScreen,
  renderSkinPicker,
  renderTitleScreen
} from './ui/screens.js';

const app = document.querySelector('#app');
const profile = loadProfile();
let appState = {
  ...createInitialAppState(),
  skinId: profile.selectedSkin,
  soundEnabled: profile.soundEnabled,
  language: normalizeLanguage(profile.language)
};
let saveProfileState = { ...profile, language: appState.language };
let inputState = createInputState();
let effects = [];
let paused = false;
let hudMenuOpen = false;
let overlayMessage = null;
let session = createGameSession({
  levelIndex: 0,
  skinId: appState.skinId
});
let camera = createCameraState();

const audio = createAudioManager();
audio.setEnabled(appState.soundEnabled);

app.innerHTML = `
  <main class="game-root">
    <canvas class="game-canvas" width="960" height="540"></canvas>
    <div class="ui-root" aria-live="polite"></div>
  </main>
`;

const canvas = app.querySelector('.game-canvas');
const uiRoot = app.querySelector('.ui-root');
const ctx = canvas.getContext('2d');
canvas.style.touchAction = 'none';

function currentLanguage() {
  return normalizeLanguage(appState.language);
}

function copy(key, variables = {}) {
  return t(currentLanguage(), key, variables);
}

function applyDocumentMeta() {
  document.documentElement.lang = currentLanguage() === 'zh' ? 'zh-CN' : 'en';
  document.title = copy('metaTitle');
  canvas.setAttribute('aria-label', copy('canvasLabel'));
}

function getOrientationHint() {
  return copy('common.landscapeRecommended');
}

function getUnlockedMaxIndex() {
  return Math.min(saveProfileState.unlockedLevelIndex, LEVELS.length - 1);
}

function getSkinPresentation(skinId) {
  return getSkinCopy(currentLanguage(), skinId);
}

function getUnlockedSkins() {
  const unlocked = new Set(getUnlockedSkinIds(saveProfileState, SKINS));

  return SKINS.filter((skin) => unlocked.has(skin.id)).map((skin) => ({
    id: skin.id,
    ...getSkinPresentation(skin.id)
  }));
}

function getAbilityText(ability) {
  return getAbilityLabel(currentLanguage(), ability);
}

function persistProfile(patch = {}) {
  saveProfileState = saveProfile({
    ...saveProfileState,
    selectedSkin: appState.skinId,
    soundEnabled: appState.soundEnabled,
    language: currentLanguage(),
    ...patch
  });
}

function showOverlayMessage(text, tone = 'info', ttlMs = 1600) {
  overlayMessage = { text, tone, ttlMs };
}

function clearOverlayMessage() {
  overlayMessage = null;
}

function dispatch(action) {
  appState = reduceAppState(appState, action);
  applyDocumentMeta();
  renderUi();
}

function createFreshSession(levelIndex = appState.selectedLevel) {
  session = createGameSession({
    levelIndex,
    skinId: appState.skinId
  });
  camera = createCameraState();
  paused = false;
  hudMenuOpen = false;
  clearOverlayMessage();
  inputState = createInputState();
  effects = [];
}

function startLevel(levelIndex) {
  createFreshSession(levelIndex);
  dispatch({
    type: 'START_LEVEL',
    levelIndex
  });
}

function retryLevel() {
  session = resetGameSession(session, {
    levelIndex: appState.selectedLevel,
    skinId: appState.skinId
  });
  camera = createCameraState();
  paused = false;
  hudMenuOpen = false;
  clearOverlayMessage();
  inputState = createInputState();
  effects = [];
  appState = {
    ...appState,
    screen: 'playing',
    lastResult: null
  };
  renderUi();
}

function finishLevel() {
  if (!session?.result) {
    return;
  }

  saveProfileState = mergeLevelResult(
    saveProfileState,
    session.levelIndex,
    session.result
  );
  persistProfile();
  audio.playWin();

  dispatch({
    type: 'LEVEL_FINISHED',
    result: session.result
  });
}

function updateSkin(nextSkinId) {
  const unlockedIds = new Set(getUnlockedSkinIds(saveProfileState, SKINS));

  if (!unlockedIds.has(nextSkinId)) {
    return;
  }

  appState = reduceAppState(appState, {
    type: 'SELECT_SKIN',
    skinId: nextSkinId
  });
  persistProfile();
  session.blob.skinId = nextSkinId;
  renderUi();
}

function setLanguage(nextLanguage) {
  const language = normalizeLanguage(nextLanguage);

  appState = reduceAppState(appState, {
    type: 'SET_LANGUAGE',
    language
  });
  persistProfile({ language });
  applyDocumentMeta();
  renderUi();
}

function toggleSound() {
  appState = reduceAppState(appState, {
    type: 'TOGGLE_SOUND'
  });
  audio.setEnabled(appState.soundEnabled);
  persistProfile();
  renderUi();
}

function renderUi() {
  const languageOptions = getLanguageOptions();
  const orientationHint = getOrientationHint();
  const isTouchUi =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  if (appState.screen === 'title') {
    const skin = getSkinPresentation(appState.skinId);

    renderTitleScreen(uiRoot, {
      language: currentLanguage(),
      languages: languageOptions,
      languageLabel: copy('common.language'),
      orientationHint,
      eyebrow: copy('title.eyebrow'),
      title: copy('title.heading'),
      subtitle: copy('title.subtitle'),
      primaryActionLabel: copy('title.start'),
      levelSelectLabel: copy('title.levelSelect'),
      skinPickerLabel: copy('title.skins'),
      soundToggleLabel: appState.soundEnabled ? copy('title.soundOn') : copy('title.soundOff'),
      soundEnabled: appState.soundEnabled,
      skinLabel: skin.label,
      skinChipLabel: copy('title.skinChip', { skin: skin.label }),
      soundChipLabel: appState.soundEnabled ? copy('title.soundChipOn') : copy('title.soundChipOff'),
      helpText: copy('title.help')
    });
    return;
  }

  if (appState.screen === 'level-select') {
    renderLevelSelectScreen(uiRoot, {
      language: currentLanguage(),
      languages: languageOptions,
      languageLabel: copy('common.language'),
      orientationHint,
      title: copy('levelSelect.title'),
      bestLabel: copy('levelSelect.best'),
      backLabel: copy('common.backToTitle'),
      selectedLevel: appState.selectedLevel,
      levels: LEVELS.map((level, index) => ({
        label: level.id,
        name: level.name,
        bestTimeMs: saveProfileState.levels[index]?.bestTimeMs,
        locked: index > getUnlockedMaxIndex()
      }))
    });
    return;
  }

  if (appState.screen === 'skin-picker') {
    renderSkinPicker(uiRoot, {
      language: currentLanguage(),
      languages: languageOptions,
      languageLabel: copy('common.language'),
      orientationHint,
      title: copy('skinPicker.title'),
      backLabel: copy('common.backToTitle'),
      skinId: appState.skinId,
      skins: getUnlockedSkins()
    });
    return;
  }

  if (appState.screen === 'results') {
    const result = appState.lastResult ?? {};
    const medalLabel = getMedalLabel(currentLanguage(), result.medal ?? 'bronze');

    renderResultsScreen(uiRoot, {
      language: currentLanguage(),
      languages: languageOptions,
      languageLabel: copy('common.language'),
      orientationHint,
      eyebrow: copy('results.eyebrow'),
      title: copy('results.title'),
      medalText: `${copy('common.medal')}: ${medalLabel}`,
      timeStatLabel: copy('common.time'),
      jumpsStatLabel: copy('common.jumps'),
      starsStatLabel: copy('common.stars'),
      result,
      retryLabel: copy('common.retry'),
      nextLabel: copy('common.nextLevel'),
      titleLabel: copy('common.backToTitle'),
      showNext: appState.selectedLevel < getUnlockedMaxIndex(),
      summary: copy('results.summary')
    });
    return;
  }

  renderHud(uiRoot, {
    orientationHint,
    levelText: copy('hud.level', { level: session.level.id }),
    starsText: copy('hud.starsProgress', {
      count: session.runtime.collectedStarIds.length,
      total: session.level.starsTotal
    }),
    timeMs: session.elapsedMs,
    paused,
    pauseLabel: copy('hud.pause'),
    resumeLabel: copy('hud.resume'),
    retryLabel: copy('common.retry'),
    backLabel: copy('hud.back'),
    soundToggleLabel: appState.soundEnabled ? copy('hud.soundOn') : copy('hud.soundOff'),
    settingsLabel: copy('hud.settings'),
    hudMenuOpen,
    overlayMessage: overlayMessage?.text ?? null,
    overlayTone: overlayMessage?.tone ?? 'info',
    showTouchControls: isTouchUi,
    jumpLabel: copy('hud.jump'),
    joystickOffsetX: inputState.joystick.knob.x,
    joystickOffsetY: inputState.joystick.knob.y
  });
}

function renderWorld() {
  renderFrame(ctx, {
    width: canvas.width,
    height: canvas.height,
    level: session.level,
    runtime: session.runtime,
    blob: {
      ...session.blob,
      skinId: appState.skinId,
      status: session.status === 'failed' ? 'hurt' : session.status
    },
    effects,
    hint:
      appState.screen === 'title'
        ? copy('world.title')
        : appState.screen === 'level-select'
          ? copy('world.levelSelect')
          : appState.screen === 'skin-picker'
            ? copy('world.skinPicker')
            : null,
    status: session.status,
    camera
  });
}

uiRoot.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action]');

  if (!trigger) {
    return;
  }

  const action = trigger.dataset.action;

  switch (action) {
    case 'start-game':
      startLevel(appState.selectedLevel);
      break;
    case 'open-level-select':
      dispatch({ type: 'OPEN_LEVEL_SELECT' });
      break;
    case 'open-skin-picker':
      dispatch({ type: 'OPEN_SKIN_PICKER' });
      break;
    case 'toggle-sound':
      toggleSound();
      break;
    case 'toggle-settings':
      hudMenuOpen = !hudMenuOpen;
      renderUi();
      break;
    case 'set-language':
      setLanguage(trigger.dataset.language ?? DEFAULT_LANGUAGE);
      break;
    case 'start-level':
      startLevel(Number(trigger.dataset.levelIndex ?? 0));
      break;
    case 'select-skin':
      updateSkin(trigger.dataset.skinId);
      break;
    case 'back-to-title':
      dispatch({ type: 'BACK_TO_TITLE' });
      break;
    case 'retry':
      retryLevel();
      break;
    case 'pause':
      paused = true;
      renderUi();
      break;
    case 'resume':
      paused = false;
      renderUi();
      break;
    case 'next-level':
      startLevel(Math.min(appState.selectedLevel + 1, LEVELS.length - 1));
      break;
    default:
      break;
  }
});

bindTouchControls({
  uiRoot,
  getScreen: () => appState.screen,
  isPaused: () => paused,
  getInputState: () => inputState,
  setInputState: (next) => {
    inputState = next;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'a' || event.key === 'ArrowLeft') {
    inputState = setKeyboardDirection(inputState, 'left', true);
  }

  if (event.key === 'd' || event.key === 'ArrowRight') {
    inputState = setKeyboardDirection(inputState, 'right', true);
  }

  if (event.key === ' ' || event.key === 'Spacebar') {
    inputState = setJumpPressed(inputState, true);
    event.preventDefault();
  }

  if (event.key.toLowerCase() === 'r' && appState.screen === 'playing') {
    retryLevel();
  }

  if (event.key === 'Escape' && appState.screen === 'playing') {
    paused = !paused;
    renderUi();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'ArrowLeft') {
    inputState = setKeyboardDirection(inputState, 'left', false);
  }

  if (event.key === 'd' || event.key === 'ArrowRight') {
    inputState = setKeyboardDirection(inputState, 'right', false);
  }

  if (event.key === ' ' || event.key === 'Spacebar') {
    inputState = setJumpPressed(inputState, false);
    event.preventDefault();
  }
});

function handleSessionEvents(previousSession) {
  const frameEvents = session.lastFrameEvents;

  if (frameEvents.jumped ?? frameEvents.launched) {
    audio.playBoing();
    effects.push(createImpactBurst(session.blob.position.x, session.blob.position.y, 0.8));
  }

  if (frameEvents.pickedAbility) {
    audio.playPickup();
    effects.push(
      createFloatingText(
        copy('effects.pickedAbility', {
          ability: getAbilityText(frameEvents.pickedAbility)
        }),
        session.blob.position.x,
        session.blob.position.y - 20,
        'good'
      )
    );
  }

  if (frameEvents.collectedStars.length > 0) {
    frameEvents.collectedStars.forEach((starId, index) => {
      audio.playPickup();
      effects.push(
        createFloatingText(
          copy('effects.star'),
          session.blob.position.x,
          session.blob.position.y - 18 - index * 12,
          'good'
        )
      );
    });
  }

  if (
    frameEvents.blockedDoor &&
    previousSession.lastFrameEvents?.blockedDoor !== true
  ) {
    showOverlayMessage(
      copy('hud.starsMissing', { count: frameEvents.remainingStars }),
      'warn',
      1400
    );
    renderUi();
  }

  if (
    session.status === 'won' &&
    previousSession.status === 'playing'
  ) {
    finishLevel();
  }

  if (
    session.status === 'failed' &&
    previousSession.status === 'playing'
  ) {
    audio.playFail();
    effects.push(
      createFloatingText(
        copy('effects.fellOff'),
        session.blob.position.x,
        session.blob.position.y - 24,
        'bad'
      )
    );
    showOverlayMessage(copy('hud.failedCenter'), 'bad', 1600);
    renderUi();
  }
}

let lastFrameTime = performance.now();

function frame(now) {
  const dt = Math.min(1 / 30, (now - lastFrameTime) / 1000 || 1 / 60);
  lastFrameTime = now;
  effects = stepEffects(effects, dt);

  if (overlayMessage) {
    overlayMessage = {
      ...overlayMessage,
      ttlMs: overlayMessage.ttlMs - dt * 1000
    };

    if (overlayMessage.ttlMs <= 0) {
      clearOverlayMessage();
    }
  }

  if (appState.screen === 'playing') {
    camera = updateCamera(
      camera,
      session.blob,
      session.level,
      { width: canvas.width, height: canvas.height },
      dt
    );
  } else {
    camera = createCameraState();
  }

  if (appState.screen === 'playing' && !paused) {
    const previousSession = session;
    session = stepGameSession(session, {
      dt,
      input: inputState
    });
    handleSessionEvents(previousSession);
    renderUi();
    inputState = markJumpConsumed(inputState);
  }

  renderWorld();
  window.requestAnimationFrame(frame);
}

applyDocumentMeta();
renderUi();
renderWorld();
window.requestAnimationFrame(frame);
