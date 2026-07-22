package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class UserPasswordResetReq {
    @NotBlank(message = "新密码不能为空")
    private String newPassword;

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
