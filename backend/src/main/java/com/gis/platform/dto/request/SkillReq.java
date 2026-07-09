package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class SkillReq {
    @NotBlank(message = "Skill 名称不能为空")
    private String name;
    @NotBlank(message = "Skill 类型不能为空")
    private String type;
    private String category;
    private String version;
    private String description;
    @NotBlank(message = "Prompt 模板不能为空")
    private String promptTemplate;
    private String inputSchema;
    private String outputSchema;
    private Integer requiresIma;
    private Integer requiresLlm;
    private Integer requiresGithub;
    private String imaKbIds;
    private String llmConfigId;
    private Integer timeoutSeconds;
    private Integer retryCount;
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPromptTemplate() { return promptTemplate; }
    public void setPromptTemplate(String promptTemplate) { this.promptTemplate = promptTemplate; }
    public String getInputSchema() { return inputSchema; }
    public void setInputSchema(String inputSchema) { this.inputSchema = inputSchema; }
    public String getOutputSchema() { return outputSchema; }
    public void setOutputSchema(String outputSchema) { this.outputSchema = outputSchema; }
    public Integer getRequiresIma() { return requiresIma; }
    public void setRequiresIma(Integer requiresIma) { this.requiresIma = requiresIma; }
    public Integer getRequiresLlm() { return requiresLlm; }
    public void setRequiresLlm(Integer requiresLlm) { this.requiresLlm = requiresLlm; }
    public Integer getRequiresGithub() { return requiresGithub; }
    public void setRequiresGithub(Integer requiresGithub) { this.requiresGithub = requiresGithub; }
    public String getImaKbIds() { return imaKbIds; }
    public void setImaKbIds(String imaKbIds) { this.imaKbIds = imaKbIds; }
    public String getLlmConfigId() { return llmConfigId; }
    public void setLlmConfigId(String llmConfigId) { this.llmConfigId = llmConfigId; }
    public Integer getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(Integer timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}