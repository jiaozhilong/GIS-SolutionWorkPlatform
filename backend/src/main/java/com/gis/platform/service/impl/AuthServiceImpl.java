package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gis.platform.auth.AuthUser;
import com.gis.platform.dto.request.ChangePasswordReq;
import com.gis.platform.dto.request.LoginReq;
import com.gis.platform.dto.request.RegisterReq;
import com.gis.platform.dto.response.LoginVO;
import com.gis.platform.dto.response.UserVO;
import com.gis.platform.entity.User;
import com.gis.platform.mapper.UserMapper;
import com.gis.platform.service.AuthService;
import com.gis.platform.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthServiceImpl(UserMapper userMapper, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
    }

    @Override
    @Transactional
    public LoginVO login(LoginReq req) {
        User user = findByUsername(req.getUsername());
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if (!"ACTIVE".equals(defaultString(user.getStatus(), "ACTIVE"))) {
            throw new IllegalArgumentException("用户已停用");
        }
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return loginVO(user);
    }

    @Override
    @Transactional
    public LoginVO register(RegisterReq req) {
        if (findByUsername(req.getUsername()) != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRealName(defaultString(req.getRealName(), req.getUsername()));
        user.setRole("ENGINEER");
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);
        return loginVO(user);
    }

    @Override
    public UserVO me(AuthUser currentUser) {
        User user = requireUser(currentUser.getUserId());
        return UserVO.from(user);
    }

    @Override
    @Transactional
    public boolean changePassword(AuthUser currentUser, ChangePasswordReq req) {
        User user = requireUser(currentUser.getUserId());
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return true;
    }

    @Override
    @Transactional
    public void ensureDefaultAdmin() {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>());
        if (count != null && count > 0) return;
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRealName("系统管理员");
        admin.setRole("ADMIN");
        admin.setStatus("ACTIVE");
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(admin);
    }

    private User findByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    private User requireUser(String userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new IllegalArgumentException("用户不存在");
        return user;
    }

    private LoginVO loginVO(User user) {
        AuthUser authUser = new AuthUser(user.getId(), user.getUsername(), defaultString(user.getRole(), "USER"));
        LoginVO vo = new LoginVO();
        vo.setToken(jwtUtil.generate(authUser));
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setRole(authUser.getRole());
        return vo;
    }

    private String defaultString(String value, String defaultValue) {
        return value == null || value.trim().isEmpty() ? defaultValue : value;
    }
}
