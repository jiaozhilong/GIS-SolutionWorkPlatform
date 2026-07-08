# GIS 解决方案 AI 工作平台 — Codex 开发提示词

> **运行环境：** Codex (OpenAI CLI Agent)
> **后端：** Java 17 + Spring Boot 3.x
> **前端：** React 18 + TypeScript + Ant Design 5.x
> **数据库：** PostgreSQL（本地）
> **知识库：** IMA Skills API（API Key 接入）

---

## TODO TRACKING

每完成一个 TODO 请更新状态：`STATUS: PENDING → IN_PROGRESS → COMPLETE`

```
TODO-01: [PENDING] 项目脚手架 — Maven多模块 + Spring Boot + Vite + PostgreSQL 初始化
TODO-02: [PENDING] 数据库 — 建表SQL + MyBatis-Plus实体 + 初始化脚本
TODO-03: [PENDING] 项目管理 — CRUD接口 + 前端列表/详情页
TODO-04: [PENDING] IMA配置模块 — 配置页 + 连接测试 + 检索测试
TODO-05: [PENDING] 大模型配置模块 — 配置页 + 连接测试
TODO-06: [PENDING] GitHub配置模块 — 配置页 + 仓库文件读取
TODO-07: [PENDING] Skill管理 — CRUD + Prompt模板 + 测试运行
TODO-08: [PENDING] 流程编排 — DAG编辑器 + 执行引擎
TODO-09: [PENDING] 流程集成 — 需求分析/方案生成/PPT生成/项目总结
TODO-10: [PENDING] 日志系统 — 统一日志表 + 前端查看页
TODO-11: [PENDING] 模板管理 — GIS行业模板CRUD
TODO-12: [PENDING] PPT内容编辑器 — 结构化编辑 + 流程集成
TODO-13: [PENDING] README — 本地运行说明
```

---

## CRITICAL RULES — 必须遵守

1. **不写 Demo。** 每个功能必须有真实后端接口 + PostgreSQL持久化 + 前端真实调用。
2. **不造假数据。** 列表数据来自PostgreSQL，配置来自PostgreSQL，方案/PPT内容来自大模型真实生成。
3. **不自建知识库。** 不做向量库、不做文档切片和Embedding。知识检索通过 IMA Skills API。
4. **不硬编码密钥。** 所有 API Key/Token 通过配置页输入 → 后端 AES 加密存PostgreSQL → 前端不暴露明文。
5. **分层架构。** 后端：Controller → Service → Mapper(DAO)；前端：Page → hooks → api/。
6. **每完成一个 TODO 必须给出验证方式。** 具体到 curl 命令或浏览器操作步骤。
7. **先做最小可用，再迭代。** 不要一口气生成15个模块的全部代码。

---

## 一、技术栈（已调整为Java后端）

### 后端

| 组件 | 选型 | 说明 |
|------|------|------|
| 框架 | Spring Boot 3.2+ | JDK 17 |
| 构建 | Maven | 多模块：`backend/pom.xml` |
| ORM | MyBatis-Plus 3.5+ | LambdaQueryWrapper，自动填充 |
| 数据库 | PostgreSQL | 驱动 `org.postgresql:postgresql:42.7+` |
| API文档 | Knife4j (Swagger) | `/doc.html` 在线调试 |
| HTTP客户端 | OkHttp 4 | 调用 IMA / LLM / GitHub 外部API |
| JSON | Jackson | Spring Boot 默认 |
| 加密 | AES (javax.crypto) | API Key 加密存储 |
| 工具 | Hutool 5.8+ | IdUtil、StrUtil、DateUtil |
| 校验 | Jakarta Validation | @Valid + @NotBlank 等 |

**Maven 关键依赖：**
```xml
spring-boot-starter-web, spring-boot-starter-validation,
mybatis-plus-boot-starter, postgresql,
knife4j-openapi3, okhttp, hutool-all, lombok, jackson-databind
```

### 前端（不变）

| 组件 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript + Vite |
| UI库 | Ant Design 5.x + @ant-design/pro-components |
| 状态 | Zustand |
| 请求 | axios + @tanstack/react-query |
| 路由 | React Router v6 |
| 样式 | Tailwind CSS + AntD ConfigProvider Token |
| Markdown | react-markdown + remark-gfm |

---

