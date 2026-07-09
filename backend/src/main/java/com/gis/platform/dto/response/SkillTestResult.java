package com.gis.platform.dto.response;

public class SkillTestResult {
    private String skillId;
    private String skillName;
    private String renderedPrompt;
    private ImaSearchResult imaResult;
    private String llmResponse;
    private String status;
    private String errorMessage;
    private Long durationMs;

    public String getSkillId() { return skillId; }
    public void setSkillId(String skillId) { this.skillId = skillId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public String getRenderedPrompt() { return renderedPrompt; }
    public void setRenderedPrompt(String renderedPrompt) { this.renderedPrompt = renderedPrompt; }
    public ImaSearchResult getImaResult() { return imaResult; }
    public void setImaResult(ImaSearchResult imaResult) { this.imaResult = imaResult; }
    public String getLlmResponse() { return llmResponse; }
    public void setLlmResponse(String llmResponse) { this.llmResponse = llmResponse; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
}