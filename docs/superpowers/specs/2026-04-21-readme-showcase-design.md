# README Showcase Design

## Goal

Create a polished `README.md` for the GitHub repository homepage that presents the project as a finished game project, while still covering the practical commands needed to run, test, build, and deploy it.

## Audience

- First-time GitHub visitors who want to understand the project quickly
- Developers who want to run the project locally
- Reviewers who want to see the game’s scope, features, and deployment model

## Positioning

The README should function as a showcase page first and a usage document second.

It should communicate:
- what the project is
- why it is interesting
- how to run it
- how it is deployed

It should not read like an internal engineering memo.

## Recommended Format

### 1. Hero section

- Project title: `Jelly Into Door`
- Short Chinese subtitle
- One-line summary describing it as a doodle-style casual physics puzzle game built with Canvas and Vite

### 2. Project introduction

- One compact paragraph in Chinese
- Describe the jelly/blob character, drag-to-launch interaction, and “reach the door” objective
- Emphasize the playful paper-and-doodle presentation

### 3. Highlights

Use a concise bullet list focused on present-tense shipped features:
- doodle visual style
- drag-and-release launch mechanic
- level progression and scoring
- skins and local save data
- desktop and touch support
- mobile layout compatibility

### 4. Controls

Split controls by platform:
- desktop
- mobile / touch

Keep the language direct and short.

### 5. Tech stack

List the actual stack only:
- Vite
- Vanilla JavaScript
- HTML5 Canvas
- Vitest
- localStorage
- Nginx static hosting

### 6. Local development

Include exact commands:
- `npm install`
- `npm run dev`
- `npm test -- --run`
- `npm run build`

### 7. Deployment

State clearly that this is a static site:
- production output is `dist/`
- deploy by serving `dist/` with Nginx
- no Node.js runtime is required in production after build

### 8. Project structure

Briefly explain:
- `src/`
- `tests/`
- `docs/`

Do not turn this into a deep file-by-file reference.

### 9. Roadmap / next ideas

End with a short list of plausible future directions without presenting them as already implemented.

## Writing Style

- Chinese-first
- clean and readable Markdown
- attractive but restrained
- no excessive badges
- no invented demo links
- no exaggerated marketing language

## Constraints

- Only document features that already exist
- Keep the README homepage-friendly rather than documentation-heavy
- Avoid long technical digressions
- Keep deployment guidance consistent with the current Nginx static hosting approach
