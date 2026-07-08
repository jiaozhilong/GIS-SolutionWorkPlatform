package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("flow_executions")
public class FlowExecution {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String flowId;
    private String flowVersion;
    private String projectId;
    private String triggerType;
    private String inputContext;
    private String outputContext;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;
}

