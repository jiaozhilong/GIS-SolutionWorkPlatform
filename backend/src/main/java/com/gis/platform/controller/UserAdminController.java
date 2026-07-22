package com.gis.platform.controller;

import com.gis.platform.dto.request.UserCreateReq;
import com.gis.platform.dto.request.UserPasswordResetReq;
import com.gis.platform.dto.request.UserUpdateReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.UserVO;
import com.gis.platform.service.UserAdminService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserAdminController {
    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @PostMapping
    public ApiResult<UserVO> create(@Validated @RequestBody UserCreateReq req) {
        return ApiResult.ok(userAdminService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResult<UserVO> update(@PathVariable String id, @Validated @RequestBody UserUpdateReq req) {
        return ApiResult.ok(userAdminService.update(id, req));
    }

    @GetMapping
    public ApiResult<List<UserVO>> list(@RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) String role,
                                        @RequestParam(required = false) String status) {
        return ApiResult.ok(userAdminService.list(keyword, role, status));
    }

    @GetMapping("/{id}")
    public ApiResult<UserVO> detail(@PathVariable String id) {
        return ApiResult.ok(userAdminService.detail(id));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Boolean> delete(@PathVariable String id) {
        userAdminService.delete(id);
        return ApiResult.ok(true);
    }

    @PostMapping("/{id}/reset-password")
    public ApiResult<Boolean> resetPassword(@PathVariable String id, @Validated @RequestBody UserPasswordResetReq req) {
        return ApiResult.ok(userAdminService.resetPassword(id, req));
    }
}
