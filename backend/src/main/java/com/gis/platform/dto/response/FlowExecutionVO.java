package com.gis.platform.dto.response;

import com.gis.platform.entity.FlowExecution;

import java.time.LocalDateTime;

public class FlowExecutionVO {
    private String id;
    private String flowId;
    private String flowVersion;
    private String projectId;
    private String triggerType;
    private String inputContext;
    private String outputContext;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;

    public static FlowExecutionVO from(FlowExecution execution) {
        FlowExecutionVO vo = new FlowExecutionVO();
        vo.setId(execution.getId());
        vo.setFlowId(execution.getFlowId());
        vo.setFlowVersion(execution.getFlowVersion());
        vo.setProjectId(execution.getProjectId());
        vo.setTriggerType(execution.getTriggerType());
        vo.setInputContext(execution.getInputContext());
        vo.setOutputContext(execution.getOutputContext());
        vo.setStatus(execution.getStatus());
        vo.setStartedAt(execution.getStartedAt());
        vo.setFinishedAt(execution.getFinishedAt());
        vo.setCreatedAt(execution.getCreatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFlowId() { return flowId; }
    public void setFlowId(String flowId) { this.flowId = flowId; }
    public String getFlowVersion() { return flowVersion; }
    public void setFlowVersion(String flowVersion) { this.flowVersion = flowVersion; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public String getInputContext() { return inputContext; }
    public void setInputContext(String inputContext) { this.inputContext = inputContext; }
    public String getOutputContext() { return outputContext; }
    public void setOutputContext(String outputContext) { this.outputContext = outputContext; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}