## 二、IMA 接入说明（重要修正）

**IMA 不是传统 REST API，是通过 API Key + IMA Skills SDK 接入。** 本平台的后端封装一层 IMA 调用抽象：

```
┌──────────┐    ┌──────────────────┐    ┌─────────────┐
│  前端     │───▶│  Java 后端        │───▶│ IMA Skills  │
│ (React)  │    │  ImaService.java  │    │ API/SDK     │
└──────────┘    │  (API Key认证)    │    └─────────────┘
                └──────────────────┘
```

**IMA 配置表 `ima_config`：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| name | VARCHAR(100) | 配置名称 |
| api_key_enc | TEXT | AES加密后的API Key |
| kb_id | VARCHAR(100) | 知识库ID |
| kb_name | VARCHAR(200) | 知识库名称 |
| kb_type | VARCHAR(50) | mine/shared/subscribed |
| industry_tag | VARCHAR(100) | 行业标签(智慧城市等) |
| is_default | TINYINT | 是否默认 |
| is_active | TINYINT | 是否启用 |
| created_at | DATETIME |  |

**`ImaService.java` 核心方法签名：**
```java
// 检索知识库
ImaSearchResult search(String kbId, String query, ImaSearchFilter filter);

// 获取知识列表
List<KnowledgeItem> listKnowledge(String kbId, int page, int size);

// 获取知识内容
KnowledgeContent getContent(String kbId, String knowledgeId);

// 测试连接
boolean testConnection(String apiKey, String kbId);
```

> **Codex 注意：** IMA 的具体调用方式和 SDK 由龙哥在实际开发时提供。
> 你先把 `ImaService` 写成接口 + 默认实现，默认实现的检索方法先返回 Mock 结果（但标注 `// TODO: 接入真实IMA SDK`），
> 这样其他模块可以先开发前进，等龙哥给出 SDK 后替换即可。

---

## 三、后端目录结构（Java版）

```
backend/
├── pom.xml                          # Maven 父POM
├── src/main/java/com/gis/platform/
│   ├── GisPlatformApplication.java  # Spring Boot 入口
│   ├── config/
│   │   ├── WebConfig.java           # CORS + 拦截器
│   │   ├── MyBatisPlusConfig.java   # 分页插件 + 自动填充
│   │   ├── Knife4jConfig.java       # Swagger配置
│   │   └── ExecutorConfig.java      # 线程池(流程并行执行)
│   ├── controller/                   # ===== 控制器层 =====
│   │   ├── ProjectController.java
│   │   ├── ImaController.java
│   │   ├── LlmController.java
│   │   ├── SkillController.java
│   │   ├── FlowController.java
│   │   ├── GitHubController.java
│   │   ├── TemplateController.java
│   │   └── LogController.java
│   ├── service/                      # ===== 业务服务层 =====
│   │   ├── ProjectService.java
│   │   ├── ImaService.java           # 接口
│   │   ├── impl/
│   │   │   ├── ImaServiceImpl.java   # 实现(Mock→真实SDK)
│   │   │   ├── LlmServiceImpl.java
│   │   │   ├── SkillServiceImpl.java
│   │   │   ├── FlowEngineImpl.java
│   │   │   ├── GitHubServiceImpl.java
│   │   │   └── LogServiceImpl.java
│   │   └── SkillExecutor.java        # Skill执行核心
│   ├── mapper/                       # ===== MyBatis-Plus Mapper =====
│   │   ├── ProjectMapper.java
│   │   ├── ImaConfigMapper.java
│   │   ├── LlmConfigMapper.java
│   │   ├── SkillMapper.java
│   │   ├── FlowMapper.java
│   │   ├── FlowNodeMapper.java
│   │   ├── FlowEdgeMapper.java
│   │   ├── FlowExecutionMapper.java
│   │   ├── GitHubConfigMapper.java
│   │   ├── TemplateMapper.java
│   │   └── LogMapper.java
│   ├── entity/                       # ===== 实体类 =====
│   │   ├── Project.java
│   │   ├── ImaConfig.java
│   │   ├── LlmConfig.java
│   │   ├── Skill.java
│   │   ├── Flow.java
│   │   ├── FlowNode.java
│   │   ├── FlowEdge.java
│   │   ├── FlowExecution.java
│   │   ├── GitHubConfig.java
│   │   ├── Template.java
│   │   └── SystemLog.java
│   ├── dto/                          # ===== 请求/响应DTO =====
│   │   ├── request/                  # 请求体
│   │   │   ├── ProjectReq.java
│   │   │   ├── ImaSearchReq.java
│   │   │   ├── LlmConfigReq.java
│   │   │   ├── SkillReq.java
│   │   │   └── FlowReq.java
│   │   └── response/                 # 响应体
│   │       ├── ApiResult.java        # 统一响应 {code,message,data}
│   │       ├── PageResult.java       # 分页响应
│   │       └── ProjectVO.java
│   └── util/
│       ├── AesUtil.java              # AES加密工具
│       └── OkHttpUtil.java           # HTTP客户端封装
├── src/main/resources/
│   ├── application.yml               # Spring Boot配置
│   ├── db/
│   │   └── init.sql                  # 建表SQL
│   └── mapper/                       # MyBatis XML(如需复杂SQL)
└── src/test/java/com/gis/platform/
    └── ProjectServiceTest.java
```

