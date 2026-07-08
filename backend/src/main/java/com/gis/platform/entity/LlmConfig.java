package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("llm_config")
public class LlmConfig {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String apiBase;
    private String apiKeyEnc;
    private String modelName;
    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;
    private Integer timeoutSeconds;
    private String usageScene;
    private Integer isActive;
    private LocalDateTime createdAt;
}

