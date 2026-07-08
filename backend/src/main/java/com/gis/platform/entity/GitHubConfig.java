package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("github_config")
public class GitHubConfig {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String name;
    private String tokenEnc;
    private String username;
    private String defaultOrg;
    private Integer isActive;
    private LocalDateTime createdAt;
}