---

## 四、前端目录结构（不变，适配Java后端）

```
frontend/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                   # 后端调用（baseURL指向 localhost:8080/api）
│   │   ├── client.ts          # axios配置 + 拦截器
│   │   ├── projects.ts
│   │   ├── ima.ts
│   │   ├── llm.ts
│   │   ├── skills.ts
│   │   ├── flows.ts
│   │   ├── github.ts
│   │   └── templates.ts
│   ├── hooks/                 # react-query hooks
│   │   ├── useProjects.ts
│   │   ├── useSkills.ts
│   │   └── useFlowExecution.ts
│   ├── stores/
│   │   └── appStore.ts        # Zustand
│   ├── pages/
│   │   ├── layout/
│   │   │   └── MainLayout.tsx # 侧边栏 + 顶栏 + 内容区
│   │   ├── ProjectList/
│   │   ├── ProjectDetail/
│   │   ├── SkillManager/
│   │   ├── FlowEditor/        # React Flow 拖拽画布
│   │   ├── PPTEditor/
│   │   ├── Settings/          # IMA/LLM/GitHub配置
│   │   └── Logs/
│   ├── components/
│   │   ├── common/            # LoadingSkeleton, EmptyState, ErrorResult
│   │   └── project/           # ProjectCard等
│   ├── types/
│   └── utils/
├── vite.config.ts             # proxy: /api → localhost:8080
├── tailwind.config.ts
└── package.json
```

---

## 五、数据库设计（PostgreSQL 建表）

### 完整建表 DDL

