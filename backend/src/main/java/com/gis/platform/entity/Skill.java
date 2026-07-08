package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("skills")
public class Skill {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String type;
    private String category;
    private String version;
    private String description;
    private String promptTemplate;
    private String inputSchema;
    private String outputSchema;
    private Integer requiresIma;
    private Integer requiresLlm;
    private Integer requiresGithub;
    private String imaKbIds;
    private String llmConfigId;
    private Integer timeoutSeconds;
    private Integer retryCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

