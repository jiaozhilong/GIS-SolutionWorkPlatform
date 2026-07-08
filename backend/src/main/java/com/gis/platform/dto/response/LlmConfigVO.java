package com.gis.platform.dto.response;

import com.gis.platform.entity.LlmConfig;

import java.time.LocalDateTime;

public class LlmConfigVO {
    private String id;
    private String name;
    private String apiBase;
    private String apiKeyMasked;
    private String modelName;
    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;
    private Integer timeoutSeconds;
    private String usageScene;
    private Integer isActive;
    private LocalDateTime createdAt;

    public static LlmConfigVO from(LlmConfig config) {
        LlmConfigVO vo = new LlmConfigVO();
        vo.setId(config.getId());
        vo.setName(config.getName());
        vo.setApiBase(config.getApiBase());
        vo.setApiKeyMasked("******");
        vo.setModelName(config.getModelName());
        vo.setTemperature(config.getTemperature());
        vo.setMaxTokens(config.getMaxTokens());
        vo.setSystemPrompt(config.getSystemPrompt());
        vo.setTimeoutSeconds(config.getTimeoutSeconds());
        vo.setUsageScene(config.getUsageScene());
        vo.setIsActive(config.getIsActive());
        vo.setCreatedAt(config.getCreatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getApiBase() { return apiBase; }
    public void setApiBase(String apiBase) { this.apiBase = apiBase; }
    public String getApiKeyMasked() { return apiKeyMasked; }
    public void setApiKeyMasked(String apiKeyMasked) { this.apiKeyMasked = apiKeyMasked; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    public Integer getMaxTokens() { return maxTokens; }
    public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }
    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }
    public Integer getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(Integer timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    public String getUsageScene() { return usageScene; }
    public void setUsageScene(String usageScene) { this.usageScene = usageScene; }
    public Integer getIsActive() { return isActive; }
    public void setIsActive(Integer isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

