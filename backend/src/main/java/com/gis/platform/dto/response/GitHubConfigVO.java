package com.gis.platform.dto.response;

import com.gis.platform.entity.GitHubConfig;

import java.time.LocalDateTime;

public class GitHubConfigVO {
    private String id;
    private String name;
    private String tokenMasked;
    private String username;
    private String defaultOrg;
    private Integer isActive;
    private LocalDateTime createdAt;

    public static GitHubConfigVO from(GitHubConfig config) {
        GitHubConfigVO vo = new GitHubConfigVO();
        vo.setId(config.getId());
        vo.setName(config.getName());
        vo.setTokenMasked(config.getTokenEnc() == null || config.getTokenEnc().trim().isEmpty() ? "未配置" : "******");
        vo.setUsername(config.getUsername());
        vo.setDefaultOrg(config.getDefaultOrg());
        vo.setIsActive(config.getIsActive());
        vo.setCreatedAt(config.getCreatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTokenMasked() { return tokenMasked; }
    public void setTokenMasked(String tokenMasked) { this.tokenMasked = tokenMasked; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDefaultOrg() { return defaultOrg; }
    public void setDefaultOrg(String defaultOrg) { this.defaultOrg = defaultOrg; }
    public Integer getIsActive() { return isActive; }
    public void setIsActive(Integer isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
