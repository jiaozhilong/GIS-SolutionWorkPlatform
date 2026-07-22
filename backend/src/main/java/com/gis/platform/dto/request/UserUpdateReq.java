package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class UserUpdateReq {
    @NotBlank(message = "姓名不能为空")
    private String realName;
    private String role;
    private String status;

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
