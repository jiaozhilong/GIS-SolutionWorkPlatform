package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class FlowEdgeReq {
    @NotBlank(message = "源节点不能为空")
    private String sourceNodeId;
    @NotBlank(message = "目标节点不能为空")
    private String targetNodeId;

    public String getSourceNodeId() { return sourceNodeId; }
    public void setSourceNodeId(String sourceNodeId) { this.sourceNodeId = sourceNodeId; }
    public String getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
}