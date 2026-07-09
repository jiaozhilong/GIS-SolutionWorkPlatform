package com.gis.platform.dto.response;

import com.gis.platform.entity.SystemLog;

import java.time.LocalDateTime;

public class SystemLogVO {
    private String id;
    private String module;
    private String action;
    private String refId;
    private String logType;
    private String level;
    private String message;
    private String detail;
    private Long durationMs;
    private LocalDateTime createdAt;

    public static SystemLogVO from(SystemLog log) {
        SystemLogVO vo = new SystemLogVO();
        vo.setId(log.getId());
        vo.setModule(log.getModule());
        vo.setAction(log.getAction());
        vo.setRefId(log.getRefId());
        vo.setLogType(log.getLogType());
        vo.setLevel(log.getLevel());
        vo.setMessage(log.getMessage());
        vo.setDetail(log.getDetail());
        vo.setDurationMs(log.getDurationMs());
        vo.setCreatedAt(log.getCreatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
    public String getLogType() { return logType; }
    public void setLogType(String logType) { this.logType = logType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}