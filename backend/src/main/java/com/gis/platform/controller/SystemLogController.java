package com.gis.platform.controller;

import com.gis.platform.dto.request.SystemLogQueryReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.SystemLogPageVO;
import com.gis.platform.service.SystemLogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system/logs")
public class SystemLogController {
    private final SystemLogService systemLogService;

    public SystemLogController(SystemLogService systemLogService) {
        this.systemLogService = systemLogService;
    }

    @GetMapping
    public ApiResult<SystemLogPageVO> page(SystemLogQueryReq req) {
        return ApiResult.ok(systemLogService.page(req));
    }
}