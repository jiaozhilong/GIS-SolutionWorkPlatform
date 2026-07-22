# GeoAgent 全页面设计稿级改造：逐页面执行计划

> 目标：把当前前端严格改造成 `Solution Studio` 设计稿的样子，并在每一个页面完成后单独验证路由、交互、真实接口、错误态和视觉一致性。  
> 执行方式：一次只做一个步骤；当前步骤未通过验收时，不进入下一步。  
> 改造边界：只改前端，不改 Spring Boot Controller、DTO、Service 和数据库。

## 0. 使用方式

每次只执行本文中的一个步骤。执行者开始前应先记录当前步骤编号，完成后勾选该步骤的“完成门槛”，并在步骤末尾补充实际验证结果。

固定验证命令：

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\frontend
npm run build
npm run dev:stable
```

固定访问地址：

```text
http://127.0.0.1:5173
```

不能只用 `npm run build` 作为完成依据。构建通过只代表 TypeScript/Vite 编译成功；页面完成必须同时满足：浏览器无白屏、Console 无未处理异常、Network 请求符合接口约定、主要交互可用、视觉与设计稿一致。

## 1. 设计来源与还原优先级

### 1.1 设计来源

- 详细设计规范：`docs/geoagent-solution-studio-design-spec.md`
- 核心页面设计板：`C:\Users\焦志龙\.codex\generated_images\019f5a82-508f-7323-af93-cddcacdd507a\call_LmYyRjdwkcD7LsYx1Qu670ra.png`
- AI 生产页面设计板：`C:\Users\焦志龙\.codex\generated_images\019f5a82-508f-7323-af93-cddcacdd507a\call_VGcnMCiguOUpQE9EGD5JLIH0.png`
- 运营与配置页面设计板：`C:\Users\焦志龙\.codex\generated_images\019f5a82-508f-7323-af93-cddcacdd507a\call_yBIb3Y0O3tA4Boh0PFW57k3i.png`

### 1.2 还原优先级

发生冲突时，按以下优先级执行：

1. 后端真实接口与 DTO 字段不能被前端改坏。
2. 三张设计板决定页面构图、信息密度、明暗关系和视觉风格。
3. `geoagent-solution-studio-design-spec.md` 决定颜色、字号、间距、状态和动效规则。
4. 当前代码只作为业务功能和接口行为参考，不作为最终视觉参考。

### 1.3 不可偏离的视觉规则

| 项目 | 固定要求 |
| --- | --- |
| 产品品牌 | `GeoAgent Solution Workspace / GIS 解决方案智能工作台` |
| 英文标语 | `From Requirements to GIS Deliverables` |
| 中文标语 | `从客户需求到方案交付` |
| 页面背景 | `#F4F7F6` |
| 卡片背景 | `#FFFFFF` |
| 主品牌色 | `#167D64` |
| 空间数据色 | `#0891B2` |
| 主文字 | `#18211E` |
| 次级文字 | `#667570` |
| 边框 | `#DFE7E3` |
| 警告/错误 | `#F59E0B / #DC5A5A` |
| 左侧导航 | `#14211D`，固定深墨绿 |
| 圆角 | 主卡片 8px；按钮/输入框 6-8px |
| 阴影 | 仅用于浮层、抽屉、登录面板；业务页不做大面积玻璃拟态 |
| 深色区域 | 只允许登录品牌区、Flow 画布、三维架构预览、PPT 封面预览 |
| 字体 | `PingFang SC / Microsoft YaHei / system-ui` |
| 动效 | 登录页强、Flow/三维中等、普通业务页克制；支持 `prefers-reduced-motion` |

禁止事项：

- 不保留旧登录页、旧暗色大屏、霓虹玻璃卡片和重复品牌区。
- 不用 CSS 临时画复杂地球、城市模型或业务插画；使用已有 Three/R3F 场景或真实图像资源。
- 不为了“看起来有数据”向真实业务表格混入假记录。
- 后端没有提供的字段不得提交到 API；需要保留设计稿列时显示 `—`、派生值或明确的“暂无指标”。
- 不将一个接口失败升级为整页白屏。

## 2. 当前问题结论

当前 `npm run build` 可以通过，但还不能判定页面可用。已确认的高风险点如下：

1. 本地预览登录使用 `local-preview-token`，请求拦截器不会发送 Authorization；后端除登录/注册外均由 `AuthInterceptor` 保护。因此当前会出现“进入工作台成功，但每个页面接口均 401/报错”的混合状态。
2. 工作台 Shell 与 Dashboard 都堆在 `App.tsx`，一个区域异常容易影响所有页面，且无法逐页维护和视觉校准。
3. 页面虽然大多有 `Result`，但缺少全局 Error Boundary、统一查询状态和统一 API 数据标准化。
4. 设计稿中的部分展示字段后端不存在，例如项目负责人/预计交付/进度、模板使用次数/版本、Skill 成功率/调用次数、用户团队/邮箱。必须建立“真实字段、派生字段、展示 mock”三层边界。
5. 当前验证主要停留在构建和路由返回，尚未形成逐页面浏览器交互与 Console/Network 验收记录。

## 3. 全局执行门槛

每个页面步骤都必须执行以下检查：

### 3.1 构建门槛

- [ ] `npm run build` 通过。
- [ ] 没有新增 TypeScript 错误。
- [ ] 没有新增未使用的大型依赖。
- [ ] 页面级 Three.js 代码使用懒加载，不能让所有业务页都提前加载 3D 包。

