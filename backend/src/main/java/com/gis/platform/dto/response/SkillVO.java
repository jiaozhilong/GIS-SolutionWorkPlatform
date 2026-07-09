package com.gis.platform.dto.response;

import com.gis.platform.entity.Skill;

import java.time.LocalDateTime;

public class SkillVO {
    private String id;
    private String name;
    private String type;
    private String category;
    private String version;
    private String description;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SkillVO from(Skill skill) {
        SkillVO vo = new SkillVO();
        vo.setId(skill.getId());
        vo.setName(skill.getName());
        vo.setType(skill.getType());
        vo.setCategory(skill.getCategory());
        vo.setVersion(skill.getVersion());
        vo.setDescription(skill.getDescription());
        vo.setPromptTemplate(skill.getPromptTemplate());
        vo.setInputSchema(skill.getInputSchema());
        vo.setOutputSchema(skill.getOutputSchema());
        vo.setRequiresIma(skill.getRequiresIma());
        vo.setRequiresLlm(skill.getRequiresLlm());
        vo.setRequiresGithub(skill.getRequiresGithub());
        vo.setImaKbIds(skill.getImaKbIds());
        vo.setLlmConfigId(skill.getLlmConfigId());
        vo.setTimeoutSeconds(skill.getTimeoutSeconds());
        vo.setRetryCount(skill.getRetryCount());
        vo.setStatus(skill.getStatus());
        vo.setCreatedAt(skill.getCreatedAt());
        vo.setUpdatedAt(skill.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}