```sql
-- ===== 1. 用户表 =====
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 2. IMA配置表 =====
CREATE TABLE ima_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key_enc TEXT NOT NULL,          -- AES加密的API Key
    kb_id VARCHAR(100),
    kb_name VARCHAR(200),
    kb_type VARCHAR(50),                -- mine/shared/subscribed
    industry_tag VARCHAR(100),          -- 智慧城市/自然资源/水利环保
    is_default SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 3. 大模型配置表 =====
CREATE TABLE llm_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_base VARCHAR(500) NOT NULL,     -- https://api.deepseek.com/v1
    api_key_enc TEXT NOT NULL,          -- AES加密
    model_name VARCHAR(100) NOT NULL,   -- deepseek-chat
    temperature DOUBLE PRECISION DEFAULT 0.7,
    max_tokens INT DEFAULT 8192,
    system_prompt TEXT,                 -- 默认System Prompt
    timeout_seconds INT DEFAULT 120,
    usage_scene VARCHAR(50),            -- analysis/generation/summary
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 4. GitHub配置表 =====
CREATE TABLE github_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    token_enc TEXT NOT NULL,            -- AES加密的GitHub Token
    username VARCHAR(100),
    default_org VARCHAR(100),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 5. 项目表 =====
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    customer_name VARCHAR(200),
    industry VARCHAR(100),              -- 智慧城市/自然资源/智慧交通等
    gis_domain VARCHAR(200),            -- GIS细分领域：时空大数据/CIM/遥感等
    status VARCHAR(30) DEFAULT 'OPPORTUNITY', -- OPPORTUNITY/ANALYSIS/PROPOSAL/BIDDING/SIGNED/DELIVERY/CLOSED
    priority VARCHAR(10) DEFAULT 'P2',  -- P0/P1/P2/P3
    description TEXT,
    github_repo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 6. 项目-知识库关联表（多对多）=====
CREATE TABLE project_kb_links (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    kb_config_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (kb_config_id) REFERENCES ima_config(id)
);

-- ===== 7. 项目附件表 =====
CREATE TABLE project_attachments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,    -- 本地文件路径
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ===== 8. Skill表 =====
CREATE TABLE skills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,          -- requirement_analysis/ima_search/proposal_outline/tech_architecture/risk_analysis/ppt_outline/ppt_content/bid_response/project_summary
    category VARCHAR(100),               -- analysis/generation/summary/retrieval
    version VARCHAR(20) DEFAULT '1.0.0',
    description TEXT,
    prompt_template TEXT NOT NULL,       -- 支持 {{variable}} 变量替换
    input_schema TEXT,                   -- JSON Schema
    output_schema TEXT,                  -- JSON Schema
    requires_ima SMALLINT DEFAULT 0,
    requires_llm SMALLINT DEFAULT 1,
    requires_github SMALLINT DEFAULT 0,
    ima_kb_ids TEXT,                     -- JSON数组，关联的知识库ID
    llm_config_id VARCHAR(36),
    timeout_seconds INT DEFAULT 60,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE/DRAFT/DEPRECATED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 9. 流程表 =====
CREATE TABLE flows (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),              -- requirement/proposal/ppt/summary
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 10. 流程节点表 =====
CREATE TABLE flow_nodes (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL,
    skill_id VARCHAR(36) NOT NULL,
    node_name VARCHAR(200) NOT NULL,
    position_x DOUBLE PRECISION DEFAULT 0,   -- 前端画布坐标
    position_y DOUBLE PRECISION DEFAULT 0,
    param_overrides TEXT,                    -- JSON，覆盖Skill默认参数
    timeout_seconds INT,
    retry_count INT DEFAULT 0,
    FOREIGN KEY (flow_id) REFERENCES flows(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- ===== 11. 流程边表 =====
CREATE TABLE flow_edges (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL,
    source_node_id VARCHAR(36) NOT NULL,
    target_node_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (flow_id) REFERENCES flows(id),
    FOREIGN KEY (source_node_id) REFERENCES flow_nodes(id),
    FOREIGN KEY (target_node_id) REFERENCES flow_nodes(id)
);

-- ===== 12. 流程执行记录表 =====
CREATE TABLE flow_executions (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL,
    flow_version VARCHAR(20),
    project_id VARCHAR(36),             -- 关联项目
    trigger_type VARCHAR(20) DEFAULT 'MANUAL',
    input_context TEXT,                 -- JSON
    output_context TEXT,                -- JSON
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING/RUNNING/COMPLETED/FAILED
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 14. 模板表 =====
CREATE TABLE templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,          -- requirement/proposal/ppt/bid/summary/prompt
    category VARCHAR(100),               -- smart_city/natural_resource/transport/water
    content TEXT NOT NULL,               -- 模板内容，支持 {{variable}}
    variables_json TEXT,                 -- 变量定义列表
    is_system SMALLINT DEFAULT 0,       -- 系统预置模板
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 15. PPT生成记录表 =====
CREATE TABLE ppt_records (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    flow_execution_id VARCHAR(36),
    title VARCHAR(500),
    template_id VARCHAR(36),
    slides_json TEXT,                   -- JSON，所有Slide的内容
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 16. 统一日志表 =====
CREATE TABLE system_logs (
    id VARCHAR(36) PRIMARY KEY,
    log_type VARCHAR(30) NOT NULL,       -- IMA/LLM/SKILL/FLOW/GITHUB/USER/SYSTEM
    log_level VARCHAR(10) DEFAULT 'INFO', -- INFO/WARN/ERROR
    source_id VARCHAR(36),               -- 关联的业务ID
    request_summary TEXT,                -- 请求摘要
    response_summary TEXT,               -- 响应摘要
    duration_ms BIGINT,                  -- 耗时(毫秒)
    success SMALLINT DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 索引 =====
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_customer ON projects(customer_name);
CREATE INDEX idx_skills_type ON skills(type);
CREATE INDEX idx_flows_category ON flows(category);
CREATE INDEX idx_system_logs_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_created ON system_logs(created_at);
CREATE INDEX idx_flow_executions_project ON flow_executions(project_id);
CREATE INDEX idx_ppt_records_project ON ppt_records(project_id);
```