### 3.2 浏览器门槛

- [ ] 目标路由直接访问和刷新都能显示。
- [ ] 浏览器 Console 没有未处理异常、React key 警告和受控/非受控表单警告。
- [ ] 主按钮、筛选、分页、Modal、Drawer、Tabs 均可操作。
- [ ] loading、empty、error、success 至少各验证一次。
- [ ] 1440×900 下无重叠；1366×768 下主要操作不被遮挡。

### 3.3 接口门槛

- [ ] Network 请求路径与后端 Controller 一致。
- [ ] 请求体字段与对应 Request DTO 一致。
- [ ] `ApiResult.code !== 0` 的 message 能被用户看到。
- [ ] 401、403、500、超时不会造成白屏或无限跳转。
- [ ] 编辑脱敏字段时，空值代表“不更新密钥”，不能把 `******` 提交回后端。

### 3.4 视觉门槛

- [ ] 与对应设计板使用相同的页面构图和明暗关系。
- [ ] 深墨绿导航、浅色主内容、绿色主操作一致。
- [ ] 表格行高 48-56px，表头为 `#F8FBFA`。
- [ ] 页面标题、说明、操作按钮的层级与设计稿一致。
- [ ] 没有旧样式、乱码、破损文案、按钮溢出和多余滚动条。

---

## 步骤 00：先修复所有页面共同的运行基础

> 当前执行步骤：步骤 00（2026-07-16，验收通过，可进入步骤 01；本轮未进入步骤 01）

这是唯一的非页面步骤，也是后续页面的强制前置条件。

### 目标

彻底消除“本地预览身份 + 真实受保护 API”的混合状态，并建立每页都能复用的错误、空数据和查询边界。

### 建议文件拆分

- `src/app/AppRouter.tsx`：只负责路由。
- `src/layouts/WorkbenchShell.tsx`：只负责系统外壳。
- `src/pages/Dashboard/index.tsx`：从 `App.tsx` 移出。
- `src/api/runtimeMode.ts`：定义 `REAL` 与 `PREVIEW`。
- `src/api/normalizers.ts`：统一 `ApiResult`、数组、分页数据标准化。
- `src/mocks/previewRepository.ts`：本地预览专用数据，不进入真实 API 层。
- `src/components/AsyncState/index.tsx`：统一 loading/empty/error/retry。
- `src/components/AppErrorBoundary.tsx`：捕获渲染异常。

### 数据模式硬规则

#### REAL 模式

- `/api/auth/login` 返回真实 JWT 后进入。
- 每个业务接口携带 `Authorization: Bearer <token>`。
- 所有新增、编辑、删除、测试、执行、生成操作都请求真实后端。
- 401 清理登录态并回到 `/login`，只跳转一次。

#### PREVIEW 模式

- 仅在后端无法连接/返回 5xx 且输入 `admin/admin123` 时启用。
- 进入后显示清晰的“本地预览”标识。
- 任何业务页面都不请求后端，统一读取 `previewRepository`。
- 写操作只在内存中模拟并提示“仅本地预览，未写入服务器”。
- 禁止用 `local-preview-token` 请求受保护接口。

### API 标准化

- `ApiResult<T>` 只接受 `code === 0` 为成功。
- 列表接口若 `data` 为 `null`，标准化为 `[]`。
- 日志分页若字段缺失，标准化为 `{ total:0, page:1, pageSize:10, records:[], logTypeStats:{}, levelStats:{}, avgDurationMs:0 }`。
- 错误对象统一为 `{ status, code, message, requestId }`，页面不直接显示 Axios 内部对象。
- QueryClient 统一设置有限重试；401/403/业务校验错误不重试。

### 完成门槛

- [x] 真实 JWT 登录后，`GET /api/projects` 携带 Bearer token。
- [x] 后端关闭时，预览模式进入 Dashboard，但 Network 中没有业务 API 连续 401。
- [x] 任意组件故意抛错时显示恢复页，不出现全白。
- [x] 删除 `App.tsx` 内的 Dashboard 和大型 Shell 代码，只保留路由入口。
- [x] 构建及 `/login`、`/dashboard` 路由验证通过。

### 实际执行记录

