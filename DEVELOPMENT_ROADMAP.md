# GIS 解决方案 AI 工作平台后续执行路线图

> 原则：每个阶段都必须形成真实业务闭环。不能只做菜单、静态页面或假数据。每个任务完成后都要能通过后端接口、数据库记录和前端操作验证。

## 当前状态

已完成：

- TODO-01：项目脚手架
- TODO-02：PostgreSQL 数据库初始化
- TODO-03：项目管理最小可用 CRUD

当前可用功能：

- 项目列表
- 新建项目
- 编辑项目
- 查看项目详情
- 删除项目
- 前端真实调用后端接口
- 后端真实读写 PostgreSQL

当前运行地址：

- 前端：http://localhost:5173
- 后端：http://localhost:8080

## 总体开发顺序

后续不按“菜单模块”开发，而按业务能力闭环推进：

1. 项目详情闭环
2. 配置中心闭环
3. AI 能力闭环
4. Skill 运行闭环
5. 项目方案生成闭环
6. 流程编排闭环
7. PPT 和交付物闭环
8. 日志、审计、稳定性完善

---

## 阶段一：项目详情闭环

目标：项目不只是列表台账，而是后续所有 AI 工作流的业务入口。

### 1.1 项目列表增强

后端：

- `GET /api/projects` 支持分页
- 支持 `keyword`
- 支持 `status`
- 支持 `industry`
- 支持 `priority`
- 返回统一分页结构 `PageResult<ProjectVO>`

前端：

- 项目列表增加搜索框
- 增加状态筛选
- 增加行业筛选
- 增加优先级筛选
- 表格使用真实分页

验收：

- 输入关键词后只返回匹配项目
- 切换状态筛选后列表刷新
- PostgreSQL 查询真实执行，不使用前端假过滤

### 1.2 项目详情页

后端：

- 保留 `GET /api/projects/{id}`
- 返回项目基本信息
- 后续逐步聚合需求、附件、知识库、方案、PPT、日志

前端：

- 从 Drawer 改成独立详情页或主内容详情视图
- 列表点击项目进入详情
- 详情页包含 Tab：
  - 基本信息
  - 需求信息
  - 知识库关联
  - 方案产物
  - PPT 内容
  - 执行日志

验收：

- 点击项目名称进入详情页
- 刷新页面后仍能根据项目 ID 加载项目

### 1.3 项目附件管理

数据库：

- 使用 `project_attachments`

后端：

- `POST /api/projects/{id}/attachments`
- `GET /api/projects/{id}/attachments`
- `DELETE /api/projects/{id}/attachments/{attachmentId}`
- 文件保存到本地目录，例如 `storage/projects/{projectId}/`
- 附件元数据入库

前端：

- 项目详情增加附件 Tab
- 支持上传需求文档
- 支持查看附件列表
- 支持删除附件

验收：

- 上传文件后本地磁盘能看到文件
- `project_attachments` 表有记录
- 刷新页面附件仍存在

---

## 阶段二：配置中心闭环

目标：先把 IMA、LLM、GitHub 做成可配置能力，否则后续 AI 流程都会变成假流程。

### 2.1 加密工具

后端：

- 新增 `AesUtil`
- 配置 AES 密钥来源：
  - 优先环境变量 `APP_AES_KEY`
  - 没有则使用开发默认值
- 所有 API Key、Token 入库前加密
- 查询列表时不返回明文密钥

验收：

- 数据库里看不到明文 API Key
- 前端列表只显示脱敏字段

### 2.2 IMA 配置模块

数据库：

- 使用 `ima_config`

后端：

- `POST /api/ima/config`
- `PUT /api/ima/config/{id}`
- `GET /api/ima/config`
- `DELETE /api/ima/config/{id}`
- `POST /api/ima/config/{id}/test`
- `POST /api/ima/search`

服务层：

- `ImaService` 定义接口
- `ImaServiceImpl` 当前使用 Mock
- 标记 `TODO: 接入真实 IMA SDK`

前端：

- 设置页增加 IMA 配置 Tab
- 支持新增、编辑、删除
- API Key 使用 password 输入框
- 支持连接测试
- 支持检索测试

验收：

- 新增 IMA 配置后数据库有密文记录
- 点击测试连接返回成功或明确错误
- 检索测试能返回 Mock 结果

### 2.3 LLM 配置模块

数据库：

- 使用 `llm_config`

后端：

