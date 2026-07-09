package com.gis.platform.dto.response;

import com.gis.platform.entity.FlowNode;

public class FlowNodeVO {
    private String id;
    private String flowId;
    private String skillId;
    private String nodeName;
    private Double positionX;
    private Double positionY;
    private String paramOverrides;
    private Integer timeoutSeconds;
    private Integer retryCount;

    public static FlowNodeVO from(FlowNode node) {
        FlowNodeVO vo = new FlowNodeVO();
        vo.setId(node.getId());
        vo.setFlowId(node.getFlowId());
        vo.setSkillId(node.getSkillId());
        vo.setNodeName(node.getNodeName());
        vo.setPositionX(node.getPositionX());
        vo.setPositionY(node.getPositionY());
        vo.setParamOverrides(node.getParamOverrides());
        vo.setTimeoutSeconds(node.getTimeoutSeconds());
        vo.setRetryCount(node.getRetryCount());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFlowId() { return flowId; }
    public void setFlowId(String flowId) { this.flowId = flowId; }
    public String getSkillId() { return skillId; }
    public void setSkillId(String skillId) { this.skillId = skillId; }
    public String getNodeName() { return nodeName; }
    public void setNodeName(String nodeName) { this.nodeName = nodeName; }
    public Double getPositionX() { return positionX; }
    public void setPositionX(Double positionX) { this.positionX = positionX; }
    public Double getPositionY() { return positionY; }
    public void setPositionY(Double positionY) { this.positionY = positionY; }
    public String getParamOverrides() { return paramOverrides; }
    public void setParamOverrides(String paramOverrides) { this.paramOverrides = paramOverrides; }
    public Integer getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(Integer timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }
}