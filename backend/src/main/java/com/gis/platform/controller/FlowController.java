package com.gis.platform.controller;

import com.gis.platform.dto.request.FlowExecuteReq;
import com.gis.platform.dto.request.FlowReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.FlowVO;
import com.gis.platform.service.FlowService;
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
@RequestMapping("/api")
public class FlowController {
    private final FlowService flowService;

    public FlowController(FlowService flowService) { this.flowService = flowService; }

    @PostMapping("/flows")
    public ApiResult<FlowVO> create(@Validated @RequestBody FlowReq req) { return ApiResult.ok(flowService.create(req)); }

    @PutMapping("/flows/{id}")
    public ApiResult<FlowVO> update(@PathVariable String id, @Validated @RequestBody FlowReq req) { return ApiResult.ok(flowService.update(id, req)); }

    @GetMapping("/flows/{id}")
    public ApiResult<FlowVO> detail(@PathVariable String id) { return ApiResult.ok(flowService.detail(id)); }

    @GetMapping("/flows")
    public ApiResult<List<FlowVO>> list() { return ApiResult.ok(flowService.list()); }

    @DeleteMapping("/flows/{id}")
    public ApiResult<Boolean> delete(@PathVariable String id) { flowService.delete(id); return ApiResult.ok(true); }

    @PostMapping("/flows/{id}/execute")
    public ApiResult<FlowExecutionVO> execute(@PathVariable String id, @RequestBody(required = false) FlowExecuteReq req) { return ApiResult.ok(flowService.execute(id, req)); }

    @GetMapping("/flows/{id}/executions")
    public ApiResult<List<FlowExecutionVO>> listExecutions(@PathVariable String id) { return ApiResult.ok(flowService.listExecutions(id)); }

    @GetMapping("/flow-executions/{id}")
    public ApiResult<FlowExecutionVO> executionDetail(@PathVariable String id) { return ApiResult.ok(flowService.executionDetail(id)); }
}