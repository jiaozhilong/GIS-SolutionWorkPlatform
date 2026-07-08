package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("project_kb_links")
public class ProjectKbLink {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String projectId;
    private String kbConfigId;
}

