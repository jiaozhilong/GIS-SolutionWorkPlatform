package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class FlowNodeReq {
    private String clientId;
    @NotBlank(message = "节点 Skill 不能为空")
    private String skillId;
    @NotBlank(message = "节点名称不能为空")
    private String nodeName;
    private Double positionX;
    private Double positionY;
    private String paramOverrides;
    private Integer timeoutSeconds;
    private Integer retryCount;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
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