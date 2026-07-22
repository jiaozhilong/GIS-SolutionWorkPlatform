package com.gis.platform.service;

import com.gis.platform.dto.request.UserCreateReq;
import com.gis.platform.dto.request.UserPasswordResetReq;
import com.gis.platform.dto.request.UserUpdateReq;
import com.gis.platform.dto.response.UserVO;

import java.util.List;

public interface UserAdminService {
    UserVO create(UserCreateReq req);
    UserVO update(String id, UserUpdateReq req);
    List<UserVO> list(String keyword, String role, String status);
    UserVO detail(String id);
    void delete(String id);
    boolean resetPassword(String id, UserPasswordResetReq req);
}