---

## 六、统一响应格式

```java
// ApiResult.java
public class ApiResult<T> {
    private int code;        // 0=成功, 1000~=参数错误, 2000~=业务错误, 3000~=外部服务错误, 9999=系统错误
    private String message;
    private T data;
    private String requestId;  // UUID

    public static <T> ApiResult<T> ok(T data) { ... }
    public static <T> ApiResult<T> fail(int code, String message) { ... }
}
```

### 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<?> handleValidation(MethodArgumentNotValidException e) { ... }

    @ExceptionHandler(Exception.class)
    public ApiResult<?> handleException(Exception e) { ... }
}
```

---

## 七、开发执行计划（逐模块）

### TODO-01: 项目脚手架

**目标：** 前后端能启动，前端能调通后端一个 Hello 接口。

**后端文件清单：**
```
backend/pom.xml
backend/src/main/java/com/gis/platform/GisPlatformApplication.java
backend/src/main/java/com/gis/platform/config/WebConfig.java
backend/src/main/resources/application.yml
```

**`application.yml` 关键内容：**
```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/gis_platform
    driver-class-name: org.postgresql.Driver
    username: postgres
    password: ${DB_PASSWORD:postgres}
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: assign_uuid
      logic-delete-field: deleted
knife4j:
  enable: true
```

**前端文件清单：**
```
frontend/package.json
frontend/vite.config.ts        # proxy: /api -> http://localhost:8080
frontend/src/main.tsx
frontend/src/App.tsx
```

**验证：**
```bash
# 后端
cd backend && mvn spring-boot:run
curl http://localhost:8080/api/hello

# 前端
cd frontend && npm install && npm run dev
# 浏览器访问 http://localhost:5173
# 前端调用 /api/hello 能显示后端返回
```

**完成标准：** `curl http://localhost:8080/api/hello` 返回 `{"code":0,"data":"Hello GIS Platform"}`

---

### TODO-02: 数据库初始化

**目标：** 执行建表SQL，MyBatis-Plus能读写数据。

**文件清单：**
- `backend/src/main/resources/db/init.sql` — 上面的完整DDL
- 所有 `entity/` 实体类（使用 `@TableName` 注解）
- 一个 `DatabaseInitializer.java` — Spring Boot启动时自动执行 init.sql

**验证：**
```bash
# 确认数据库和表已创建
psql -U postgres -d gis_platform -c "\dt"
# 应列出所有表：users, ima_config, llm_config, projects, skills, flows 等

# curl 测试项目表写入
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","customerName":"测试客户","industry":"智慧城市"}'
# 期望返回 code=0
```

---

### TODO-03: 项目管理 CRUD

**目标：** 完整的项目增删改查 + 前端列表页 + 详情页。

**后端文件清单：**
- `entity/Project.java`
- `mapper/ProjectMapper.java`
- `service/ProjectService.java` (接口)
- `service/impl/ProjectServiceImpl.java`
- `controller/ProjectController.java`
- `dto/request/ProjectReq.java`
- `dto/response/ProjectVO.java`

**API接口：**
```
POST   /api/projects              # 新建
PUT    /api/projects/{id}         # 编辑
DELETE /api/projects/{id}         # 删除
GET    /api/projects/{id}         # 详情
GET    /api/projects              # 列表（?keyword=&status=&industry=&page=1&size=10）
```

**前端页面：**
```
frontend/src/pages/ProjectList/index.tsx    # 搜索+表格+分页+新建按钮
frontend/src/pages/ProjectDetail/index.tsx  # 多Tab：基本信息/需求/方案/PPT/GitHub/附件
frontend/src/api/projects.ts               # axios封装
frontend/src/hooks/useProjects.ts          # react-query hooks
```

**前端必须实现三种状态：**
1. Loading → Ant Design Skeleton 骨架屏
2. Empty → 自定义空状态（插画 + "创建第一个GIS项目" + 按钮）
3. Error → 错误提示 + 重试按钮

