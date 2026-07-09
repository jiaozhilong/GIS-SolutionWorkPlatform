package com.gis.platform.dto.request;

public class SystemLogQueryReq {
    private String logType;
    private String level;
    private String module;
    private String action;
    private String keyword;
    private String startAt;
    private String endAt;
    private Integer page;
    private Integer pageSize;

    public String getLogType() { return logType; }
    public void setLogType(String logType) { this.logType = logType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public String getStartAt() { return startAt; }
    public void setStartAt(String startAt) { this.startAt = startAt; }
    public String getEndAt() { return endAt; }
    public void setEndAt(String endAt) { this.endAt = endAt; }
    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getPageSize() { return pageSize; }
    public void setPageSize(Integer pageSize) { this.pageSize = pageSize; }
}