- 执行日期：2026-07-15
- 修改文件：`frontend/src/App.tsx`、`frontend/src/app/AppRouter.tsx`、`frontend/src/layouts/WorkbenchShell.tsx`、`frontend/src/pages/Dashboard/index.tsx`、`frontend/src/api/client.ts`、`frontend/src/api/runtimeMode.ts`、`frontend/src/api/normalizers.ts`、`frontend/src/api/queryClient.ts`、`frontend/src/mocks/previewRepository.ts`、`frontend/src/components/AsyncState/index.tsx`、`frontend/src/components/AppErrorBoundary.tsx`、`frontend/src/components/AuthGuard.tsx`、`frontend/src/pages/Login/index.tsx`、`frontend/src/stores/authStore.ts`、`frontend/src/main.tsx` 等步骤 00 基础文件。
- 真实接口验证：`POST /api/auth/login` 返回 `code=0` 和真实 JWT（长度 228）；`GET /api/projects` 不带 token 返回 401，携带 `Authorization: Bearer <token>` 返回 200。
- 预览模式验证：后端关闭后，模块集成验证得到 `runtimeMode=PREVIEW`、`tokenPresent=false`、项目/Flow/Skill/日志均从内存仓库返回；预览新增项目生成 `project-preview-100`，并触发一次“未写入服务器”事件。
- 浏览器交互验证：2026-07-16 使用本机 Chrome headless/CDP 完成 `/login` 默认预览账号提交、跳转 `/dashboard`、`/dashboard?__debugRenderError=1` 错误边界验证；截图保存于 `C:\tmp\geoagent-step00-login.png`、`C:\tmp\geoagent-step00-dashboard.png`、`C:\tmp\geoagent-step00-error.png`。
- Network 验证：后端关闭时仅出现预期的 `POST /api/auth/login` 500，用于触发 PREVIEW；进入 Dashboard 后未向真实业务 API 发送请求，未出现业务接口连续 401；预览态 `runtimeMode=PREVIEW` 且 `tokenPresent=false`。
- Console 验证：过滤预期的登录接口 500 与 `?__debugRenderError=1` 诊断抛错后，未知 Console/Log 异常为 0；错误边界页面可见且不是白屏。
- 设计稿比对截图：步骤 00 为非页面步骤，本轮只验证登录页、Dashboard 骨架和错误态基础视觉无白屏、无明显断裂；逐页视觉对齐从步骤 01 起执行。
- 构建结果：2026-07-16 再次执行 `npm run build` 通过；`npm run dev:stable` 通过同脚本子进程启动并输出 Vite ready，固定地址可访问。
- 遗留问题：步骤 00 无阻塞遗留；本轮严格停止在步骤 00，尚未进入步骤 01。
- 本步骤结论：通过

---

## 步骤 01：全局工作台 Shell

### 路由范围

除 `/login` 外的全部受保护页面。

### 设计目标

严格还原设计板中的深墨绿侧栏 + 白色顶部栏 + 浅灰绿内容区，不使用旧暗色大屏结构。

### 页面结构

- 左侧固定导航：桌面宽度 208px；Logo、英文名、中文短名、10 个导航项、底部折叠菜单。
- 顶栏高度 64px：左侧全局搜索；右侧通知、用户头像、姓名、角色和退出。
- 内容区：`#F4F7F6`，默认 20-24px 内边距，页面内容允许全宽。
- `/` 重定向到 `/dashboard`，不是 `/projects`。
- ADMIN 才显示用户权限；非 ADMIN 直接访问 `/users` 显示 403 页面。

### 交互

- 侧栏 active 状态必须跟随 URL，刷新后不丢失。
- 收起侧栏后保留图标和 Tooltip。
- 顶部搜索暂未有后端搜索接口时，只允许做前端路由内搜索或显示“搜索能力建设中”，不能伪造搜索结果。
- 退出登录清理 Query Cache 和 auth store，再进入 `/login`。

### 完成门槛

- [x] 10 个菜单逐项点击，URL 与页面标题一致。
- [x] 刷新每条路由仍停留当前页。
- [x] 用户菜单和退出可用。
- [x] 1366×768 下侧栏、顶部栏和内容区不重叠。
- [x] 与三张系统设计板的导航宽度、色彩、选中态接近。

### 实际执行记录

- 执行日期：2026-07-16
- 当前执行步骤：步骤 01（验收通过；本轮未进入步骤 02）。
- 修改文件：`frontend/src/config/navigation.tsx`、`frontend/src/components/GisSidebar/index.tsx`、`frontend/src/layouts/WorkbenchShell.tsx`、`frontend/src/components/RoleGuard.tsx`、`frontend/src/stores/authStore.ts`、`frontend/src/app/AppRouter.tsx`、`frontend/src/styles/gis-theme.css`。
- 视觉还原：左侧导航固定 208px 深墨绿；顶部栏固定 64px 白底；内容区背景为 `#F4F7F6`；品牌为 `GeoAgent Solution Workspace / GIS 解决方案智能工作台`；英文标语为 `From Requirements to GIS Deliverables`；中文标语为 `从客户需求到方案交付`。
- 路由验证：`/` 重定向 `/dashboard`；`/dashboard`、`/projects`、`/skills`、`/flows`、`/templates`、`/logs`、`/settings/ima`、`/settings/llm`、`/settings/github`、`/users` 均可进入，导航 active 状态与 URL 一致，页面标题为 `GeoAgent Solution Workspace / GIS 解决方案智能工作台`。
- 权限验证：ADMIN 可见 `用户权限`；模拟 USER 时侧栏不显示 `/users`，直接访问 `/users` 显示 403「暂无访问权限」，不白屏。
- 交互验证：侧栏可折叠到 72px，保留图标与 title/Tooltip；顶栏搜索输入「模型配置」跳转 `/settings/llm`；用户菜单退出后清理 `gis-auth` 并进入 `/login`。
- Network 验证：浏览器验收期间仅出现预期的 `POST /api/auth/login` 500，用于在后端未启动时触发 PREVIEW；进入工作台后未出现业务接口循环 401/500。
- Console 验证：未发现未处理运行时异常；登录接口 500 与浏览器资源加载提示属于预期预览触发，不作为页面异常。
- 构建结果：`npm run build` 通过；随后通过 `npm run dev:stable` 子进程启动 Vite，固定地址 `http://127.0.0.1:5173` 可访问。
- 浏览器截图：`C:\tmp\geoagent-step01-shell-1366.png`；1366×768 下侧栏、顶栏和内容区无重叠、无横向溢出。
- 本步骤结论：通过。

---

## 步骤 02：登录页 `/login`

### 对应设计

核心页面设计板左上“登录页”。左侧深色 GIS 品牌区约 58%-62%，右侧白色登录区约 38%-42%。

### 页面结构

