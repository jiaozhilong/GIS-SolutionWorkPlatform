# GIS 解决方案 AI 工作平台

本项目按 `GIS-AI-Platform-Prompt.md` 逐步建设，目标是一个本地可运行、可维护、可扩展的 AI GIS 解决方案工作平台。

## 当前进度

- TODO-01: COMPLETE
- 已完成 Spring Boot 后端脚手架
- 已完成 React + TypeScript + Vite + Ant Design 前端脚手架
- 已打通前端真实调用后端 `/api/hello`
- 后端已通过 `mvn -DskipTests compile`
- 前端已通过 `npm run build`

## 环境要求

- JDK 11+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 15+

## 本地运行

### 1. 启动后端

```powershell
cd E:\codex\GIS-SolutionWorkPlatform\backend
$env:JAVA_HOME='D:\java\jdk\jdk11'
$env:Path="$env:JAVA_HOME\bin;D:\java\apache-maven-3.6.3\bin;$env:Path"
$env:DB_USERNAME='postgres'
$env:DB_PASSWORD='postgis'
mvn "-Dmaven.repo.local=E:\codex\GIS-SolutionWorkPlatform\.m2" spring-boot:run
```

后端默认启动在 `http://localhost:8080`。

验证：

```bash
curl http://localhost:8080/api/hello
```

期望返回：

```json
{"code":0,"message":"success","data":"Hello GIS Platform","requestId":"..."}
```

### 2. 启动前端

```bash
cd E:\codex\GIS-SolutionWorkPlatform\frontend
npm install
npm run dev
```

访问 `http://localhost:5173`，页面会通过 Vite Proxy 调用后端 `/api/hello` 并显示连接状态。

## 数据库

TODO-01 已配置 PostgreSQL 连接参数，TODO-02 会补齐完整 DDL、实体、Mapper 和启动初始化脚本。

默认连接：

- 数据库：`gis_platform`
- 用户名：`postgres`
- 密码：读取环境变量 `DB_PASSWORD`，未设置时默认 `postgis`

初始化数据库：

```powershell
$env:PGPASSWORD='postgis'
& 'D:\java\postgresql\bin\createdb.exe' -h localhost -p 5432 -U postgres gis_platform
```

后端启动时会自动执行 `backend/src/main/resources/db/init.sql`，创建项目、IMA配置、大模型配置、GitHub配置、Skill、Flow、模板、PPT记录和系统日志等基础表。

验证项目表读写：

```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test project\",\"customerName\":\"test customer\",\"industry\":\"smart city\"}"

curl http://localhost:8080/api/projects
```
