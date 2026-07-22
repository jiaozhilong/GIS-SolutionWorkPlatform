package com.gis.platform.dto.response;

import com.gis.platform.entity.Template;

import java.time.LocalDateTime;

public class TemplateVO {
    private String id;
    private String name;
    private String type;
    private String category;
    private String content;
    private String variablesJson;
    private Integer isSystem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TemplateVO from(Template template) {
        TemplateVO vo = new TemplateVO();
        vo.setId(template.getId());
        vo.setName(template.getName());
        vo.setType(template.getType());
        vo.setCategory(template.getCategory());
        vo.setContent(template.getContent());
        vo.setVariablesJson(template.getVariablesJson());
        vo.setIsSystem(template.getIsSystem());
        vo.setCreatedAt(template.getCreatedAt());
        vo.setUpdatedAt(template.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getVariablesJson() { return variablesJson; }
    public void setVariablesJson(String variablesJson) { this.variablesJson = variablesJson; }
    public Integer getIsSystem() { return isSystem; }
    public void setIsSystem(Integer isSystem) { this.isSystem = isSystem; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
