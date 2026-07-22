package com.gis.platform.controller;

import com.gis.platform.dto.request.TemplateReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.TemplateVO;
import com.gis.platform.service.TemplateService;
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
@RequestMapping("/api/templates")
public class TemplateController {
    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @PostMapping
    public ApiResult<TemplateVO> create(@Validated @RequestBody TemplateReq req) {
        return ApiResult.ok(templateService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResult<TemplateVO> update(@PathVariable String id, @Validated @RequestBody TemplateReq req) {
        return ApiResult.ok(templateService.update(id, req));
    }

    @GetMapping("/{id}")
    public ApiResult<TemplateVO> detail(@PathVariable String id) {
        return ApiResult.ok(templateService.detail(id));
    }

    @GetMapping
    public ApiResult<List<TemplateVO>> list(@RequestParam(required = false) String type,
                                            @RequestParam(required = false) String category,
                                            @RequestParam(required = false) String keyword) {
        return ApiResult.ok(templateService.list(type, category, keyword));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Boolean> delete(@PathVariable String id) {
        templateService.delete(id);
        return ApiResult.ok(true);
    }
}
