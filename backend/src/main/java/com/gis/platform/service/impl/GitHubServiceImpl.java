package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.GitHubConfigReq;
import com.gis.platform.dto.response.GitHubConfigVO;
import com.gis.platform.dto.response.GitHubFileContent;
import com.gis.platform.dto.response.GitHubTestResult;
import com.gis.platform.dto.response.GitHubTreeItem;
import com.gis.platform.entity.GitHubConfig;
import com.gis.platform.entity.SystemLog;
import com.gis.platform.mapper.GitHubConfigMapper;
import com.gis.platform.mapper.SystemLogMapper;
import com.gis.platform.service.GitHubService;
import com.gis.platform.util.AesUtil;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class GitHubServiceImpl implements GitHubService {
    private static final String GITHUB_API = "https://api.github.com";

    private final GitHubConfigMapper gitHubConfigMapper;
    private final SystemLogMapper systemLogMapper;
    private final ObjectMapper objectMapper;
    private final OkHttpClient client;

    public GitHubServiceImpl(GitHubConfigMapper gitHubConfigMapper, SystemLogMapper systemLogMapper, ObjectMapper objectMapper) {
        this.gitHubConfigMapper = gitHubConfigMapper;
        this.systemLogMapper = systemLogMapper;
        this.objectMapper = objectMapper;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    @Override
    public GitHubConfigVO createConfig(GitHubConfigReq req) {
        if (isBlank(req.getToken())) {
            throw new IllegalArgumentException("新增 GitHub 配置时 Token 不能为空");
        }
        GitHubConfig config = new GitHubConfig();
        applyReq(config, req, true);
        config.setCreatedAt(LocalDateTime.now());
        gitHubConfigMapper.insert(config);
        return GitHubConfigVO.from(config);
    }

    @Override
    public GitHubConfigVO updateConfig(String id, GitHubConfigReq req) {
        GitHubConfig config = requireConfig(id);
        applyReq(config, req, false);
        gitHubConfigMapper.updateById(config);
        return GitHubConfigVO.from(config);
    }

    @Override
    public List<GitHubConfigVO> listConfigs() {
        return gitHubConfigMapper.selectList(new LambdaQueryWrapper<GitHubConfig>().orderByDesc(GitHubConfig::getCreatedAt))
                .stream()
                .map(GitHubConfigVO::from)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteConfig(String id) {
        requireConfig(id);
        gitHubConfigMapper.deleteById(id);
    }

    @Override
    public GitHubTestResult testConnection(String id) {
        GitHubConfig config = requireConfig(id);
        long start = System.currentTimeMillis();
        GitHubTestResult result = new GitHubTestResult();
        try {
            GitHubResponse response = execute("GET", GITHUB_API + "/user", decryptToken(config), "application/vnd.github+json");
            JsonNode root = objectMapper.readTree(response.body);
            result.setConnected(true);
            result.setMessage("连接成功");
            result.setLogin(root.path("login").asText(config.getUsername()));
            result.setRateLimitRemaining(parseInt(response.rateLimitRemaining));
            writeLog("TEST_CONNECTION", config.getId(), "SUCCESS", "login=" + result.getLogin(), System.currentTimeMillis() - start);
        } catch (Exception e) {
            result.setConnected(false);
            result.setMessage(e.getMessage());
            writeLog("TEST_CONNECTION", config.getId(), "FAILED", e.getMessage(), System.currentTimeMillis() - start);
        }
        result.setLatencyMs(System.currentTimeMillis() - start);
        return result;
    }

    @Override
    public String readReadme(String owner, String repo) {
        long start = System.currentTimeMillis();
        try {
            String url = GITHUB_API + "/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/readme";
            GitHubResponse response = executePublicResource(url, "application/vnd.github.raw+json");
            writeLog("READ_README", owner + "/" + repo, "SUCCESS", null, System.currentTimeMillis() - start);
            return response.body;
        } catch (Exception e) {
            writeLog("READ_README", owner + "/" + repo, "FAILED", e.getMessage(), System.currentTimeMillis() - start);
            throw asBusinessException(e);
        }
    }

    @Override
    public List<GitHubTreeItem> readTree(String owner, String repo) {
        long start = System.currentTimeMillis();
        try {
            String branch = defaultBranch(owner, repo);
            String url = GITHUB_API + "/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/git/trees/" + encodePath(branch) + "?recursive=1";
            GitHubResponse response = executePublicResource(url, "application/vnd.github+json");
            JsonNode tree = objectMapper.readTree(response.body).path("tree");
            List<GitHubTreeItem> items = new ArrayList<>();
            if (tree.isArray()) {
                for (JsonNode node : tree) {
                    GitHubTreeItem item = new GitHubTreeItem();
                    item.setPath(node.path("path").asText());
                    item.setType(node.path("type").asText());
                    item.setSize(node.has("size") ? node.path("size").asLong() : null);
                    item.setSha(node.path("sha").asText());
                    item.setUrl(node.path("url").asText());
                    items.add(item);
                }
            }
            writeLog("READ_TREE", owner + "/" + repo, "SUCCESS", "count=" + items.size(), System.currentTimeMillis() - start);
            return items;
        } catch (Exception e) {
            writeLog("READ_TREE", owner + "/" + repo, "FAILED", e.getMessage(), System.currentTimeMillis() - start);
            throw asBusinessException(e);
        }
    }

    @Override
    public GitHubFileContent readFile(String owner, String repo, String path) {
        if (isBlank(path)) {
            throw new IllegalArgumentException("文件 path 不能为空");
        }
        long start = System.currentTimeMillis();
        try {
            String url = GITHUB_API + "/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/contents/" + encodeFilePath(path);
            GitHubResponse response = executePublicResource(url, "application/vnd.github+json");
            JsonNode root = objectMapper.readTree(response.body);
            if (!"file".equals(root.path("type").asText())) {
                throw new IllegalArgumentException("path 不是文件: " + path);
            }
            GitHubFileContent file = new GitHubFileContent();
            file.setOwner(owner);
            file.setRepo(repo);
            file.setPath(root.path("path").asText(path));
            file.setName(root.path("name").asText());
            file.setSha(root.path("sha").asText());
            file.setEncoding(root.path("encoding").asText());
            String content = root.path("content").asText("").replace("\n", "");
            if ("base64".equalsIgnoreCase(file.getEncoding())) {
                file.setContent(new String(Base64.getDecoder().decode(content), StandardCharsets.UTF_8));
            } else {
                file.setContent(root.path("content").asText(""));
            }
            writeLog("READ_FILE", owner + "/" + repo, "SUCCESS", path, System.currentTimeMillis() - start);
            return file;
        } catch (Exception e) {
            writeLog("READ_FILE", owner + "/" + repo, "FAILED", e.getMessage(), System.currentTimeMillis() - start);
            throw asBusinessException(e);
        }
    }

    private void applyReq(GitHubConfig config, GitHubConfigReq req, boolean creating) {
        config.setName(req.getName());
        if (!isBlank(req.getToken())) {
            config.setTokenEnc(AesUtil.encrypt(req.getToken().trim()));
        } else if (creating) {
            throw new IllegalArgumentException("Token 不能为空");
        }
        config.setUsername(req.getUsername());
        config.setDefaultOrg(req.getDefaultOrg());
        config.setIsActive(req.getIsActive() == null ? 1 : req.getIsActive());
    }

    private GitHubConfig requireConfig(String id) {
        GitHubConfig config = gitHubConfigMapper.selectById(id);
        if (config == null) {
            throw new IllegalArgumentException("GitHub 配置不存在: " + id);
        }
        return config;
    }

    private String defaultBranch(String owner, String repo) throws Exception {
        String url = GITHUB_API + "/repos/" + encodePath(owner) + "/" + encodePath(repo);
        GitHubResponse response = executePublicResource(url, "application/vnd.github+json");
        String branch = objectMapper.readTree(response.body).path("default_branch").asText();
        return isBlank(branch) ? "main" : branch;
    }

    private String activeToken() {
        GitHubConfig config = gitHubConfigMapper.selectOne(new LambdaQueryWrapper<GitHubConfig>()
                .eq(GitHubConfig::getIsActive, 1)
                .orderByDesc(GitHubConfig::getCreatedAt)
                .last("limit 1"));
        if (config == null || isBlank(config.getTokenEnc())) {
            return null;
        }
        return decryptToken(config);
    }

    private String decryptToken(GitHubConfig config) {
        return AesUtil.decrypt(config.getTokenEnc());
    }


    private GitHubResponse executePublicResource(String url, String accept) throws Exception {
        String token = activeToken();
        if (isBlank(token)) {
            return execute("GET", url, null, accept);
        }
        try {
            return execute("GET", url, token, accept);
        } catch (IllegalArgumentException e) {
            String message = e.getMessage() == null ? "" : e.getMessage();
            if (message.contains("HTTP 401") || message.contains("HTTP 403")) {
                return execute("GET", url, null, accept);
            }
            throw e;
        }
    }
    private GitHubResponse execute(String method, String url, String token, String accept) throws Exception {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .header("Accept", accept)
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("User-Agent", "GIS-SolutionWorkPlatform");
        if (!isBlank(token)) {
            builder.header("Authorization", "Bearer " + token);
        }
        if ("GET".equalsIgnoreCase(method)) {
            builder.get();
        }
        try (Response response = client.newCall(builder.build()).execute()) {
            String body = response.body() == null ? "" : response.body().string();
            if (!response.isSuccessful()) {
                throw new IllegalArgumentException("GitHub API 调用失败: HTTP " + response.code() + " " + compact(body));
            }
            GitHubResponse result = new GitHubResponse();
            result.body = body;
            result.rateLimitRemaining = response.header("X-RateLimit-Remaining");
            return result;
        }
    }

    private void writeLog(String action, String refId, String status, String detail, long durationMs) {
        SystemLog log = new SystemLog();
        log.setModule("GITHUB");
        log.setAction(action);
        log.setRefId(refId);
        log.setLogType("GITHUB");
        log.setLevel("SUCCESS".equals(status) ? "INFO" : "ERROR");
        log.setMessage(status);
        log.setDetail(detail);
        log.setDurationMs(durationMs);
        log.setCreatedAt(LocalDateTime.now());
        systemLogMapper.insert(log);
    }

    private IllegalArgumentException asBusinessException(Exception e) {
        if (e instanceof IllegalArgumentException) {
            return (IllegalArgumentException) e;
        }
        return new IllegalArgumentException(e.getMessage(), e);
    }

    private String encodePath(String value) {
        if (isBlank(value) || value.contains("/") || value.contains("..")) {
            throw new IllegalArgumentException("owner/repo 参数不合法");
        }
        return value.trim();
    }

    private String encodeFilePath(String path) {
        String normalized = path.trim().replace("\\", "/");
        if (normalized.startsWith("/") || normalized.contains("..")) {
            throw new IllegalArgumentException("文件 path 参数不合法");
        }
        String[] parts = normalized.split("/");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (isBlank(part)) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append('/');
            }
            builder.append(part);
        }
        return builder.toString();
    }

    private String compact(String value) {
        if (value == null) {
            return "";
        }
        String compacted = value.replace('\n', ' ').replace('\r', ' ').trim();
        return compacted.length() > 500 ? compacted.substring(0, 500) : compacted;
    }

    private Integer parseInt(String value) {
        try {
            return value == null ? null : Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static class GitHubResponse {
        private String body;
        private String rateLimitRemaining;
    }
}
