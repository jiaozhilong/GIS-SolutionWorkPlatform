package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class GitHubConfigReq {
    @NotBlank(message = "配置名称不能为空")
    private String name;
    private String token;
    private String username;
    private String defaultOrg;
    private Integer isActive;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDefaultOrg() { return defaultOrg; }
    public void setDefaultOrg(String defaultOrg) { this.defaultOrg = defaultOrg; }
    public Integer getIsActive() { return isActive; }
    public void setIsActive(Integer isActive) { this.isActive = isActive; }
}
