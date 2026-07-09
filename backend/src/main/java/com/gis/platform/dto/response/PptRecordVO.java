package com.gis.platform.dto.response;

import com.gis.platform.entity.PptRecord;

import java.time.LocalDateTime;

public class PptRecordVO {
    private String id;
    private String projectId;
    private String title;
    private String outlineJson;
    private String contentJson;
    private String filePath;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PptRecordVO from(PptRecord record) {
        PptRecordVO vo = new PptRecordVO();
        vo.setId(record.getId());
        vo.setProjectId(record.getProjectId());
        vo.setTitle(record.getTitle());
        vo.setOutlineJson(record.getOutlineJson());
        vo.setContentJson(record.getContentJson());
        vo.setFilePath(record.getFilePath());
        vo.setStatus(record.getStatus());
        vo.setCreatedAt(record.getCreatedAt());
        vo.setUpdatedAt(record.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getOutlineJson() { return outlineJson; }
    public void setOutlineJson(String outlineJson) { this.outlineJson = outlineJson; }
    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}