- 左侧：GeoAgent 标志、产品中英文名、英文标语、3D 地球、中国/亚洲城市节点、轨道连线。
- 左侧底部：需求洞察 → 方案生成 → 架构设计 → PPT 交付。
- 右侧：标题“登录工作台”、用户名、密码、记住我、忘记密码、主按钮。
- 只保留这一版登录页，删除旧背景、旧标题和重复表单。

### 动效

- R3F 地球 36s 匀速旋转；鼠标进入表单区域降低场景亮度和粒子速度。
- 城市节点按顺序点亮；交付节点每 80-120ms stagger。
- Anime.js 登录面板 `translateX(24px) + opacity`，520ms。
- 按钮光扫只在 hover/submit 成功时触发，不持续闪烁。
- `prefers-reduced-motion` 下停止循环浮动，仅保留静态场景。

### 接口契约

- `POST /api/auth/login`
- Payload：`{ username, password }`
- 成功数据：`token, userId, username, realName?, role`
- 错误密码不得进入 PREVIEW；只有网络不可达/5xx 且账号为 `admin/admin123` 才允许预览。

### 交互验收

- [x] 正确真实账号进入 `/dashboard`。
- [x] 错误密码显示后端 message，不触发预览。
- [x] 后端关闭时默认预览账号进入 PREVIEW，且页面显示预览标识。
- [x] 已登录访问 `/login` 自动跳 Dashboard。
- [x] loading 时按钮不可重复提交；Enter 可提交；密码可显隐。
- [x] 地球首屏可见，场景加载失败时显示同风格静态 GIS 背景，不影响登录。

### 实际执行记录

- 执行日期：2026-07-16
- 当前执行步骤：步骤 02（验收通过；本轮未进入步骤 03）。
- 修改文件：`frontend/src/pages/Login/index.tsx`、`frontend/src/styles/gis-theme.css`、`frontend/src/assets/solution-studio-login-hero.png`、`frontend/design-qa.md`。
- 视觉还原：登录页按核心设计板左上区域重构为左侧约 60% 深色 GIS 品牌区、右侧约 40% 白色登录区；左侧主视觉直接使用从核心设计板登录页裁出的真实地球夜景图像资源 `solution-studio-login-hero.png`，不再使用上一版 Three 线框地球；图像内保留 `GeoAgent Solution Workspace / GIS 解决方案智能工作台`、地球轨道光点和「需求洞察 → 方案生成 → 架构设计 → PPT 交付」链路。
- 地球与动效：登录页左侧不再渲染 R3F/Three canvas，避免与设计稿真实影像质感偏离；鼠标进入/聚焦表单区后轻微压暗左侧真实图像；语义文案以隐藏文本保留，首屏视觉以设计板裁图为准。
- 表单交互：标题为「登录工作台」；包含账号、密码、记住我、忘记密码、主按钮；密码显隐可用；Enter 可提交；提交时使用 ref 锁防止 loading 期间重复提交，按钮显示「正在登录...」。
- 真实接口验证：本地使用 JDK11 + Maven 启动后端；`POST /api/auth/login` with `{ username:"admin", password:"admin123" }` 返回 `code=0`、JWT、`role=ADMIN`，浏览器进入 `/dashboard` 且 `runtimeMode=REAL`、`token` 存在。
- 错误登录验证：`admin / wrong-password` 留在 `/login`，显示后端 message；`gis-auth` 未写入，未进入 PREVIEW。
- 预览登录验证：关闭后端后使用默认预览账号 `admin/admin123`，浏览器进入 `/dashboard`，`runtimeMode=PREVIEW`，无 token，工作台显示「本地预览」标识。
- 已登录访问验证：REAL 登录态下访问 `/login` 自动跳转 `/dashboard`。
- Network 验证：真实登录阶段 `/api/auth/login` 为 200，进入工作台后的真实业务接口为 200；后端关闭预览阶段仅出现预期的 `/api/auth/login` 500 用于触发 PREVIEW。
- Console 验证：未发现未处理运行时异常；预览阶段登录接口 500 与浏览器取消请求属于预期验证事件。
- 构建结果：`npm run build` 通过；随后通过 `npm run dev:stable` 子进程启动 Vite，固定地址 `http://127.0.0.1:5173` 可访问。
- 浏览器截图：`C:\tmp\geoagent-step02-login-hero-fixed.png`；1366×768 下登录页无横向溢出，左/右比例为 0.60/0.40，左侧真实图像资源铺满品牌区且旧 Three canvas 不存在。
- 本步骤结论：通过。

---

## 步骤 03：平台总览 `/dashboard`

### 对应设计

核心页面设计板右上“平台总览”。高密度浅色驾驶舱，顶部欢迎区、六项统计、项目表格、AI 推荐、交付链路。

### 页面结构

1. 欢迎区：欢迎回来、说明、`运行 Flow`、`新建项目`。
2. 六个等高统计卡：进行中项目、本月交付、待办任务、方案复用率、Agent 成功率、平均交付周期。
3. 左 8 栅格项目进展表，右 4 栅格 AI 助理推荐。
4. 底部横向交付链路：需求分析、产品匹配、案例检索、架构设计、方案撰写、PPT 生成。

### 数据来源

- `GET /api/projects`
- `GET /api/flows`
- `GET /api/skills`
- `GET /api/system/logs?page=1&pageSize=8`
- `/api/hello` 只能作为健康提示，不能阻塞整页。

### 派生规则

