package com.gis.platform.controller;

import com.gis.platform.dto.request.PptOutlineGenerateReq;
import com.gis.platform.dto.request.ProjectFlowRunReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.PptRecordVO;
import com.gis.platform.service.ProjectWorkflowService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class ProjectWorkflowController {
    private final ProjectWorkflowService projectWorkflowService;

    public ProjectWorkflowController(ProjectWorkflowService projectWorkflowService) {
        this.projectWorkflowService = projectWorkflowService;
    }

    @PostMapping("/flows/{flowId}/run")
    public ApiResult<FlowExecutionVO> runFlow(@PathVariable String projectId, @PathVariable String flowId,
                                              @RequestBody(required = false) ProjectFlowRunReq req) {
        return ApiResult.ok(projectWorkflowService.runFlow(projectId, flowId, req));
    }

    @GetMapping("/flow-executions")
    public ApiResult<List<FlowExecutionVO>> listExecutions(@PathVariable String projectId) {
        return ApiResult.ok(projectWorkflowService.listExecutions(projectId));
    }

    @PostMapping("/ppt/outline/generate")
    public ApiResult<PptRecordVO> generatePptOutline(@PathVariable String projectId,
                                                     @RequestBody(required = false) PptOutlineGenerateReq req) {
        return ApiResult.ok(projectWorkflowService.generatePptOutline(projectId, req));
    }

    @GetMapping("/ppt")
    public ApiResult<List<PptRecordVO>> listPptRecords(@PathVariable String projectId) {
        return ApiResult.ok(projectWorkflowService.listPptRecords(projectId));
    }
}