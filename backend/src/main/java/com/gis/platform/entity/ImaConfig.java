package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ima_config")
public class ImaConfig {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String apiKeyEnc;
    private String kbId;
    private String kbName;
    private String kbType;
    private String industryTag;
    private Integer isDefault;
    private Integer isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

