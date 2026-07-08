package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ppt_records")
public class PptRecord {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String projectId;
    private String title;
    private String outlineJson;
    private String contentJson;
    private String filePath;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

