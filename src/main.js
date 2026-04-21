import './style.css';
import { createInitialAppState, reduceAppState } from './app/store.js';
import { createAudioManager } from './game/audio.js';
import { createFloatingText, createImpactBurst, stepEffects } from './game/effects.js';
import { createGameSession, resetGameSession, stepGameSession } from './game/game.js';
import {
  beginPointerCharge,
  createInputState,
  releasePointerCharge,
  updateDragIntent
} from './game/input.js';
import { LEVELS, SKINS } from './game/level-data.js';
import { renderFrame } from './game/render/canvas-renderer.js';
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
  soundEnabled: profile.soundEnabled
};
let saveProfileState = { ...profile };
let inputState = createInputState();
let effects = [];
let paused = false;
let session = createGameSession({
  levelIndex: 0,
  skinId: appState.skinId
});

const audio = createAudioManager();
audio.setEnabled(appState.soundEnabled);

app.innerHTML = `
  <main class="game-root">
    <canvas class="game-canvas" width="960" height="540" aria-label="涂鸦团子游戏画布"></canvas>
    <div class="ui-root" aria-live="polite"></div>
  </main>
`;

const canvas = app.querySelector('.game-canvas');
const uiRoot = app.querySelector('.ui-root');
const ctx = canvas.getContext('2d');
canvas.style.touchAction = 'none';

function getUnlockedMaxIndex() {
  return Math.min(saveProfileState.unlockedLevelIndex, LEVELS.length - 1);
}

function getSkinLabel(skinId) {
  return SKINS.find((skin) => skin.id === skinId)?.label ?? '桃桃团';
}

function persistProfile(patch = {}) {
  saveProfileState = saveProfile({
    ...saveProfileState,
    selectedSkin: appState.skinId,
    soundEnabled: appState.soundEnabled,
    ...patch
  });
}

function dispatch(action) {
  appState = reduceAppState(appState, action);
  renderUi();
}

function createFreshSession(levelIndex = appState.selectedLevel) {
  session = createGameSession({
    levelIndex,
    skinId: appState.skinId
  });
  paused = false;
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
  paused = false;
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
  appState = reduceAppState(appState, {
    type: 'SELECT_SKIN',
    skinId: nextSkinId
  });
  persistProfile();
  session.blob.skinId = nextSkinId;
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

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    id: event.pointerId,
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function renderUi() {
  if (appState.screen === 'title') {
    renderTitleScreen(uiRoot, {
      title: '涂鸦团子',
      subtitle: '冲进门里！',
      primaryActionLabel: '开始冒险',
      levelSelectLabel: '选关',
      skinPickerLabel: '换团子',
      soundToggleLabel: appState.soundEnabled ? '声音：开' : '声音：关',
      soundEnabled: appState.soundEnabled,
      skinLabel: getSkinLabel(appState.skinId),
      helpText: '按住团子拖拽，松手发射，钻进快乐小门。'
    });
    return;
  }

  if (appState.screen === 'level-select') {
    renderLevelSelectScreen(uiRoot, {
      title: '选关',
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
    const unlocked = new Set(getUnlockedSkinIds(saveProfileState, SKINS));
    renderSkinPicker(uiRoot, {
      title: '团子配色',
      skinId: appState.skinId,
      skins: SKINS.filter((skin) => unlocked.has(skin.id)).map((skin) => ({
        id: skin.id,
        label: skin.label
      }))
    });
    return;
  }

  if (appState.screen === 'results') {
    renderResultsScreen(uiRoot, {
      title: '过关啦！',
      result: appState.lastResult,
      retryLabel: '再来一遍',
      nextLabel: '下一关',
      titleLabel: '回到标题',
      showNext: appState.selectedLevel < getUnlockedMaxIndex(),
      summary: '更快一点、发射更少一点，或者把星星全都捞走。'
    });
    return;
  }

  renderHud(uiRoot, {
    levelLabel: session.level.id,
    launches: session.launches,
    starsCollected: session.runtime.collectedStarIds.length,
    timeMs: session.elapsedMs,
    paused,
    backLabel: '返回',
    hint: session.status === 'failed'
      ? '糊出纸外了，点重试再来一下。'
      : session.blob.ability
        ? `当前能力：${session.blob.ability}`
        : '按住团子拖拽，松手发射。',
    microcopy: 'Esc 暂停，R 重试。'
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
      status:
        session.status === 'won'
          ? 'goal'
          : inputState.charging
            ? 'charge'
            : session.status === 'failed'
              ? 'hurt'
              : 'idle'
    },
    effects,
    hint:
      appState.screen === 'title'
        ? '从纸面弹起，找到通往小门的路。'
        : appState.screen === 'level-select'
          ? '短关卡，快重试，手感优先。'
          : appState.screen === 'skin-picker'
            ? '星星攒得越多，可选的团子越多。'
            : null,
    status: session.status
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

canvas.addEventListener('pointerdown', (event) => {
  if (appState.screen !== 'playing' || paused) {
    return;
  }

  const point = pointFromEvent(event);
  inputState = beginPointerCharge(inputState, event.pointerId);
  inputState = updateDragIntent(inputState, point, session.blob.position);
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});

canvas.addEventListener('pointermove', (event) => {
  if (appState.screen !== 'playing' || paused || !inputState.charging) {
    return;
  }

  inputState = updateDragIntent(
    inputState,
    pointFromEvent(event),
    session.blob.position
  );
});

function endCharge(event) {
  if (appState.screen !== 'playing' || paused || !inputState.charging) {
    return;
  }

  inputState = updateDragIntent(
    inputState,
    pointFromEvent(event),
    session.blob.position
  );
  inputState = releasePointerCharge(inputState);
  event.preventDefault();
}

canvas.addEventListener('pointerup', endCharge);
canvas.addEventListener('pointercancel', endCharge);
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r' && appState.screen === 'playing') {
    retryLevel();
  }

  if (event.key === 'Escape' && appState.screen === 'playing') {
    paused = !paused;
    renderUi();
  }
});

function handleSessionEvents(previousSession) {
  const frameEvents = session.lastFrameEvents;

  if (frameEvents.launched) {
    audio.playBoing();
    effects.push(createImpactBurst(session.blob.position.x, session.blob.position.y, 0.8));
  }

  if (frameEvents.pickedAbility) {
    audio.playPickup();
    effects.push(
      createFloatingText(
        `拿到 ${frameEvents.pickedAbility}`,
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
          `星星 +1`,
          session.blob.position.x,
          session.blob.position.y - 18 - index * 12,
          'good'
        )
      );
    });
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
    effects.push(
      createFloatingText(
        '糊出去了',
        session.blob.position.x,
        session.blob.position.y - 24,
        'bad'
      )
    );
    renderUi();
  }
}

let lastFrameTime = performance.now();

function frame(now) {
  const dt = Math.min(1 / 30, (now - lastFrameTime) / 1000 || 1 / 60);
  lastFrameTime = now;
  effects = stepEffects(effects, dt);

  if (appState.screen === 'playing' && !paused) {
    const previousSession = session;
    session = stepGameSession(session, {
      dt,
      input: inputState
    });
    handleSessionEvents(previousSession);
    renderUi();

    if (inputState.released) {
      inputState = createInputState();
    }
  }

  renderWorld();
  window.requestAnimationFrame(frame);
}

renderUi();
renderWorld();
window.requestAnimationFrame(frame);
