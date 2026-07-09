package com.gis.platform.dto.request;

import java.util.Map;

public class FlowExecuteReq {
    private String projectId;
    private Map<String, Object> inputContext;

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public Map<String, Object> getInputContext() { return inputContext; }
    public void setInputContext(Map<String, Object> inputContext) { this.inputContext = inputContext; }
}