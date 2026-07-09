package com.gis.platform.controller;

import com.gis.platform.dto.request.SkillReq;
import com.gis.platform.dto.request.SkillTestReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.SkillTestResult;
import com.gis.platform.dto.response.SkillVO;
import com.gis.platform.service.SkillService;
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
@RequestMapping("/api/skills")
public class SkillController {
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping
    public ApiResult<SkillVO> create(@Validated @RequestBody SkillReq req) {
        return ApiResult.ok(skillService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResult<SkillVO> update(@PathVariable String id, @Validated @RequestBody SkillReq req) {
        return ApiResult.ok(skillService.update(id, req));
    }

    @GetMapping("/{id}")
    public ApiResult<SkillVO> detail(@PathVariable String id) {
        return ApiResult.ok(skillService.detail(id));
    }

    @GetMapping
    public ApiResult<List<SkillVO>> list() {
        return ApiResult.ok(skillService.list());
    }

    @DeleteMapping("/{id}")
    public ApiResult<Boolean> delete(@PathVariable String id) {
        skillService.delete(id);
        return ApiResult.ok(true);
    }

    @PostMapping("/{id}/test")
    public ApiResult<SkillTestResult> test(@PathVariable String id, @RequestBody(required = false) SkillTestReq req) {
        return ApiResult.ok(skillService.test(id, req));
    }
}