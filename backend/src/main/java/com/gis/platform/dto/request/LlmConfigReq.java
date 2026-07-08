package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class LlmConfigReq {

    @NotBlank(message = "配置名称不能为空")
    private String name;

    @NotBlank(message = "API Base 不能为空")
    private String apiBase;

    private String apiKey;

    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;
    private Integer timeoutSeconds;
    private String usageScene;
    private Integer isActive;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getApiBase() { return apiBase; }
    public void setApiBase(String apiBase) { this.apiBase = apiBase; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
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
}

