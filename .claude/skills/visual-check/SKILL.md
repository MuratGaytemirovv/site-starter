---
name: visual-check
description: Visually verify the site build before committing — screenshots of given pages at 1440/1024/375/320 with scroll-reveal and lazy images handled, plus overflow, too-wide elements, broken images and JS errors. Use before any commit that touches layout, styling or data that changes text length.
---

Ported from A&T (`atprojects/.claude/skills/visual-check`), adapted: reveal is `[data-reveal]`,
several pages per run, a list of elements wider than the viewport (catches what `overflow-hidden`
hides — the A&T version missed it), JS errors.

## Order (from the project root)

1. `npm run build` — static files go to `dist/client/` (`@astrojs/vercel` adapter, so
   **`astro preview` does not work**).
2. Server in the background: `node .claude/skills/visual-check/serve.mjs` → `http://localhost:4324`.
   It serves `dist/client` and injects a style that shows `[data-reveal]` content; the build is not patched.
   Ports 4321 (another project) and 4322 (Bilto) — don't touch.
3. Shoot: `python .claude/skills/visual-check/shoot.py <out dir> home dienst-1 no-such-page`
   (pages without the leading slash — Git Bash rewrites `/x` into a Windows path)
   (Playwright + Chromium installed). Per page × width: scrolls in steps (lazy images,
   IntersectionObserver), waits for images while still at the bottom, back to top + 500 ms
   (sticky header), full-page screenshot and one report line.
4. Look at parts, not only the full frame: a 1440 px frame 5000 px high is unreadable when scaled
   down. `node .claude/skills/visual-check/split.mjs <out dir> home-1440 home-375` cuts frames into
   `<name>-p0.png`, `-p1.png`… (desktop scaled to 66%).
5. Stop the server (PowerShell): `Get-NetTCPConnection -LocalPort 4324 -State Listen` → `Stop-Process`.

## Remember

- Not a phone: width emulation ≠ real device (Bilto: the client found 3 bugs on a phone). Before
  handing over — check on a real phone.
- Screenshots go to the scratchpad, not into the repo.
