package com.gis.platform.service;

import com.gis.platform.auth.AuthUser;
import com.gis.platform.dto.request.ChangePasswordReq;
import com.gis.platform.dto.request.LoginReq;
import com.gis.platform.dto.request.RegisterReq;
import com.gis.platform.dto.response.LoginVO;
import com.gis.platform.dto.response.UserVO;

public interface AuthService {
    LoginVO login(LoginReq req);
    LoginVO register(RegisterReq req);
    UserVO me(AuthUser currentUser);
    boolean changePassword(AuthUser currentUser, ChangePasswordReq req);
    void ensureDefaultAdmin();
}