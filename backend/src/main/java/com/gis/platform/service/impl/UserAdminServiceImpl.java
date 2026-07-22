package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gis.platform.dto.request.UserCreateReq;
import com.gis.platform.dto.request.UserPasswordResetReq;
import com.gis.platform.dto.request.UserUpdateReq;
import com.gis.platform.dto.response.UserVO;
import com.gis.platform.entity.User;
import com.gis.platform.mapper.UserMapper;
import com.gis.platform.service.UserAdminService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAdminServiceImpl implements UserAdminService {
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_ENGINEER = "ENGINEER";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_DISABLED = "DISABLED";

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserAdminServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public UserVO create(UserCreateReq req) {
        if (findByUsername(req.getUsername()) != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRealName(defaultString(req.getRealName(), req.getUsername().trim()));
        user.setRole(normalizeRole(req.getRole()));
        user.setStatus(normalizeStatus(req.getStatus()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);
        return UserVO.from(user);
    }

    @Override
    @Transactional
    public UserVO update(String id, UserUpdateReq req) {
        User user = requireUser(id);
        String nextRole = normalizeRole(req.getRole());
        String nextStatus = normalizeStatus(req.getStatus());
        if (ROLE_ADMIN.equals(user.getRole()) && countAdmins() <= 1
                && (!ROLE_ADMIN.equals(nextRole) || STATUS_DISABLED.equals(nextStatus))) {
            throw new IllegalArgumentException("至少保留一个启用的管理员");
        }
        user.setRealName(req.getRealName());
        user.setRole(nextRole);
        user.setStatus(nextStatus);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return UserVO.from(user);
    }

    @Override
    public List<UserVO> list(String keyword, String role, String status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(User::getUsername, value).or().like(User::getRealName, value));
        }
        if (hasText(role)) {
            wrapper.eq(User::getRole, normalizeRole(role));
        }
        if (hasText(status)) {
            wrapper.eq(User::getStatus, normalizeStatus(status));
        }
        wrapper.orderByDesc(User::getUpdatedAt).orderByDesc(User::getCreatedAt);
        return userMapper.selectList(wrapper).stream().map(UserVO::from).collect(Collectors.toList());
    }

    @Override
    public UserVO detail(String id) {
        return UserVO.from(requireUser(id));
    }

    @Override
    @Transactional
    public void delete(String id) {
        User user = requireUser(id);
        if (ROLE_ADMIN.equals(user.getRole()) && countAdmins() <= 1) {
            throw new IllegalArgumentException("至少保留一个管理员");
        }
        userMapper.deleteById(id);
    }

    @Override
    @Transactional
    public boolean resetPassword(String id, UserPasswordResetReq req) {
        User user = requireUser(id);
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return true;
    }

    private User requireUser(String id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在: " + id);
        }
        return user;
    }

    private User findByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    private long countAdmins() {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getRole, ROLE_ADMIN));
        return count == null ? 0 : count;
    }

    private String normalizeRole(String role) {
        if (!hasText(role)) return ROLE_ENGINEER;
        String value = role.trim().toUpperCase();
        if ("SOLUTION_ENGINEER".equals(value) || "USER".equals(value)) return ROLE_ENGINEER;
        if (ROLE_ADMIN.equals(value) || ROLE_ENGINEER.equals(value)) return value;
        throw new IllegalArgumentException("角色只能是 ADMIN 或 ENGINEER");
    }

    private String normalizeStatus(String status) {
        if (!hasText(status)) return STATUS_ACTIVE;
        String value = status.trim().toUpperCase();
        if (STATUS_ACTIVE.equals(value) || STATUS_DISABLED.equals(value)) return value;
        throw new IllegalArgumentException("状态只能是 ACTIVE 或 DISABLED");
    }

    private String defaultString(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
