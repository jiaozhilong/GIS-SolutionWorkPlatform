# Design QA — Step 02 Login Page

- Date: 2026-07-16
- Source references:
  - `docs/geoagent-solution-studio-design-spec.md`
  - `C:\Users\焦志龙\.codex\generated_images\019f5a82-508f-7323-af93-cddcacdd507a\call_LmYyRjdwkcD7LsYx1Qu670ra.png`
- Prototype screenshot: `C:\tmp\geoagent-step02-login-hero-fixed.png`
- Viewport: 1366 × 768

## Checks

- Login shell uses the required split: dark GIS brand area about 60% wide and white login panel about 40% wide.
- Brand copy is correct:
  - `GeoAgent Solution Workspace`
  - `GIS 解决方案智能工作台`
  - `From Requirements to GIS Deliverables`
- Right panel contains one login card only, with title `登录工作台`, account, password, remember me, forgot password, and primary submit button.
- The left brand panel uses the extracted design-board image asset `frontend/src/assets/solution-studio-login-hero.png`.
- The previous Three/R3F wireframe globe is not rendered on the login page.
- The extracted image contains the real Earth night-view, orbital connection lines, and `需求洞察 → 方案生成 → 架构设计 → PPT 交付` chain from the source design board.
- Form focus dims the left hero image; password visibility toggle works; Enter submits; loading submit is guarded against repeated requests.
- Correct real login enters `/dashboard` in REAL mode with a token.
- Wrong password stays on `/login`, displays backend message, and does not enter PREVIEW.
- Backend-off preview login enters `/dashboard` in PREVIEW mode without a token and shows `本地预览`.
- Logged-in access to `/login` redirects to `/dashboard`.
- No horizontal overflow at 1366 × 768.

## Known non-blocking notes

- The expected `/api/auth/login` 500 appears only during the backend-off preview fallback test.
- The latest corrective validation specifically checked that `.login-hero-image` fills the brand panel and `.gis-globe-canvas canvas` is absent.

final result: passed