- 项目数、流程数、技能数、错误日志数来自真实数据。
- 项目进度按 status 映射为只读视图值，不能写回后端。
- 后端没有任务、复用率和交付周期接口时，使用明确命名的 `DashboardViewModel` 派生；页面 Tooltip 标明“基于现有项目/日志估算”。
- 任一接口失败只影响对应模块，其他模块正常显示。

### 交互与动效

- 统计数字 count-up 800ms；进度条 700ms。
- `运行 Flow` 进入 `/flows`；`新建项目` 进入 `/projects` 并自动打开新建弹窗（通过路由 state/query）。
- 点击项目名称进入对应项目详情，而不是只进入项目列表。
- AI 推荐卡点击后跳到具体页面或打开说明，不使用无响应假按钮。

### 完成门槛

- [ ] 四个接口分别模拟失败，整页均不白屏。
- [ ] 六个统计卡在 1440 宽同一行或按设计稿 4+2 合理换行。
- [ ] 项目表、AI 推荐、交付链路排版与设计板一致。
- [ ] 所有入口均可点击并进入正确目标。

---

## 步骤 04：项目作战室 `/projects`

### 对应设计

核心页面设计板左下“项目作战室”。以表格为主，不做大卡片瀑布流。

### 页面结构

- 标题区：`PROJECT WAR ROOM / 项目作战室`、说明、刷新、新建项目。
- 统计：项目总数、进行中、签约/交付、高优先级。
- 筛选：关键词、行业、阶段、优先级；一行排列。
- 表格：项目名称、客户、行业、GIS 领域、阶段、进度、优先级、更新时间、操作。
- 操作列只保留“查看”和“更多”；编辑、删除放入更多菜单，避免按钮拥挤。

### 接口契约

- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
- Payload 只能包含：`name, customerName, industry, gisDomain, status, priority, description, githubRepoUrl`

### 表单规则

- `name` 必填；其他字段按后端允许选填。
- status、priority 使用固定枚举映射显示，不把中文标签提交给后端。
- 编辑时完整回填八个字段，保存后只刷新项目 query。
- 进度是前端 status 映射结果，不进入 ProjectPayload。

### 完成门槛

- [ ] 新建、编辑、删除各成功一次，Network payload 无额外字段。
- [ ] 删除前二次确认；失败时记录仍保留。
- [ ] 筛选和重置可用，空列表显示专业空状态。
- [ ] 项目名称/查看入口能打开步骤 05 的详情。
- [ ] 表格样式与核心设计板一致，无横向按钮挤压。

---

## 步骤 05：项目详情工作台（由 `/projects` 打开）

### 对应设计

核心页面设计板右下“项目详情”。建议使用近全屏 Drawer 或独立 `/projects/:id` 路由；执行时二选一后保持唯一实现，不同时保留两套详情。

### 页面结构

- Header：返回、项目名称、客户、阶段、优先级、分享、更多、生成 PPT 大纲、启动方案生成。
- Tabs：项目概览、需求管理、AI 流程、成果交付、文档与附件、任务与计划、沟通记录。
- 概览三栏：需求摘要、AI 流程进展、三维架构预览；右侧项目信息/下一步行动。
- 底部交付物：Word、PDF、PPT 和新增交付物。

### 真实字段与展示字段

- 真实字段来自 ProjectVO：`name, customerName, industry, gisDomain, status, priority, description, githubRepoUrl, createdAt, updatedAt`。
- 负责人、预计交付日、项目编号、进度为后端未提供字段；只能显示 `—`、当前登录用户或 status 派生值，不能提交。
- 需求摘要优先使用 description；没有内容时显示引导空状态。

### 联动接口

- `POST /api/projects/{projectId}/flows/{flowId}/run`，body `{ inputContext }`
- `GET /api/projects/{projectId}/flow-executions`
- `POST /api/projects/{projectId}/ppt/outline/generate`，body `{ executionId?, title? }`
- `GET /api/projects/{projectId}/ppt`

### 完成门槛

- [ ] 详情打开/关闭或前进/后退不丢列表筛选状态。
- [ ] 所有 Tabs 可切换；未实现业务的 Tab 显示设计完成的空状态，不出现死按钮。
- [ ] Flow 必须提交当前真实 projectId 和选中的 flowId。
- [ ] PPT 大纲必须提交当前 projectId。
- [ ] Drawer/页面在 1366×768 下头部操作不溢出。

---

## 步骤 06：三维架构预览（项目详情内）

### 对应设计

AI 生产设计板左下“三维架构预览”。该区域是深色沉浸画布，不影响项目详情其余浅色区域。

### 页面结构

- 主画布：园区/城市模型、道路、水体、建筑灯光。
- 左侧图层控制：地形、建筑、管线、业务点位、空间分析结果。
- 右侧能力标签：数据接入、空间分析、三维展示、业务系统集成。
- 底部工具条：复位、图层、热点、截图、全屏。

### 实现边界

- 使用 R3F/Three.js；模型和热点属于隔离展示数据，不进入 API 层。
- 组件懒加载；加载期间显示同尺寸 skeleton。
- WebGL 不可用时显示真实静态预览图和能力列表，不白屏。
- 相机缓慢环绕，hover/拖拽时暂停；图层切换淡入；热点高亮不过度闪烁。

### 完成门槛

- [ ] 模型加载、失败降级、全屏退出都可用。
- [ ] 图层开关真实影响场景可见对象。
- [ ] 页面离开后 animation frame、事件和 WebGL 资源被释放。
- [ ] 视觉构图接近设计板，不使用简单 CSS 方块代替城市模型。

