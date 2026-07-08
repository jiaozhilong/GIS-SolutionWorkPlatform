CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ima_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key_enc TEXT NOT NULL,
    kb_id VARCHAR(100),
    kb_name VARCHAR(200),
    kb_type VARCHAR(50),
    industry_tag VARCHAR(100),
    is_default SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS llm_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_base VARCHAR(500) NOT NULL,
    api_key_enc TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    temperature DOUBLE PRECISION DEFAULT 0.7,
    max_tokens INT DEFAULT 8192,
    system_prompt TEXT,
    timeout_seconds INT DEFAULT 120,
    usage_scene VARCHAR(50),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    token_enc TEXT NOT NULL,
    username VARCHAR(100),
    default_org VARCHAR(100),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    customer_name VARCHAR(200),
    industry VARCHAR(100),
    gis_domain VARCHAR(200),
    status VARCHAR(30) DEFAULT 'OPPORTUNITY',
    priority VARCHAR(10) DEFAULT 'P2',
    description TEXT,
    github_repo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_kb_links (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    kb_config_id VARCHAR(36) NOT NULL REFERENCES ima_config(id)
);

CREATE TABLE IF NOT EXISTS project_attachments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0.0',
    description TEXT,
    prompt_template TEXT NOT NULL,
    input_schema TEXT,
    output_schema TEXT,
    requires_ima SMALLINT DEFAULT 0,
    requires_llm SMALLINT DEFAULT 1,
    requires_github SMALLINT DEFAULT 0,
    ima_kb_ids TEXT,
    llm_config_id VARCHAR(36),
    timeout_seconds INT DEFAULT 60,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flows (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow_nodes (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL REFERENCES flows(id),
    skill_id VARCHAR(36) NOT NULL REFERENCES skills(id),
    node_name VARCHAR(200) NOT NULL,
    position_x DOUBLE PRECISION DEFAULT 0,
    position_y DOUBLE PRECISION DEFAULT 0,
    param_overrides TEXT,
    timeout_seconds INT,
    retry_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flow_edges (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL REFERENCES flows(id),
    source_node_id VARCHAR(36) NOT NULL REFERENCES flow_nodes(id),
    target_node_id VARCHAR(36) NOT NULL REFERENCES flow_nodes(id)
);

CREATE TABLE IF NOT EXISTS flow_executions (
    id VARCHAR(36) PRIMARY KEY,
    flow_id VARCHAR(36) NOT NULL REFERENCES flows(id),
    flow_version VARCHAR(20),
    project_id VARCHAR(36) REFERENCES projects(id),
    trigger_type VARCHAR(20) DEFAULT 'MANUAL',
    input_context TEXT,
    output_context TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    variables_json TEXT,
    is_system SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppt_records (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    title VARCHAR(200) NOT NULL,
    outline_json TEXT,
    content_json TEXT,
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_logs (
    id VARCHAR(36) PRIMARY KEY,
    module VARCHAR(100),
    action VARCHAR(100),
    ref_id VARCHAR(36),
    log_type VARCHAR(50),
    level VARCHAR(20) DEFAULT 'INFO',
    message TEXT,
    detail TEXT,
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS log_type VARCHAR(50);
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