**验证：**
```bash
# 完整CRUD测试
curl -X POST http://localhost:8080/api/projects -H "Content-Type: application/json" \
  -d '{"name":"XX市智慧城市时空平台","customerName":"XX市大数据局","industry":"智慧城市","gisDomain":"时空大数据","priority":"P1"}'

curl http://localhost:8080/api/projects?keyword=智慧城市&page=1&size=10

curl -X PUT http://localhost:8080/api/projects/{id} -H "Content-Type: application/json" \
  -d '{"status":"ANALYSIS"}'

# 前端验证：浏览器操作 → 新建项目 → 列表中看到 → 点击进入详情 → 编辑保存 → 刷新仍在
```

---

### TODO-04: IMA 配置模块

**目标：** 配置IMA知识库连接，测试连接，执行检索。

**后端文件清单：**
- `entity/ImaConfig.java`
- `mapper/ImaConfigMapper.java`
- `service/ImaService.java` — 接口，定义核心方法
- `service/impl/ImaServiceImpl.java` — 实现（当前Mock，待替换）
- `controller/ImaController.java`
- `dto/request/ImaSearchReq.java`

**API接口：**
```
POST   /api/ima/config             # 保存IMA配置（API Key加密存储）
PUT    /api/ima/config/{id}        # 修改配置
GET    /api/ima/config             # 配置列表
DELETE /api/ima/config/{id}        # 删除配置
POST   /api/ima/config/{id}/test   # 测试连接
POST   /api/ima/search             # 知识库检索
```

**`ImaServiceImpl` Mock实现关键点：**
```java
@Service
public class ImaServiceImpl implements ImaService {

    @Override
    public ImaSearchResult search(String kbId, String query, ImaSearchFilter filter) {
        // TODO: 替换为真实IMA SDK调用
        // 当前Mock返回模拟结果，让前后端流程先跑通
        ImaSearchResult result = new ImaSearchResult();
        result.setQuery(query);
        result.setTotalFound(3);
        result.setItems(List.of(
            new ImaSearchItem("doc-001", "智慧城市时空大数据平台技术方案.pdf", "PDF", 0.95, "kb-001", "GIS方案库"),
            // ...
        ));
        return result;
    }
}
```

**前端页面：** `frontend/src/pages/Settings/ImaConfig.tsx`
- 配置列表（表格）
- 新建/编辑（Modal表单，API Key输入框 type=password）
- 连接测试按钮（显示连接结果）

**验证：**
```bash
curl -X POST http://localhost:8080/api/ima/config \
  -H "Content-Type: application/json" \
  -d '{"name":"GIS方案库","apiKey":"ima-sk-xxx","kbId":"kb-001","kbName":"GIS方案库","kbType":"mine"}'

curl -X POST http://localhost:8080/api/ima/config/{id}/test
# 期望返回连接测试结果

curl -X POST http://localhost:8080/api/ima/search \
  -H "Content-Type: application/json" \
  -d '{"kbIds":["kb-001"],"query":"智慧城市时空大数据平台"}'
# 期望返回检索结果列表
```

---

### TODO-05: 大模型配置模块

**目标：** 配置大模型连接，测试连接。

**API接口：**
```
POST   /api/llm/config             # 保存配置（API Key加密）
PUT    /api/llm/config/{id}
GET    /api/llm/config
DELETE /api/llm/config/{id}
POST   /api/llm/config/{id}/test   # 发送最小化请求测试
```

**`LlmServiceImpl` 核心实现：**
```java
@Override
public LlmResponse call(LlmConfig config, String systemPrompt, String userMessage) {
    // 使用OkHttp发送 OpenAI-Compatible Chat Completions 请求
    // POST {api_base}/chat/completions
    // Body: {model, messages: [{role:"system",content},{role:"user",content}], temperature, max_tokens}
    // 记录调用日志到 system_logs
}
```

**验证：**
```bash
curl -X POST http://localhost:8080/api/llm/config \
  -H "Content-Type: application/json" \
  -d '{"name":"DeepSeek","apiBase":"https://api.deepseek.com/v1","apiKey":"sk-xxx","modelName":"deepseek-chat","temperature":0.7}'

curl -X POST http://localhost:8080/api/llm/config/{id}/test
# 期望返回延迟和连通状态
```

---

### TODO-06: GitHub 配置模块

**目标：** 配置GitHub Token，读取公共仓库文件树和内容。