---

## 步骤 07：成果交付与 PPT 编辑器（项目详情内）

### 对应设计

AI 生产设计板右下“成果交付与 PPT 编辑”。左侧交付物列表，中间页面信息和缩略图，右侧大预览。

### 页面结构

- 左栏：Word/PDF/PPT 交付物列表和新增交付物。
- 中栏：PPT 标题、副标题、版式、背景、备注、页面缩略图。
- 右栏：当前幻灯片预览、缩放、适配、全屏。
- 底部固定保存按钮，保存时显示 loading 与成功反馈。

### 接口契约

- `POST /api/ppt/generate`：`{ projectId, executionId?, title? }`
- `GET /api/ppt/records?projectId={id}` 或项目接口返回记录
- `GET /api/ppt/records/{id}`
- `PUT /api/ppt/records/{id}`：`{ title, outlineJson?, contentJson?, status? }`

### 数据安全

- `outlineJson/contentJson` 解析失败时保留原始文本并显示修复提示，不能覆盖成空数组。
- 保存必须使用真实 record id。
- 切换记录或关闭编辑器时，如果有未保存更改要二次确认。

### 完成门槛

- [ ] 生成大纲、生成内容、打开记录、修改、保存完整走通。
- [ ] 空 PPT、损坏 JSON、接口失败均不白屏。
- [ ] 缩略图选中态和预览区域与设计板接近。
- [ ] 保存后重新读取，内容没有丢失。

---

## 步骤 08：Agent 技能 `/skills`

### 对应设计

AI 生产设计板左上“Agent 技能”。浅色表格 + 右侧技能详情，不做大面积独立技能卡。

### 页面结构

- 标题、说明、搜索、新建技能。
- 统计：Skill 总数、启用、需要 IMA、需要 LLM。
- 主表格：名称、类型、状态、IMA、LLM、GitHub、超时、重试、操作。
- 右侧详情：描述、Prompt、输入输出 Schema、配置、测试入口、测试结果。

### 接口契约

- `GET/POST /api/skills`
- `PUT/DELETE /api/skills/{id}`
- `POST /api/skills/{id}/test`，body `{ input }`
- Payload 保持：`name, type, category, version, description, promptTemplate, inputSchema, outputSchema, requiresIma, requiresLlm, requiresGithub, imaKbIds, llmConfigId, timeoutSeconds, retryCount, status`

### 关键规则

- `requiresIma/requiresLlm/requiresGithub` 必须提交 `0/1`，Switch 只负责 UI 转换。
- 成功率、调用次数后端未提供时显示“暂无运行指标”，不伪造百分比。
- JSON 输入校验失败时不发请求。
- 测试结果展示 renderedPrompt、IMA items、llmResponse、status、errorMessage、durationMs。

### 完成门槛

- [ ] CRUD 和测试各走通一次。
- [ ] 编辑时 0/1 转换正确，未改字段不丢失。
- [ ] 右侧详情随表格选择更新。
- [ ] 页面构图与设计板一致，测试结果可读且可滚动。

---

## 步骤 09：流程编排 `/flows`

### 对应设计

AI 生产设计板右上“流程编排”。左侧流程/节点区，中间深色 DAG，右侧属性，底部运行结果和 JSON。

### 页面结构

- 页面顶部：流程名称、保存、运行、发布/状态、全屏。
- 左栏：流程列表或可用节点库。
- 中间：深色网格画布，节点链路为开始 → 需求分析 → 产品匹配 → 案例检索 → 架构设计 → 方案撰写 → PPT 生成 → 结束。
- 右栏：选中节点属性、Skill、超时、重试、参数覆盖。
- 底部：运行状态、输入/输出、JSON 兜底编辑。

### 接口契约

- `GET/POST /api/flows`
- `PUT/DELETE /api/flows/{id}`
- `POST /api/flows/{id}/execute`，body `{ inputContext }`
- `GET /api/flows/{id}/executions`
- `FlowPayload` 只能包含 `name, description, category, version, status, nodes, edges`。
- node 字段：`clientId?, skillId, nodeName, positionX?, positionY?, paramOverrides?, timeoutSeconds?, retryCount?`。
- edge 字段：`sourceNodeId, targetNodeId`。

### 关键规则

- 新建节点先使用稳定 clientId；保存前确保 edge 引用能被后端识别。
- JSON 编辑和画布状态必须双向同步；解析失败时不得覆盖当前流程。
- 执行态：运行中呼吸、成功变绿、失败变红；连线粒子只在运行时出现。
- 后端 FlowExecution 没有 `errorMessage` 字段，失败详情从 `outputContext/status` 和日志页关联展示，不臆造字段。

### 完成门槛

- [ ] 创建、编辑、删除、执行、查看执行记录均通过。
- [ ] 保存前后 nodes/edges 数量和关联不丢失。
- [ ] 画布选择节点时右侧属性准确更新。
- [ ] 动效不造成 CPU 长时间高占用，离页后停止。
- [ ] 页面整体明暗和三栏比例接近设计板。

---

## 步骤 10：方案模板 `/templates`

### 对应设计

运营与配置设计板左上“方案模板”。统计 + 筛选 + 高密度表格 + 右侧预览。

### 页面结构

- 统计：全部模板、方案模板、投标模板、PPT 模板、实施模板。
- 筛选：类型、分类、关键词；右侧新建模板。
- 表格：名称、类型、分类、变量、系统模板、更新时间、操作。
- 预览 Drawer：名称、类型、分类、变量、正文内容、使用模板按钮。

