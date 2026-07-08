package com.gis.platform.controller;

import com.gis.platform.dto.request.LlmConfigReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.LlmConfigVO;
import com.gis.platform.dto.response.LlmTestResult;
import com.gis.platform.service.LlmService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/llm")
public class LlmController {

    private final LlmService llmService;

    public LlmController(LlmService llmService) {
        this.llmService = llmService;
    }

    @PostMapping("/config")
    public ApiResult<LlmConfigVO> createConfig(@Validated @RequestBody LlmConfigReq req) {
        return ApiResult.ok(llmService.createConfig(req));
    }

    @PutMapping("/config/{id}")
    public ApiResult<LlmConfigVO> updateConfig(@PathVariable String id, @Validated @RequestBody LlmConfigReq req) {
        return ApiResult.ok(llmService.updateConfig(id, req));
    }

    @GetMapping("/config")
    public ApiResult<List<LlmConfigVO>> listConfigs() {
        return ApiResult.ok(llmService.listConfigs());
    }

    @DeleteMapping("/config/{id}")
    public ApiResult<Boolean> deleteConfig(@PathVariable String id) {
        llmService.deleteConfig(id);
        return ApiResult.ok(true);
    }

    @PostMapping("/config/{id}/test")
    public ApiResult<LlmTestResult> testConnection(@PathVariable String id) {
        return ApiResult.ok(llmService.testConnection(id));
    }
}

