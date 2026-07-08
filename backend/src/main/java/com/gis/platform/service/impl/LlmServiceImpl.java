package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.LlmConfigReq;
import com.gis.platform.dto.response.LlmConfigVO;
import com.gis.platform.dto.response.LlmTestResult;
import com.gis.platform.entity.LlmConfig;
import com.gis.platform.entity.SystemLog;
import com.gis.platform.mapper.LlmConfigMapper;
import com.gis.platform.mapper.SystemLogMapper;
import com.gis.platform.service.LlmService;
import com.gis.platform.util.AesUtil;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class LlmServiceImpl implements LlmService {

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final LlmConfigMapper llmConfigMapper;
    private final SystemLogMapper systemLogMapper;
    private final ObjectMapper objectMapper;

    public LlmServiceImpl(LlmConfigMapper llmConfigMapper, SystemLogMapper systemLogMapper, ObjectMapper objectMapper) {
        this.llmConfigMapper = llmConfigMapper;
        this.systemLogMapper = systemLogMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public LlmConfigVO createConfig(LlmConfigReq req) {
        if (req.getApiKey() == null || req.getApiKey().trim().isEmpty()) {
            throw new IllegalArgumentException("新增大模型配置时 API Key 不能为空");
        }
        LlmConfig config = new LlmConfig();
        applyReq(config, req, true);
        config.setCreatedAt(LocalDateTime.now());
        llmConfigMapper.insert(config);
        return LlmConfigVO.from(config);
    }

    @Override
    public LlmConfigVO updateConfig(String id, LlmConfigReq req) {
        LlmConfig config = requireConfig(id);
        applyReq(config, req, false);
        llmConfigMapper.updateById(config);
        return LlmConfigVO.from(config);
    }

    @Override
    public List<LlmConfigVO> listConfigs() {
        return llmConfigMapper.selectList(new LambdaQueryWrapper<LlmConfig>().orderByDesc(LlmConfig::getCreatedAt))
                .stream()
                .map(LlmConfigVO::from)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteConfig(String id) {
        requireConfig(id);
        llmConfigMapper.deleteById(id);
    }

    @Override
    public LlmTestResult testConnection(String id) {
        LlmConfig config = requireConfig(id);
        long start = System.currentTimeMillis();
        LlmTestResult result = new LlmTestResult();
        try {
            String content = call(config, "You are a connection test assistant.", "Hello");
            result.setConnected(true);
            result.setMessage("连接成功");
            result.setResponsePreview(content == null ? "" : content.substring(0, Math.min(content.length(), 200)));
        } catch (Exception e) {
            result.setConnected(false);
            result.setMessage(e.getMessage());
        }
        result.setLatencyMs(System.currentTimeMillis() - start);
        return result;
    }

    @Override
    public String call(LlmConfig config, String systemPrompt, String userMessage) {
        long start = System.currentTimeMillis();
        String status = "SUCCESS";
        String detail = null;
        try {
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(defaultInt(config.getTimeoutSeconds(), 120), TimeUnit.SECONDS)
                    .readTimeout(defaultInt(config.getTimeoutSeconds(), 120), TimeUnit.SECONDS)
                    .writeTimeout(defaultInt(config.getTimeoutSeconds(), 120), TimeUnit.SECONDS)
                    .build();

            Map<String, Object> body = new HashMap<>();
            body.put("model", config.getModelName());
            body.put("temperature", defaultDouble(config.getTemperature(), 0.7));
            body.put("max_tokens", defaultInt(config.getMaxTokens(), 8192));
            body.put("messages", new Object[]{
                    message("system", defaultString(systemPrompt, defaultString(config.getSystemPrompt(), "You are a helpful assistant."))),
                    message("user", userMessage)
            });

            Request request = new Request.Builder()
                    .url(chatCompletionsUrl(config.getApiBase()))
                    .header("Authorization", "Bearer " + AesUtil.decrypt(config.getApiKeyEnc()))
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(objectMapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                String responseBody = response.body() == null ? "" : response.body().string();
                if (!response.isSuccessful()) {
                    throw new IllegalStateException("LLM API 调用失败: HTTP " + response.code() + " " + responseBody);
                }
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
                if (contentNode.isMissingNode() || contentNode.isNull()) {
                    throw new IllegalStateException("LLM API 响应缺少 choices[0].message.content");
                }
                detail = "model=" + config.getModelName();
                return contentNode.asText();
            }
        } catch (Exception e) {
            status = "FAILED";
            detail = e.getMessage();
            throw new IllegalStateException(e.getMessage(), e);
        } finally {
            writeLlmLog(config.getId(), status, detail, System.currentTimeMillis() - start);
        }
    }

    private LlmConfig requireConfig(String id) {
        LlmConfig config = llmConfigMapper.selectById(id);
        if (config == null) {
            throw new IllegalArgumentException("大模型配置不存在: " + id);
        }
        return config;
    }

    private void applyReq(LlmConfig config, LlmConfigReq req, boolean creating) {
        config.setName(req.getName());
        config.setApiBase(trimTrailingSlash(req.getApiBase()));
        if (req.getApiKey() != null && !req.getApiKey().trim().isEmpty()) {
            config.setApiKeyEnc(AesUtil.encrypt(req.getApiKey()));
        } else if (creating) {
            throw new IllegalArgumentException("API Key 不能为空");
        }
        config.setModelName(req.getModelName());
        config.setTemperature(defaultDouble(req.getTemperature(), 0.7));
        config.setMaxTokens(defaultInt(req.getMaxTokens(), 8192));
        config.setSystemPrompt(req.getSystemPrompt());
        config.setTimeoutSeconds(defaultInt(req.getTimeoutSeconds(), 120));
        config.setUsageScene(req.getUsageScene());
        config.setIsActive(defaultInt(req.getIsActive(), 1));
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new HashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String chatCompletionsUrl(String apiBase) {
        String base = trimTrailingSlash(apiBase);
        if (base.endsWith("/chat/completions")) {
            return base;
        }
        return base + "/chat/completions";
    }

    private void writeLlmLog(String refId, String status, String detail, long durationMs) {
        SystemLog log = new SystemLog();
        log.setModule("LLM");
        log.setAction("CHAT_COMPLETION");
        log.setRefId(refId);
        log.setLogType("LLM");
        log.setLevel("SUCCESS".equals(status) ? "INFO" : "ERROR");
        log.setMessage(status);
        log.setDetail(detail);
        log.setDurationMs(durationMs);
        log.setCreatedAt(LocalDateTime.now());
        systemLogMapper.insert(log);
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        String result = value.trim();
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    private Integer defaultInt(Integer value, Integer fallback) {
        return value == null ? fallback : value;
    }

    private Double defaultDouble(Double value, Double fallback) {
        return value == null ? fallback : value;
    }
}

