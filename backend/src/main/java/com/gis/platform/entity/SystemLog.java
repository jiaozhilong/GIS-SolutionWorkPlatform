package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("system_logs")
public class SystemLog {
    @TableId(type = IdType.ASSIGN_UUID)
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
}