- `POST /api/llm/config`
- `PUT /api/llm/config/{id}`
- `GET /api/llm/config`
- `DELETE /api/llm/config/{id}`
- `POST /api/llm/config/{id}/test`

服务层：

- `LlmService`
- `LlmServiceImpl`
- 使用 OkHttp 调 OpenAI-compatible Chat Completions
- 支持 `apiBase`
- 支持 `modelName`
- 支持 `temperature`
- 支持 `maxTokens`

前端：

- 设置页增加大模型配置 Tab
- 支持新增、编辑、删除
- 支持测试连接
- 测试时发送最小 prompt

验收：

- DeepSeek 或其他兼容模型配置后能真实测试
- 测试结果写入 `system_logs`

### 2.4 GitHub 配置模块

数据库：

- 使用 `github_config`

后端：

- `POST /api/github/config`
- `PUT /api/github/config/{id}`
- `GET /api/github/config`
- `DELETE /api/github/config/{id}`
- `POST /api/github/config/{id}/test`
- `GET /api/github/repos/{owner}/{repo}/readme`
- `GET /api/github/repos/{owner}/{repo}/tree`
- `GET /api/github/repos/{owner}/{repo}/file?path=xxx`

前端：

- 设置页增加 GitHub 配置 Tab
- 支持 Token 保存
- 支持读取 README 测试

验收：

- 能读取公开仓库 README
- 配 Token 后能读取私有仓库，权限不足时返回明确错误

---

## 阶段三：Skill 能力中心

目标：把 AI 能力从硬编码接口变成可配置、可复用、可测试的能力单元。

### 3.1 Skill CRUD

数据库：

- 使用 `skills`

后端：

- `POST /api/skills`
- `PUT /api/skills/{id}`
- `GET /api/skills`
- `GET /api/skills/{id}`
- `DELETE /api/skills/{id}`

字段：

- 名称
- 类型
- 分类
- Prompt 模板
- 输入 Schema
- 输出 Schema
- 是否需要 IMA
- 是否需要 LLM
- 是否需要 GitHub
- 超时时间
- 重试次数
- 状态

前端：

- Skill 列表
- Skill 新建/编辑页
- Prompt 模板编辑器
- 输入输出 Schema 编辑
- 依赖能力开关

验收：

- 新建 Skill 后数据库有记录
- 编辑 Prompt 后刷新不丢失

### 3.2 Skill 测试运行

后端：

- `POST /api/skills/{id}/test`
- 新增 `SkillExecutor`
- 实现模板变量替换
- 根据配置调用 IMA
- 根据配置调用 LLM
- 执行日志写入 `system_logs`

前端：

- Skill 详情页增加测试面板
- 输入测试 JSON
- 显示最终 Prompt
- 显示执行结果
- 显示错误信息

验收：

- 输入 `{ "projectName": "xxx" }` 能替换 `{{projectName}}`
- 需要 LLM 的 Skill 能返回真实模型结果
- 失败时日志可查

### 3.3 预置 GIS Skill

后端：

- 启动初始化或 SQL Seed 预置：
  - GIS 需求分析
  - 知识检索
  - 技术架构生成
  - 数据治理方案
  - 实施计划
  - 风险分析
  - PPT 大纲生成
  - 项目总结

前端：

- Skill 列表区分系统预置和用户自建

验收：

- 初始化后能看到预置 Skill
- 至少一个 Skill 能直接运行

---

## 阶段四：项目 AI 工作流闭环

目标：从项目出发，完成真实 AI 需求分析和方案生成。

### 4.1 项目需求信息

数据库：

- 可以新增 `project_requirements`，或先使用项目扩展字段

后端：

- `PUT /api/projects/{id}/requirement`
- `GET /api/projects/{id}/requirement`

前端：

- 项目详情增加需求信息 Tab
- 表单字段：
  - 客户背景
  - 原始需求
  - 已有系统
  - 预算
  - 交付周期
  - 关键联系人

验收：

- 需求信息保存后刷新不丢失

### 4.2 需求分析运行

后端：

- `POST /api/projects/{id}/analysis/run`
- 调用需求分析 Skill
- 可选调用 IMA 检索
- 可选调用 LLM
- 分析结果入库

前端：

- 项目详情需求 Tab 增加“运行需求分析”
- 展示分析结果：
  - 客户目标
  - 关键需求
  - GIS 能力点
  - 风险点
  - 建议方案方向

验收：

- 点击按钮后后端真实执行 Skill
- 分析结果保存到数据库
- 刷新页面仍能看到分析结果

