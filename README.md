# GIS Solution Work Platform

本项目是一个本地可运行的 GIS 解决方案 AI 工作平台，用于沉淀项目台账、配置知识库/大模型/GitHub 能力、管理 Skill、编排 Flow，并从项目流程结果生成方案和 PPT 结构化内容。

## 当前进度

- TODO-01 到 TODO-13 已完成核心闭环。
- 后端：Spring Boot 2.7、MyBatis-Plus、PostgreSQL、JWT 登录拦截。
- 前端：React 18、TypeScript、Vite、Ant Design、React Query。
- 已完成模块：项目管理、登录鉴权、IMA 配置、大模型配置、GitHub 配置、Skill 管理、Flow 编排、模板管理、PPT 内容编辑器、系统日志。

## 环境要求

- JDK 11+
- Maven 3.6+
- Node.js 18+
- PostgreSQL 15+
- Windows PowerShell

本地已有推荐路径：

- JDK：`D:\java\jdk\jdk11`
- Maven：`D:\java\apache-maven-3.6.3`
- PostgreSQL 工具：`D:\java\postgresql\bin`

## 数据库

默认连接配置在 `backend/src/main/resources/application.yml`：

- 地址：`localhost:5432`
- 数据库：`gis_platform`
- 用户名：`postgres`
- 密码：默认 `postgis`，也可通过环境变量 `DB_PASSWORD` 覆盖

首次运行前创建数据库：

```powershell
$env:PGPASSWORD='postgis'
& 'D:\java\postgresql\bin\createdb.exe' -h localhost -p 5432 -U postgres gis_platform
```

后端启动时会自动执行 `backend/src/main/resources/db/init.sql`，创建项目、用户、配置、Skill、Flow、模板、PPT 记录和系统日志等基础表。启动初始化还会创建默认管理员和预置 GIS 模板。

## 启动后端

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\backend
$env:JAVA_HOME='D:\java\jdk\jdk11'
$env:Path="$env:JAVA_HOME\bin;D:\java\apache-maven-3.6.3\bin;$env:Path"
$env:DB_USERNAME='postgres'
$env:DB_PASSWORD='postgis'
mvn "-Dmaven.repo.local=E:\codex\GIS-SolutionWorkPlatform\.m2" spring-boot:run
```

后端默认地址：`http://localhost:8080`

健康验证：

```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/hello'
```

期望返回：

```json
{
  "code": 0,
  "message": "success",
  "data": "Hello GIS Platform",
  "requestId": "..."
}
```

## 启动前端

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`

Vite 已配置 `/api` 代理到 `http://localhost:8080`。

## 登录账号

默认管理员：

```text
用户名：admin
密码：admin123
```

如果数据库里已经有用户，启动初始化不会覆盖现有用户。需要重置默认账号时，可先在数据库中处理 `users` 表，再重启后端。

## 功能路径

- `/login`：登录页，包含 GIS 3D 地球背景
- `/projects`：项目管理、项目详情、Flow 执行、PPT 内容生成与编辑
- `/skills`：Skill 管理、Prompt 模板、测试运行
- `/flows`：Flow 编排、节点边配置、流程执行
- `/templates`：GIS 行业模板管理
- `/logs`：系统日志查询
- `/users`：用户与权限管理，仅管理员可访问
- `/settings/ima`：IMA 知识库配置
- `/settings/llm`：大模型配置
- `/settings/github`：GitHub 配置

## 常用接口验证

登录并访问受保护接口：

```powershell
$login = Invoke-RestMethod `
  -Uri 'http://localhost:8080/api/auth/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"username":"admin","password":"admin123"}'

$token = $login.data.token

Invoke-RestMethod `
  -Uri 'http://localhost:8080/api/projects' `
  -Headers @{ Authorization = "Bearer $token" }
```

创建项目：

```powershell
Invoke-RestMethod `
  -Uri 'http://localhost:8080/api/projects' `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' `
  -Body '{"name":"自然资源一张图智能化升级方案","customerName":"某市自然资源局","industry":"自然资源","gisDomain":"时空数据治理"}'
```

查询模板：

```powershell
Invoke-RestMethod `
  -Uri 'http://localhost:8080/api/templates?type=PROPOSAL' `
  -Headers @{ Authorization = "Bearer $token" }
```

## 构建验证

后端编译：

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\backend
$env:JAVA_HOME='D:\java\jdk\jdk11'
$env:Path="$env:JAVA_HOME\bin;D:\java\apache-maven-3.6.3\bin;$env:Path"
mvn "-Dmaven.repo.local=E:\codex\GIS-SolutionWorkPlatform\.m2" -DskipTests compile
```

前端构建：

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\frontend
npm run build
```

## 常见问题

### 后端 package 提示 jar 无法重命名

如果看到类似 `Unable to rename ...jar to ...jar.original`，通常是已有 Java 进程正在运行旧 jar，占用了 `backend/target` 下的文件。先停止正在运行的后端，再执行：

```powershell
mvn "-Dmaven.repo.local=E:\codex\GIS-SolutionWorkPlatform\.m2" -DskipTests package
```

### 端口占用

检查 8080：

```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
```

检查 5173：

```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

### JDK 版本错误

本项目后端按 Java 11 编译。确认：

```powershell
java -version
mvn -version
```

如果版本不对，重新设置：

```powershell
$env:JAVA_HOME='D:\java\jdk\jdk11'
$env:Path="$env:JAVA_HOME\bin;D:\java\apache-maven-3.6.3\bin;$env:Path"
```

### 数据库连接失败

确认 PostgreSQL 已启动，且数据库存在：

```powershell
$env:PGPASSWORD='postgis'
& 'D:\java\postgresql\bin\psql.exe' -h localhost -p 5432 -U postgres -d gis_platform -c "select 1;"
```

### 前端 401 或自动跳回登录页

这是正常鉴权行为。除 `/api/hello`、登录、注册和 Swagger 相关路径外，`/api/**` 都需要 `Authorization: Bearer <token>`。浏览器中重新登录即可。

### Vite 端口变化

默认配置固定 `5173`。如果该端口被占用，Vite 可能提示失败或需要换端口；优先释放 5173，保证代理和访问路径一致。
