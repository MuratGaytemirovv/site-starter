"""Full-page screenshots of the locally served build at 4 widths, with scroll-reveal and lazy images handled.

Usage (project root, serve.mjs running):
    python .claude/skills/visual-check/shoot.py OUT_DIR [PAGE ...]   (default: home)
PAGE is a path without the leading slash ("dienst-1", "regio/gent"); "home" = the homepage.
(No leading slash on purpose: Git Bash rewrites "/x" into a Windows path.)
Prints per page and width: screenshot, horizontal overflow, elements wider than the viewport
(also those hidden by overflow:hidden), and visible images that failed to load.
"""
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:4324"
WIDTHS = [1440, 1024, 375, 320]
REVEAL_OFF = ".js-anim [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}"

out_dir = Path(sys.argv[1])
paths = ["/" + ("" if a == "home" else a.strip("/")) for a in (sys.argv[2:] or ["home"])]
out_dir.mkdir(parents=True, exist_ok=True)

# Elements sticking out past the right edge, skipping invisible ones (closed menu, hidden banner).
WIDE = """() => {
  const vw = window.innerWidth, out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.right <= vw + 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || el.closest('[hidden], #mobile-menu, .sr-only')) continue;
    out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].slice(0, 3).join('.')} +${Math.round(r.right - vw)}px`);
  }
  // Text that sticks out (a long URL or compound word) is not an element of its own.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n && out.length < 6; n = walker.nextNode()) {
    if (!n.textContent.trim() || n.parentElement.closest('[hidden], #mobile-menu, .sr-only')) continue;
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.width && r.right > vw + 1) out.push(`text "${n.textContent.trim().slice(0, 40)}" +${Math.round(r.right - vw)}px`);
  }
  return out.slice(0, 6);
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    for path in paths:
        slug = re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-") or "home"
        for width in WIDTHS:
            page = browser.new_page(viewport={"width": width, "height": 900})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(BASE + path, wait_until="networkidle")
            page.add_style_tag(content=REVEAL_OFF)
            page.evaluate(
                """async () => {
                    for (let y = 0; y < document.body.scrollHeight; y += 600) {
                        window.scrollTo(0, y);
                        await new Promise(r => setTimeout(r, 120));
                    }
                }"""
            )
            # Wait while still at the bottom: scrolling back first lets Chrome defer the last lazy images.
            visible = "[...document.images].filter(i => i.getClientRects().length)"
            try:
                page.wait_for_function(f"{visible}.every(i => i.complete)", timeout=15000)
            except Exception:
                pass  # reported below as broken
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(500)  # sticky header back at the top before full_page
            shot = out_dir / f"{slug}-{width}.png"
            page.screenshot(path=str(shot), full_page=True)
            overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            wide = page.evaluate(WIDE)
            broken = page.evaluate(f"{visible}.filter(i => !i.naturalWidth).map(i => i.src)")
            print(
                f"{path} {width}px: {shot.name} | overflow {overflow}px | wide: {wide or 'none'}"
                f" | broken images: {broken or 'none'} | js errors: {errors or 'none'}"
            )
            page.close()
    browser.close()