**API接口：**
```
POST   /api/github/config
PUT    /api/github/config/{id}
GET    /api/github/config
DELETE /api/github/config/{id}
POST   /api/github/config/{id}/test     # 验证Token有效
GET    /api/github/repos/{owner}/{repo}/tree    # 文件树
GET    /api/github/repos/{owner}/{repo}/readme  # README（渲染为Markdown）
GET    /api/github/repos/{owner}/{repo}/file?path=xxx  # 文件内容
```

**实现方式：** OkHttp 调用 GitHub REST API v3，Token → `Authorization: Bearer {token}`

**验证：**
```bash
curl http://localhost:8080/api/github/repos/openlayers/openlayers/readme
# 期望返回README Markdown内容
```

---

### TODO-07: Skill 管理

**目标：** Skill CRUD + Prompt模板变量替换 + 测试运行。

**API接口：**
```
POST   /api/skills
PUT    /api/skills/{id}
GET    /api/skills                  # 列表（?type=&category=&status=）
GET    /api/skills/{id}
DELETE /api/skills/{id}
POST   /api/skills/{id}/test        # 测试运行（输入参数 → 替换模板 → 调用LLM → 返回结果）
```

**Skill测试运行流程：**
```
1. 用户点击「测试运行」→ 输入测试参数JSON
2. POST /api/skills/{id}/test {params: {...}}
3. 后端 SkillExecutor：
   a. 取Skill的prompt_template，用params替换 {{variable}}
   b. 如果 requires_ima=true → 先调ImaService.search()
   c. 如果 requires_llm=true → 调LlmServiceImpl.call() 传入替换后的Prompt
   d. 如果 requires_github=true → 调GitHubService
   e. 记录执行日志到 system_logs
   f. 返回结果
```

**前端页面：**
- Skill列表页（卡片或表格）
- Skill编辑页（Prompt模板编辑器用 CodeMirror/TextArea）
- 测试运行面板（输入参数 → 展示 LLM Streaming 输出 → 展示最终结果）

**预置 GIS Skill（系统初始化时 Seed）：**
1. GIS需求分析 — 分析客户需求，提取关键词和技术栈
2. IMA知识检索 — 封装知识库检索
3. 竞品分析 — 检索竞品资料 + 对比分析
4. 技术架构生成 — 生成GIS平台技术架构方案
5. 数据治理方案 — GIS数据标准、共享方案
6. 实施计划 — 分期实施计划
7. 风险分析 — GIS项目特有风险
8. PPT大纲生成 — 结构化大纲
9. PPT内容生成 — 每页内容
10. 项目总结 — 综合总结报告

---

### TODO-08: 流程编排

**目标：** 前端拖拽画布 + 后端DAG执行引擎。

**前端：** `frontend/src/pages/FlowEditor/`
- 使用 `reactflow` 库实现 DAG 画布
- 左侧Skill列表可拖拽到画布
- 节点可连线
- 选中节点可在右侧面板配置参数覆盖
- 顶部工具栏：保存、运行

**后端执行引擎 `FlowEngineImpl`：**
```java
/**
 * 流程执行核心逻辑：
 * 1. 加载Flow的所有Node和Edge
 * 2. 构建DAG（Map<nodeId, List<depNodeIds>>）
 * 3. 拓扑排序，识别可并行执行的批次
 * 4. 使用线程池并行执行同批次节点
 * 5. 每个节点执行：
 *    a. 取Skill的prompt_template
 *    b. 用Context中的前驱节点输出 + param_overrides 替换变量
 *    c. 调用SkillExecutor执行
 *    d. 将输出写入Context
 * 6. 全部完成 → 写flow_executions记录
 */
```

**API接口：**
```
POST   /api/flows
PUT    /api/flows/{id}
GET    /api/flows
GET    /api/flows/{id}              # 含nodes和edges
DELETE /api/flows/{id}
POST   /api/flows/{id}/execute      # 执行流程 {projectId, inputContext}
GET    /api/flows/{id}/executions   # 历史执行记录
GET    /api/flow-executions/{id}/status  # 执行状态和进度
```

