function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function formatTimeMs(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const totalSeconds = Math.max(0, Math.round(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function cardButton(label, action, extra = '') {
  return `<button type="button" class="screen-button" data-action="${escapeHtml(action)}"${extra}>${escapeHtml(label)}</button>`;
}

function listItem(label, value) {
  return `<li class="screen-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`;
}

function renderLanguageToggle(model = {}) {
  const languages = model.languages || [];

  if (languages.length === 0) {
    return '';
  }

  return `
    <div class="menu-toolbar">
      <span class="menu-toolbar__label">${escapeHtml(model.languageLabel || 'Language')}</span>
      <div class="language-toggle" role="group" aria-label="${escapeHtml(model.languageLabel || 'Language')}">
        ${languages
          .map((language) => {
            const selected = language.id === model.language;
            return `
              <button
                type="button"
                class="language-toggle__button${selected ? ' is-selected' : ''}"
                data-action="set-language"
                data-language="${escapeHtml(language.id)}"
                aria-pressed="${selected ? 'true' : 'false'}"
              >
                ${escapeHtml(language.label)}
              </button>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function renderOrientationBanner(model = {}) {
  if (!model.orientationHint) {
    return '';
  }

  return `<p class="orientation-banner">${escapeHtml(model.orientationHint)}</p>`;
}

function renderEmptyState(root, screenName, body) {
  root.dataset.screen = screenName;
  root.innerHTML = body;
}

export function renderTitleScreen(root, model = {}) {
  const title = model.title || 'Doodle Blob';
  const subtitle = model.subtitle || 'Escape to the Door';
  const skin = model.skinLabel || model.skinName || model.skinId || 'Peach';
  const soundLabel = model.soundChipLabel || (model.soundEnabled === false ? 'Sound off' : 'Sound on');

  renderEmptyState(
    root,
    'title',
    `
      <section class="screen screen-title">
        ${renderLanguageToggle(model)}
        ${renderOrientationBanner(model)}
        <p class="screen-eyebrow">${escapeHtml(model.eyebrow || 'Paper platformer')}</p>
        <h1 class="screen-title__heading">${escapeHtml(title)}</h1>
        <p class="screen-title__subtitle">${escapeHtml(subtitle)}</p>
        <div class="screen-chip-row">
          <span class="screen-chip">${escapeHtml(model.skinChipLabel || `Skin: ${skin}`)}</span>
          <span class="screen-chip">${escapeHtml(soundLabel)}</span>
        </div>
        <div class="screen-actions">
          ${cardButton(model.primaryActionLabel || 'Start', 'start-game')}
          ${cardButton(model.levelSelectLabel || 'Level select', 'open-level-select', ' data-secondary="true"')}
          ${cardButton(model.skinPickerLabel || 'Skins', 'open-skin-picker', ' data-secondary="true"')}
          ${cardButton(model.soundToggleLabel || 'Toggle sound', 'toggle-sound', ' data-secondary="true"')}
        </div>
        <p class="screen-help">${escapeHtml(model.helpText || 'Jump, bounce, and reach the door.')}</p>
      </section>
    `
  );
}

export function renderLevelSelectScreen(root, model = {}) {
  const levels = model.levels || [];
  const bestLabel = model.bestLabel || 'Best';

  renderEmptyState(
    root,
    'level-select',
    `
      <section class="screen screen-level-select">
        ${renderLanguageToggle(model)}
        ${renderOrientationBanner(model)}
        <h2 class="screen-section-title">${escapeHtml(model.title || 'Choose a level')}</h2>
        <div class="screen-grid">
          ${levels
            .map((level, index) => {
              const locked = level.locked ?? level.unlocked === false;
              const label = level.label || level.name || `Level ${index + 1}`;
              const best = Number.isFinite(level.bestTimeMs) ? formatTimeMs(level.bestTimeMs) : '';
              const chosen = model.selectedLevel === index;

              return `
                <button
                  type="button"
                  class="level-card${chosen ? ' is-selected' : ''}"
                  data-action="start-level"
                  data-level-index="${index}"
                  ${locked ? 'disabled aria-disabled="true"' : ''}
                >
                  <span class="level-card__label">${escapeHtml(label)}</span>
                  ${best ? `<span class="level-card__meta">${escapeHtml(bestLabel)} ${escapeHtml(best)}</span>` : ''}
                </button>
              `;
            })
            .join('')}
        </div>
        <div class="screen-actions">
          ${cardButton(model.backLabel || 'Back to title', 'back-to-title', ' data-secondary="true"')}
        </div>
      </section>
    `
  );
}

export function renderSkinPicker(root, model = {}) {
  const skins = model.skins || [
    { id: 'peach', label: 'Peach' },
    { id: 'mint', label: 'Mint' },
    { id: 'blueberry', label: 'Blueberry' }
  ];

  renderEmptyState(
    root,
    'skin-picker',
    `
      <section class="screen screen-skin-picker">
        ${renderLanguageToggle(model)}
        ${renderOrientationBanner(model)}
        <h2 class="screen-section-title">${escapeHtml(model.title || 'Pick a skin')}</h2>
        <div class="screen-grid screen-grid--skins">
          ${skins
            .map((skin) => {
              const selected = skin.id === model.skinId;
              return `
                <button
                  type="button"
                  class="skin-card${selected ? ' is-selected' : ''}"
                  data-action="select-skin"
                  data-skin-id="${escapeHtml(skin.id)}"
                  aria-pressed="${selected ? 'true' : 'false'}"
                >
                  <span class="skin-card__swatch" aria-hidden="true"></span>
                  <span class="skin-card__label">${escapeHtml(skin.label || skin.name || skin.id)}</span>
                  ${skin.theme ? `<span class="skin-card__theme">${escapeHtml(skin.theme)}</span>` : ''}
                </button>
              `;
            })
            .join('')}
        </div>
        <div class="screen-actions">
          ${cardButton(model.backLabel || 'Back to title', 'back-to-title', ' data-secondary="true"')}
        </div>
      </section>
    `
  );
}

export function renderHud(root, model = {}) {
  const timeLabel = model.timeLabel || formatTimeMs(model.timeMs);
  const pauseLabel = model.paused ? model.resumeLabel || 'Resume' : model.pauseLabel || 'Pause';
  const backLabel = model.backLabel || 'Back to title';

  renderEmptyState(
    root,
    'hud',
    `
      <section class="hud-shell">
        ${renderOrientationBanner(model)}
        <div class="hud-status-bar">
          ${model.levelText ? `<span class="hud-chip">${escapeHtml(model.levelText)}</span>` : ''}
          ${model.starsText ? `<span class="hud-chip">${escapeHtml(model.starsText)}</span>` : ''}
          ${timeLabel ? `<span class="hud-chip">${escapeHtml(timeLabel)}</span>` : ''}
        </div>
        <div class="hud-settings-anchor">
          <button
            type="button"
            class="hud-settings-toggle"
            data-action="toggle-settings"
            aria-expanded="${model.hudMenuOpen ? 'true' : 'false'}"
          >
            ${escapeHtml(model.settingsLabel || 'Settings')}
          </button>
          ${
            model.hudMenuOpen
              ? `
                <div class="hud-settings-menu">
                  ${cardButton(pauseLabel, model.paused ? 'resume' : 'pause', ' data-secondary="true"')}
                  ${cardButton(model.retryLabel || 'Retry', 'retry', ' data-secondary="true"')}
                  ${cardButton(backLabel, 'back-to-title', ' data-secondary="true"')}
                  ${cardButton(model.soundToggleLabel || 'Sound', 'toggle-sound', ' data-secondary="true"')}
                </div>
              `
              : ''
          }
        </div>
        ${
          model.overlayMessage
            ? `<p class="hud-center-message hud-center-message--${escapeHtml(model.overlayTone || 'info')}">${escapeHtml(model.overlayMessage)}</p>`
            : ''
        }
      </section>
    `
  );
}

export function renderResultsScreen(root, model = {}) {
  const result = model.result || model;
  const medal = result.medal || 'bronze';
  const timeLabel = result.timeLabel || formatTimeMs(result.timeMs);
  const summary = result.summary || model.summary || 'The door opened and the blob made it through.';

  renderEmptyState(
    root,
    'results',
    `
      <section class="screen screen-results">
        ${renderLanguageToggle(model)}
        ${renderOrientationBanner(model)}
        <p class="screen-eyebrow">${escapeHtml(model.eyebrow || 'Run complete')}</p>
        <h2 class="screen-section-title">${escapeHtml(model.title || 'Results')}</h2>
        <p class="results-medal">${escapeHtml(model.medalText || `Medal: ${medal}`)}</p>
        <ul class="screen-stats">
          ${listItem(model.timeStatLabel || 'Time', timeLabel || '--')}
          ${listItem(model.launchesStatLabel || 'Launches', Number.isFinite(result.launches) ? String(result.launches) : '--')}
          ${listItem(model.starsStatLabel || 'Stars', Number.isFinite(result.starsCollected) ? String(result.starsCollected) : '--')}
        </ul>
        <p class="screen-help">${escapeHtml(summary)}</p>
        <div class="screen-actions">
          ${cardButton(model.retryLabel || 'Retry', 'retry')}
          ${model.showNext ? cardButton(model.nextLabel || 'Next level', 'next-level', ' data-secondary="true"') : ''}
          ${cardButton(model.titleLabel || 'Back to title', 'back-to-title', ' data-secondary="true"')}
        </div>
      </section>
    `
  );
}
