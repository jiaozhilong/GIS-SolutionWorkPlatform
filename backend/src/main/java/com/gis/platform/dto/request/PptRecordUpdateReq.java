package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class PptRecordUpdateReq {
    @NotBlank(message = "PPT 标题不能为空")
    private String title;
    private String outlineJson;
    private String contentJson;
    private String status;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getOutlineJson() { return outlineJson; }
    public void setOutlineJson(String outlineJson) { this.outlineJson = outlineJson; }
    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
