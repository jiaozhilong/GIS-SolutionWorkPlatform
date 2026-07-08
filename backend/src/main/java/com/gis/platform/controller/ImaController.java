package com.gis.platform.controller;

import com.gis.platform.dto.request.ImaConfigReq;
import com.gis.platform.dto.request.ImaSearchReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.ImaConfigVO;
import com.gis.platform.dto.response.ImaSearchResult;
import com.gis.platform.service.ImaService;
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
@RequestMapping("/api/ima")
public class ImaController {

    private final ImaService imaService;

    public ImaController(ImaService imaService) {
        this.imaService = imaService;
    }

    @PostMapping("/config")
    public ApiResult<ImaConfigVO> createConfig(@Validated @RequestBody ImaConfigReq req) {
        return ApiResult.ok(imaService.createConfig(req));
    }

    @PutMapping("/config/{id}")
    public ApiResult<ImaConfigVO> updateConfig(@PathVariable String id, @Validated @RequestBody ImaConfigReq req) {
        return ApiResult.ok(imaService.updateConfig(id, req));
    }

    @GetMapping("/config")
    public ApiResult<List<ImaConfigVO>> listConfigs() {
        return ApiResult.ok(imaService.listConfigs());
    }

    @DeleteMapping("/config/{id}")
    public ApiResult<Boolean> deleteConfig(@PathVariable String id) {
        imaService.deleteConfig(id);
        return ApiResult.ok(true);
    }

    @PostMapping("/config/{id}/test")
    public ApiResult<Boolean> testConnection(@PathVariable String id) {
        return ApiResult.ok(imaService.testConnection(id));
    }

    @PostMapping("/search")
    public ApiResult<ImaSearchResult> search(@Validated @RequestBody ImaSearchReq req) {
        return ApiResult.ok(imaService.search(req));
    }
}

