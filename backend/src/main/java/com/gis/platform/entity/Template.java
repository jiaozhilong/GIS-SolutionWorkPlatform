package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("templates")
public class Template {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String type;
    private String category;
    private String content;
    private String variablesJson;
    private Integer isSystem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