**验证：**
```bash
# 创建流程
curl -X POST http://localhost:8080/api/flows \
  -H "Content-Type: application/json" \
  -d '{"name":"GIS需求分析流程","category":"requirement"}'

# 添加节点
curl -X POST http://localhost:8080/api/flows/{flowId}/nodes \
  -d '{"skillId":"skill-001","nodeName":"需求分析","positionX":100,"positionY":100}'

# 执行流程
curl -X POST http://localhost:8080/api/flows/{flowId}/execute \
  -d '{"projectId":"proj-001","inputContext":{"requirement":"建设XX市智慧交通一张图平台"}}'
```

---

### TODO-09~12: 流程集成 + 日志 + 模板 + PPT编辑器

这些依赖 TODO-01 到 TODO-08 打好的基础，按顺序逐个完成。

---

### TODO-13: README 本地运行说明

```markdown
# GIS 解决方案 AI 工作平台

## 环境要求
- JDK 17+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 15+

## 本地运行

### 0. 准备数据库
```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE gis_platform;"
```

### 1. 启动后端
```bash
cd backend
# 首次运行会自动执行 init.sql 建表
mvn spring-boot:run
# 启动在 http://localhost:8080
# Swagger文档: http://localhost:8080/doc.html
```

### 2. 启动前端
```bash
cd frontend
npm install
npm run dev
# 启动在 http://localhost:5173
```

### 3. 初始配置
1. 打开 http://localhost:5173
2. 进入 设置 → IMA配置 → 添加知识库
3. 进入 设置 → 大模型配置 → 添加模型
4. 进入 设置 → GitHub配置 → 添加Token
```

---

## 八、UI/UX 设计系统（页面风格方案）

### 色系 — GIS 科技蓝

```typescript
// frontend/src/theme.ts — Ant Design ConfigProvider Token
const gisTheme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgLayout: '#f5f7fa',           // 页面底色 浅灰蓝
    borderRadius: 8,
    fontFamily: `-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`,
    fontSize: 14,
  },
  components: {
    Layout: { siderBg: '#001529', headerBg: '#ffffff', headerHeight: 56 },
    Menu: { darkItemBg: '#001529', darkItemSelectedBg: '#1677ff' },
    Card: { borderRadiusLG: 12 },
  },
};
```

### 布局

```
┌──────────────────────────────────────────────────────┐
│  Header (#fff, h=56)   Logo | 项目切换 | 用户         │
├────────┬─────────────────────────────────────────────┤
│ Side   │                                             │
│ Bar    │  PageHeader (面包屑 + 标题)                   │
│ 240px  ├─────────────────────────────────────────────┤
│        │  卡片 / 表格 / 图表 / Markdown                │
│ 仪表盘  │                                             │
│ 项目    │                                             │
│ 技能    │                                             │
│ 流程    │                                             │
│ PPT编辑 │                                             │
│ 模板    │                                             │
│ 设置    │                                             │
│ 日志    │                                             │
└────────┴─────────────────────────────────────────────┘
```

### 前端必须实现的三态

**每个页面都必须处理：**
1. **Loading** → Ant Design `<Skeleton>` 骨架屏（不要用全屏Spin）
2. **Empty** → 自定义空状态组件，包含：插画图标 + 引导语 + 操作按钮
3. **Error** → `<Result status="error">` + 错误信息 + 重试按钮

### 页面质感提升三板斧

1. **卡片 hover 上浮：** `className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md"`
2. **8px 间距栅格：** 全局间距用 8/16/24/32 这些值
3. **侧边栏图标必配：** 每个菜单项配 `<Icon>` 组件

---

## 九、禁止行为

- ❌ 硬编码任何 API Key / Token
- ❌ 自建向量库或文档切片
- ❌ 静态页面 + 假数据
- ❌ 一次性生成15个模块的全部代码
- ❌ 功能只有UI没有后端接口
- ❌ 忽略异常处理和日志

---

## 十、核心定位提醒

> 这个系统的本质是 **GIS 解决方案工作流平台**，不是聊天工具。
>
> - **IMA** = GIS行业知识来源
> - **大模型** = 分析和生成引擎
> - **Skills** = 可复用的能力单元（每个Skill是一个Prompt模板 + 参数）
> - **流程编排** = 把多个Skill组合成DAG完成复杂业务任务
> - **GitHub** = 项目资料和代码资产管理
>
> 每个功能开发时都要问自己：这个功能是在帮解决方案人员更快更好地完成 GIS 项目方案吗？