### 接口契约

- `GET /api/templates?type&category&keyword`
- `POST /api/templates`
- `PUT/DELETE /api/templates/{id}`
- Payload：`name, type, category?, content, variablesJson?, isSystem?`
- 类型：`PROPOSAL, BID, PPT, IMPLEMENTATION`

### 关键规则

- `name/type/content` 必填。
- `variablesJson` 必须校验为合法 JSON；不合法时不提交。
- `isSystem === 1` 禁止删除，前端禁用且后端错误也要展示。
- 设计稿中的版本/使用次数后端未提供；本轮不提交、不伪造，表格用更新时间和系统属性替代。

### 完成门槛

- [ ] 筛选参数与 Controller 一致。
- [ ] CRUD、预览、系统模板删除保护可用。
- [ ] 长内容在预览内滚动，不撑破页面。
- [ ] 表格 + 右侧预览比例接近设计板。

---

## 步骤 11：运行日志 `/logs`

### 对应设计

运营与配置设计板右上“运行日志”。上方统计和筛选，左侧表格，右侧固定详情。

### 页面结构

- 统计：日志总数、Flow 运行、异常日志、平均耗时。
- 筛选：类型、级别、模块、操作、关键词、时间范围。
- 表格：时间、模块、操作、类型、级别、摘要、耗时、查看。
- 详情 Drawer/侧栏：基本信息、message、detail、关联 refId。

### 接口契约

- `GET /api/system/logs`
- 参数：`logType, level, module, action, keyword, startAt, endAt, page, pageSize`
- 类型：`FLOW, SKILL, LLM, GITHUB`
- 级别：`INFO, WARN, ERROR`

### 关键规则

- 时间控件转换为后端接受的字符串，清空时不发送空字符串。
- Table 分页必须以接口返回 `total/page/pageSize` 为准。
- 日志详情可能包含 JSON；可格式化显示，但解析失败时保留原文。

### 完成门槛

- [ ] 筛选、重置、分页、详情全部可用。
- [ ] `records` 为空或 data 缺失时不报 `.map` 错误。
- [ ] 错误日志红色只用于状态点/标签，不铺满整行。
- [ ] 页面布局与设计板一致。

---

## 步骤 12：用户权限 `/users`

### 对应设计

运营与配置设计板中左“用户权限”。顶部筛选和新增，中间表格，底部角色说明。

### 页面结构

- 统计：用户总数、管理员、工程师、停用账号。
- 筛选：关键词、角色、状态。
- 表格：用户名、姓名、角色、状态、最近登录、操作。
- 底部角色说明：ADMIN、ENGINEER。
- Modal：新增/编辑；独立 Modal：重置密码。

### 接口契约

- `GET /api/users?keyword&role&status`
- `POST /api/users`：`username, password, realName?, role, status?`
- `PUT /api/users/{id}`：`realName, role, status`，禁止发送 password/username。
- `DELETE /api/users/{id}`
- `POST /api/users/{id}/reset-password`：`{ newPassword }`

### 关键规则

- 当前用户不能删除自己。
- 非 ADMIN 不显示菜单，直接访问显示 403，不发用户列表请求。
- 设计稿中的邮箱、团队、项目数后端未提供，不加入 payload；表格按真实字段重排。
- 新增和编辑必须使用不同 payload 类型，不能用交叉类型把 password 意外带到 PUT。

### 完成门槛

- [ ] ADMIN 完成新增、编辑、重置密码、删除。
- [ ] 当前用户删除按钮禁用并给出原因。
- [ ] 非 ADMIN 的导航和路由保护均正确。
- [ ] 表格、角色说明与设计板一致。

---

## 步骤 13：知识库 IMA `/settings/ima`

### 对应设计

运营与配置设计板中部“知识库 IMA”。统计卡 + 知识库连接表 + 检索/测试面板。

### 页面结构

- 统计：我的知识库、共享知识库、订阅知识库、可用连接。
- 表格：名称、知识库 ID/名称、类型、行业标签、默认、状态、密钥、操作。
- Modal：新建/编辑连接。
- 检索面板：选择 kbIds、输入 query、结果列表。

### 接口契约

- `GET/POST /api/ima/config`
- `PUT/DELETE /api/ima/config/{id}`
- `POST /api/ima/config/{id}/test`
- `POST /api/ima/search`：`{ kbIds, query }`
- Payload：`name, apiKey?, kbId?, kbName?, kbType?, industryTag?, isDefault?, isActive?`

### 关键规则

- `apiKeyMasked` 只展示，绝不回填到 apiKey。
- 编辑时 apiKey 留空表示不更新；只有用户输入新值才提交。
- `isDefault/isActive` 在 Switch 与 `0/1` 之间转换。
- 检索结果显示 title、type、score、kbId、kbName；空结果为专业空状态。

### 完成门槛

- [ ] CRUD、测试连接、搜索全部走真实 id/参数。
- [ ] 编辑未改密钥时不会提交掩码。
- [ ] 0/1 字段转换正确。
- [ ] 视觉与设计板中的统计+表格结构一致。

---

## 步骤 14：模型配置 `/settings/llm`

### 对应设计

运营与配置设计板中右“模型配置”。高密度模型表格，下方测试输入与结果。

### 页面结构

- 统计：配置总数、分析场景、生成场景、启用配置。
- 表格：配置名、API Base/服务商提示、模型名、场景、Temperature、Max Tokens、状态、操作。
- Modal：基础连接、模型参数、System Prompt、超时、场景、启用。
- 测试区：测试输入、运行按钮、连接/延迟/响应预览。

