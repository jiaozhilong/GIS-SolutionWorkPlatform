package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class TemplateReq {
    @NotBlank(message = "模板名称不能为空")
    private String name;
    @NotBlank(message = "模板类型不能为空")
    private String type;
    private String category;
    @NotBlank(message = "模板内容不能为空")
    private String content;
    private String variablesJson;
    private Integer isSystem;

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
}
