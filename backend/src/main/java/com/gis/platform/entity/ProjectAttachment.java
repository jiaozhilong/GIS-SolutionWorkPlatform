package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("project_attachments")
public class ProjectAttachment {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String projectId;
    private String filename;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
}

