package com.gis.platform.controller;

import com.gis.platform.auth.AuthUser;
import com.gis.platform.dto.request.ChangePasswordReq;
import com.gis.platform.dto.request.LoginReq;
import com.gis.platform.dto.request.RegisterReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.LoginVO;
import com.gis.platform.dto.response.UserVO;
import com.gis.platform.service.AuthService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResult<LoginVO> login(@Validated @RequestBody LoginReq req) {
        return ApiResult.ok(authService.login(req));
    }

    @PostMapping("/register")
    public ApiResult<LoginVO> register(@Validated @RequestBody RegisterReq req) {
        return ApiResult.ok(authService.register(req));
    }

    @GetMapping("/me")
    public ApiResult<UserVO> me(@RequestAttribute("currentUser") AuthUser currentUser) {
        return ApiResult.ok(authService.me(currentUser));
    }

    @PostMapping("/change-password")
    public ApiResult<Boolean> changePassword(@RequestAttribute("currentUser") AuthUser currentUser,
                                             @Validated @RequestBody ChangePasswordReq req) {
        return ApiResult.ok(authService.changePassword(currentUser, req));
    }
}