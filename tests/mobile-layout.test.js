import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8');

describe('mobile layout stylesheet', () => {
  it('uses dynamic viewport sizing and safe-area padding for phone layouts', () => {
    expect(stylesheet).toContain('min-height: 100dvh');
    expect(stylesheet).toContain('env(safe-area-inset-bottom, 0px)');
    expect(stylesheet).toContain('env(safe-area-inset-left, 0px)');
  });

  it('adds a dedicated narrow-screen breakpoint for tighter mobile spacing', () => {
    expect(stylesheet).toContain('@media (max-width: 560px)');
    expect(stylesheet).toContain('max-height: calc(100dvh - 32px)');
  });

  it('docks the hud to the bottom and tightens its content on small phones', () => {
    expect(stylesheet).toContain('justify-self: stretch;');
    expect(stylesheet).toContain('align-self: end;');
    expect(stylesheet).toContain('display: none;');
  });

  it('includes landscape-first hooks while keeping portrait playable', () => {
    expect(stylesheet).toContain('@media (orientation: landscape)');
    expect(stylesheet).toContain('.orientation-banner');
  });

  it('centers a thin landscape status bar and separates the settings menu anchor', () => {
    expect(stylesheet).toContain('.hud-shell');
    expect(stylesheet).toContain('.hud-status-bar');
    expect(stylesheet).toContain('.hud-settings-anchor');
    expect(stylesheet).toContain('justify-self: center;');
  });

  it('lets playfield touches pass through the hud shell while keeping settings clickable', () => {
    expect(stylesheet).toMatch(/\.hud-shell\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.hud-settings-anchor\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-settings-toggle\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-settings-menu\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-settings-menu \.screen-button\s*\{[^}]*pointer-events:\s*auto;/s);
  });
});
