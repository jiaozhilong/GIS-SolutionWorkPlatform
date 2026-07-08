package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class ImaConfigReq {

    @NotBlank(message = "配置名称不能为空")
    private String name;
    private String apiKey;
    private String kbId;
    private String kbName;
    private String kbType;
    private String industryTag;
    private Integer isDefault;
    private Integer isActive;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getKbId() { return kbId; }
    public void setKbId(String kbId) { this.kbId = kbId; }
    public String getKbName() { return kbName; }
    public void setKbName(String kbName) { this.kbName = kbName; }
    public String getKbType() { return kbType; }
    public void setKbType(String kbType) { this.kbType = kbType; }
    public String getIndustryTag() { return industryTag; }
    public void setIndustryTag(String industryTag) { this.industryTag = industryTag; }
    public Integer getIsDefault() { return isDefault; }
    public void setIsDefault(Integer isDefault) { this.isDefault = isDefault; }
    public Integer getIsActive() { return isActive; }
    public void setIsActive(Integer isActive) { this.isActive = isActive; }
}