### 4.3 方案章节生成

数据库：

- 新增 `proposal_sections`

后端：

- `POST /api/projects/{id}/proposal/generate`
- `GET /api/projects/{id}/proposal`
- `PUT /api/projects/{id}/proposal/sections/{sectionId}`

前端：

- 项目详情增加方案产物 Tab
- 支持一键生成方案
- 支持章节编辑
- 支持重新生成单章节

验收：

- 能生成至少 5 个方案章节
- 每个章节可编辑保存

---

## 阶段五：流程编排闭环

目标：把多个 Skill 组合成 DAG，完成复杂项目任务。

### 5.1 Flow CRUD

数据库：

- 使用 `flows`
- 使用 `flow_nodes`
- 使用 `flow_edges`

后端：

- `POST /api/flows`
- `PUT /api/flows/{id}`
- `GET /api/flows`
- `GET /api/flows/{id}`
- `DELETE /api/flows/{id}`

前端：

- 流程列表
- 新建流程
- 保存流程基础信息

验收：

- 流程能创建、编辑、删除

### 5.2 DAG 执行引擎

后端：

- `POST /api/flows/{id}/execute`
- `GET /api/flows/{id}/executions`
- `GET /api/flow-executions/{id}`
- 实现拓扑排序
- 执行每个节点对应 Skill
- 节点输出写入上下文
- 执行记录写入 `flow_executions`

验收：

- 三个节点的流程能按顺序执行
- 执行失败能记录错误

### 5.3 前端流程编辑器

前端：

- 引入 React Flow
- 左侧 Skill 列表
- 中间画布
- 右侧节点参数面板
- 顶部保存、运行按钮

验收：

- 拖拽 Skill 到画布
- 连线
- 保存
- 运行
- 后端能按流程执行

---

## 阶段六：PPT 和交付物闭环

目标：把方案内容转成可编辑的 PPT 结构化内容。

### 6.1 PPT 大纲生成

数据库：

- 使用 `ppt_records`

后端：

- `POST /api/projects/{id}/ppt/outline/generate`
- `GET /api/projects/{id}/ppt`

前端：

- 项目详情增加 PPT Tab
- 支持生成 PPT 大纲
- 显示页列表

验收：

- 能生成 PPT 页标题和页面要点
- 结果入库

### 6.2 PPT 内容编辑器

后端：

- `PUT /api/ppt-records/{id}`
- 保存结构化页面内容

前端：

- 左侧页面列表
- 右侧页面内容编辑
- 支持页面标题、要点、讲稿、配图建议

验收：

- 编辑 PPT 页面内容后刷新不丢失

---

## 阶段七：日志和稳定性

目标：让系统出错可定位，执行过程可追踪。

### 7.1 统一日志系统

数据库：

- 使用 `system_logs`

后端：

- API 调用日志
- LLM 调用日志
- IMA 检索日志
- Skill 执行日志
- Flow 执行日志

前端：

- 日志页面
- 支持按模块筛选
- 支持按等级筛选
- 支持查看详情

验收：

- 运行 Skill 后能在日志页看到记录

### 7.2 异常处理完善

后端：

- 参数错误返回 `1000`
- 业务错误返回 `2000`
- 外部服务错误返回 `3000`
- 系统错误返回 `9999`

前端：

- 所有请求显示明确错误
- 不出现空白页

验收：

- 断开数据库或填错 API Key 时能看到明确错误

---

## 推荐下一步执行任务

下一步建议直接做：

## TODO-04：IMA 配置模块

原因：

- 它是知识库入口
- 方案生成必须依赖知识检索
- 后续 SkillExecutor 需要调用 IMA

具体执行顺序：

1. 新增 `AesUtil`
2. 完成 IMA 配置 CRUD 后端接口
3. 完成 IMA Mock 搜索接口
4. 前端设置页增加 IMA 配置 Tab
5. 支持新增、编辑、删除、测试连接、检索测试
6. 验证数据库密文存储
7. 验证前端真实可操作

完成标准：

- `ima_config` 表有真实记录
- API Key 不明文保存
- 前端能新增配置
- 前端能点击测试连接
- 前端能输入关键词执行检索测试

---

## 每个任务完成时必须输出的内容

每完成一个任务，需要给出：

- 修改了哪些后端文件
- 修改了哪些前端文件
- 新增或修改了哪些数据库表
- 如何启动
- 如何用 curl 验证
- 如何在浏览器验证
- 是否已提交 Git
- 是否已推送 GitHub

