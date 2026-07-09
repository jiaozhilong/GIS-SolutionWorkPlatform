package com.gis.platform.dto.response;

import com.gis.platform.entity.FlowEdge;

public class FlowEdgeVO {
    private String id;
    private String flowId;
    private String sourceNodeId;
    private String targetNodeId;

    public static FlowEdgeVO from(FlowEdge edge) {
        FlowEdgeVO vo = new FlowEdgeVO();
        vo.setId(edge.getId());
        vo.setFlowId(edge.getFlowId());
        vo.setSourceNodeId(edge.getSourceNodeId());
        vo.setTargetNodeId(edge.getTargetNodeId());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFlowId() { return flowId; }
    public void setFlowId(String flowId) { this.flowId = flowId; }
    public String getSourceNodeId() { return sourceNodeId; }
    public void setSourceNodeId(String sourceNodeId) { this.sourceNodeId = sourceNodeId; }
    public String getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
}