package com.gis.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.auth.AuthUser;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public AuthInterceptor(JwtUtil jwtUtil, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || isPublic(request.getRequestURI(), request.getMethod())) {
            return true;
        }
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            writeUnauthorized(response, "未登录或 Token 缺失");
            return false;
        }
        try {
            AuthUser user = jwtUtil.parse(auth.substring(7));
            if (request.getRequestURI().startsWith("/api/users") && !"ADMIN".equals(user.getRole())) {
                writeForbidden(response, "仅管理员可以访问用户管理");
                return false;
            }
            request.setAttribute("currentUser", user);
            return true;
        } catch (IllegalArgumentException e) {
            writeUnauthorized(response, "未登录或 Token 已过期");
            return false;
        }
    }

    private boolean isPublic(String uri, String method) {
        return ("POST".equalsIgnoreCase(method) && ("/api/auth/login".equals(uri) || "/api/auth/register".equals(uri)))
                || "/api/hello".equals(uri)
                || uri.startsWith("/doc.html")
                || uri.startsWith("/swagger-ui")
                || uri.startsWith("/swagger-resources")
                || uri.startsWith("/webjars")
                || uri.startsWith("/v2/api-docs")
                || uri.startsWith("/v3/api-docs");
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResult.fail(401, message)));
    }

    private void writeForbidden(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResult.fail(403, message)));
    }
}
