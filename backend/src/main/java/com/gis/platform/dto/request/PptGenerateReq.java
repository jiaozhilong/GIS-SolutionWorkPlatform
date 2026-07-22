package com.gis.platform.dto.request;

public class PptGenerateReq {
    private String projectId;
    private String executionId;
    private String title;

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
