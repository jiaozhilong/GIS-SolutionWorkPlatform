package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("flows")
public class Flow {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String description;
    private String category;
    private String version;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

