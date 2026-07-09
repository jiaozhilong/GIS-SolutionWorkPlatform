package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gis.platform.dto.request.SystemLogQueryReq;
import com.gis.platform.dto.response.SystemLogPageVO;
import com.gis.platform.dto.response.SystemLogVO;
import com.gis.platform.entity.SystemLog;
import com.gis.platform.mapper.SystemLogMapper;
import com.gis.platform.service.SystemLogService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class SystemLogServiceImpl implements SystemLogService {
    private static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_DATE_TIME;
    private final SystemLogMapper systemLogMapper;

    public SystemLogServiceImpl(SystemLogMapper systemLogMapper) {
        this.systemLogMapper = systemLogMapper;
    }

    @Override
    public SystemLogPageVO page(SystemLogQueryReq req) {
        SystemLogQueryReq query = req == null ? new SystemLogQueryReq() : req;
        int pageNo = clamp(query.getPage(), 1, 100000, 1);
        int pageSize = clamp(query.getPageSize(), 1, 200, 20);
        long offset = (long) (pageNo - 1) * pageSize;

        Long total = systemLogMapper.selectCount(buildWrapper(query, false));
        List<SystemLog> records = systemLogMapper.selectList(buildWrapper(query, true).last("LIMIT " + pageSize + " OFFSET " + offset));
        List<SystemLog> matched = systemLogMapper.selectList(buildWrapper(query, false));

        SystemLogPageVO vo = new SystemLogPageVO();
        vo.setTotal(total == null ? 0 : total);
        vo.setPage(pageNo);
        vo.setPageSize(pageSize);
        vo.setRecords(records.stream().map(SystemLogVO::from).collect(Collectors.toList()));
        vo.setLogTypeStats(groupCount(matched, SystemLog::getLogType));
        vo.setLevelStats(groupCount(matched, SystemLog::getLevel));
        vo.setAvgDurationMs(avgDuration(matched));
        return vo;
    }

    private LambdaQueryWrapper<SystemLog> buildWrapper(SystemLogQueryReq req, boolean ordered) {
        LambdaQueryWrapper<SystemLog> wrapper = new LambdaQueryWrapper<>();
        if (hasText(req.getLogType())) wrapper.eq(SystemLog::getLogType, req.getLogType().trim());
        if (hasText(req.getLevel())) wrapper.eq(SystemLog::getLevel, req.getLevel().trim());
        if (hasText(req.getModule())) wrapper.like(SystemLog::getModule, req.getModule().trim());
        if (hasText(req.getAction())) wrapper.like(SystemLog::getAction, req.getAction().trim());
        if (hasText(req.getKeyword())) {
            String keyword = req.getKeyword().trim();
            wrapper.and(item -> item.like(SystemLog::getMessage, keyword)
                    .or().like(SystemLog::getDetail, keyword)
                    .or().like(SystemLog::getRefId, keyword)
                    .or().like(SystemLog::getAction, keyword));
        }
        LocalDateTime startAt = parseDateTime(req.getStartAt());
        LocalDateTime endAt = parseDateTime(req.getEndAt());
        if (startAt != null) wrapper.ge(SystemLog::getCreatedAt, startAt);
        if (endAt != null) wrapper.le(SystemLog::getCreatedAt, endAt);
        if (ordered) wrapper.orderByDesc(SystemLog::getCreatedAt);
        return wrapper;
    }

    private Map<String, Long> groupCount(List<SystemLog> logs, java.util.function.Function<SystemLog, String> getter) {
        Map<String, Long> stats = new LinkedHashMap<>();
        logs.stream()
                .map(getter)
                .map(value -> hasText(value) ? value : "UNKNOWN")
                .forEach(value -> stats.put(value, stats.getOrDefault(value, 0L) + 1));
        return stats;
    }

    private long avgDuration(List<SystemLog> logs) {
        return Math.round(logs.stream()
                .map(SystemLog::getDurationMs)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .average()
                .orElse(0));
    }

    private LocalDateTime parseDateTime(String value) {
        if (!hasText(value)) return null;
        String trimmed = value.trim();
        try {
            return LocalDateTime.parse(trimmed, ISO_DATE_TIME);
        } catch (Exception ignored) {
            return LocalDateTime.parse(trimmed.replace(' ', 'T'));
        }
    }

    private int clamp(Integer value, int min, int max, int defaultValue) {
        int actual = value == null ? defaultValue : value;
        if (actual < min) return min;
        if (actual > max) return max;
        return actual;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}