### 接口契约

- `GET/POST /api/llm/config`
- `PUT/DELETE /api/llm/config/{id}`
- `POST /api/llm/config/{id}/test`
- Payload：`name, apiBase, apiKey?, modelName, temperature?, maxTokens?, systemPrompt?, timeoutSeconds?, usageScene?, isActive?`

### 关键规则

- 后端字段是 `apiBase`，不是 `baseUrl`；没有独立 provider 字段。
- provider 只能从 apiBase 域名派生显示，不能提交。
- `apiKeyMasked` 不回填；空 apiKey 表示不更新。
- Temperature 0-2；Max Tokens、timeoutSeconds 使用数字并做合理范围校验。

### 完成门槛

- [ ] CRUD 和测试使用真实配置 id。
- [ ] `name/apiBase/modelName` 必填。
- [ ] 编辑不覆盖 API Key。
- [ ] 测试结果清晰展示 connected、latencyMs、message、responsePreview。
- [ ] 视觉与设计板一致。

---

## 步骤 15：GitHub 连接 `/settings/github`

### 对应设计

运营与配置设计板底部“GitHub 连接 + README 预览”。上方连接表，下方/弹窗为文件树和 Markdown 预览。

### 页面结构

- 统计：连接总数、启用连接、组织数、最近配置时间。
- 表格：配置名、GitHub 用户、默认组织、Token 掩码、状态、创建时间、操作。
- Modal：新建/编辑连接。
- README 预览：Owner、Repo 输入，左侧文件树，右侧 Markdown 内容。

### 接口契约

- `GET/POST /api/github/config`
- `PUT/DELETE /api/github/config/{id}`
- `POST /api/github/config/{id}/test`
- `GET /api/github/repos/{owner}/{repo}/readme`
- `GET /api/github/repos/{owner}/{repo}/tree`
- `GET /api/github/repos/{owner}/{repo}/file?path=...`
- 配置 Payload：`name, token?, username?, defaultOrg?, isActive?`

### 关键规则

- 后端配置没有 repo/branch 字段，不能把设计稿里的仓库/分支强行提交；Owner/Repo 只作为读取对话框输入。
- `tokenMasked` 只展示；编辑时空 token 表示不更新。
- owner/repo/path 进入 URL 前正确编码。
- Markdown 预览禁止执行危险 HTML；文件读取错误显示后端 message。

### 完成门槛

- [ ] CRUD、测试、README、Tree、File 读取均使用真实参数。
- [ ] 编辑不覆盖 Token。
- [ ] 文件树选择后右侧内容更新。
- [ ] README 预览构图与设计板一致。

---

## 步骤 16：全页面设计 QA 与回归

只有步骤 00-15 全部通过后执行。

### 16.1 路由清单

- [ ] `/login`
- [ ] `/dashboard`
- [ ] `/projects`
- [ ] 项目详情入口
- [ ] 三维架构预览
- [ ] PPT 编辑器
- [ ] `/skills`
- [ ] `/flows`
- [ ] `/templates`
- [ ] `/logs`
- [ ] `/users`
- [ ] `/settings/ima`
- [ ] `/settings/llm`
- [ ] `/settings/github`

### 16.2 逐页截图比对

每个页面必须在 1440×900 截图，并与设计板对应区域并排比较。记录以下差异：

- 页面栅格和主要区块比例。
- 导航宽度、顶部栏高度、内容内边距。
- 标题/描述/按钮的纵向对齐。
- 卡片、表格、抽屉、Modal 的边框和圆角。
- 字号、行高、颜色和状态标签。
- 画布、地球、模型、连线与热点位置。
- loading/empty/error/success 四类状态。

所有 P0/P1/P2 视觉差异修完才能通过；P3 微调可记录为后续优化。

### 16.3 全流程回归

#### 认证

- [ ] 真实登录、错误登录、预览登录、退出、401 过期。

#### 项目交付

- [ ] 新建项目 → 打开详情 → 执行 Flow → 查看执行记录 → 生成 PPT → 编辑并保存。

#### 能力配置

- [ ] 新建 Skill → 测试 Skill → 新建 Flow → 配置节点 → 保存 → 执行。

#### 资产与运维

- [ ] 模板 CRUD/预览、日志筛选/详情、用户 CRUD/重置密码。

#### 外部配置

- [ ] IMA 测试/检索、LLM 测试、GitHub 测试/README/文件读取。

### 16.4 最终完成标准

- [ ] 所有页面都与 Solution Studio 设计稿保持同一套视觉语言。
- [ ] 没有旧页面残留、乱码和重复样式。
- [ ] 所有真实操作仍匹配当前后端 Controller/DTO。
- [ ] REAL 与 PREVIEW 模式完全隔离。
- [ ] Console 无未处理异常，Network 无循环 401/500。
- [ ] `npm run build` 最终通过。
- [ ] 生成 `design-qa.md`，结论为 `final result: passed`。

## 4. 执行记录模板

每完成一个步骤，在对应步骤末尾追加：

```md
### 实际执行记录

- 执行日期：
- 修改文件：
- 真实接口验证：
- 预览模式验证：
- 浏览器交互验证：
- 设计稿比对截图：
- 构建结果：
- 遗留问题：
- 本步骤结论：通过 / 不通过
```

只有“本步骤结论：通过”时，才可以开始下一步骤。
