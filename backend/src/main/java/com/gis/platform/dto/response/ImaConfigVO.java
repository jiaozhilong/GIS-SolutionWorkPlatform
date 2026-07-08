package com.gis.platform.dto.response;

import com.gis.platform.entity.ImaConfig;

import java.time.LocalDateTime;

public class ImaConfigVO {
    private String id;
    private String name;
    private String apiKeyMasked;
    private String kbId;
    private String kbName;
    private String kbType;
    private String industryTag;
    private Integer isDefault;
    private Integer isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ImaConfigVO from(ImaConfig config) {
        ImaConfigVO vo = new ImaConfigVO();
        vo.setId(config.getId());
        vo.setName(config.getName());
        vo.setApiKeyMasked("******");
        vo.setKbId(config.getKbId());
        vo.setKbName(config.getKbName());
        vo.setKbType(config.getKbType());
        vo.setIndustryTag(config.getIndustryTag());
        vo.setIsDefault(config.getIsDefault());
        vo.setIsActive(config.getIsActive());
        vo.setCreatedAt(config.getCreatedAt());
        vo.setUpdatedAt(config.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getApiKeyMasked() { return apiKeyMasked; }
    public void setApiKeyMasked(String apiKeyMasked) { this.apiKeyMasked = apiKeyMasked; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

