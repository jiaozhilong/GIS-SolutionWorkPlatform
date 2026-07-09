package com.gis.platform.dto.response;

import java.util.List;
import java.util.Map;

public class SystemLogPageVO {
    private long total;
    private long page;
    private long pageSize;
    private List<SystemLogVO> records;
    private Map<String, Long> logTypeStats;
    private Map<String, Long> levelStats;
    private long avgDurationMs;

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public long getPage() { return page; }
    public void setPage(long page) { this.page = page; }
    public long getPageSize() { return pageSize; }
    public void setPageSize(long pageSize) { this.pageSize = pageSize; }
    public List<SystemLogVO> getRecords() { return records; }
    public void setRecords(List<SystemLogVO> records) { this.records = records; }
    public Map<String, Long> getLogTypeStats() { return logTypeStats; }
    public void setLogTypeStats(Map<String, Long> logTypeStats) { this.logTypeStats = logTypeStats; }
    public Map<String, Long> getLevelStats() { return levelStats; }
    public void setLevelStats(Map<String, Long> levelStats) { this.levelStats = levelStats; }
    public long getAvgDurationMs() { return avgDurationMs; }
    public void setAvgDurationMs(long avgDurationMs) { this.avgDurationMs = avgDurationMs; }
}