package com.gis.platform.controller;

import com.gis.platform.dto.request.PptGenerateReq;
import com.gis.platform.dto.request.PptRecordUpdateReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.PptRecordVO;
import com.gis.platform.service.PptService;
import org.springframework.validation.annotation.Validated;
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
@RequestMapping("/api/ppt")
public class PptController {
    private final PptService pptService;

    public PptController(PptService pptService) {
        this.pptService = pptService;
    }

    @PostMapping("/generate")
    public ApiResult<PptRecordVO> generate(@Validated @RequestBody PptGenerateReq req) {
        return ApiResult.ok(pptService.generate(req));
    }

    @GetMapping("/records")
    public ApiResult<List<PptRecordVO>> list(@RequestParam(required = false) String projectId) {
        return ApiResult.ok(pptService.list(projectId));
    }

    @GetMapping("/records/{id}")
    public ApiResult<PptRecordVO> detail(@PathVariable String id) {
        return ApiResult.ok(pptService.detail(id));
    }

    @PutMapping("/records/{id}")
    public ApiResult<PptRecordVO> update(@PathVariable String id, @Validated @RequestBody PptRecordUpdateReq req) {
        return ApiResult.ok(pptService.update(id, req));
    }
}
