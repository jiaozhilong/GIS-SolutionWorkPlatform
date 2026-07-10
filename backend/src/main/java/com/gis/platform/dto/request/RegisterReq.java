package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class RegisterReq {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    private String realName;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
}