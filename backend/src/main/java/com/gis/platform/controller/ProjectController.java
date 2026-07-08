package com.gis.platform.controller;

import com.gis.platform.dto.request.ProjectReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.ProjectVO;
import com.gis.platform.service.ProjectService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ApiResult<ProjectVO> create(@Validated @RequestBody ProjectReq req) {
        return ApiResult.ok(projectService.create(req));
    }

    @GetMapping
    public ApiResult<List<ProjectVO>> list() {
        return ApiResult.ok(projectService.list());
    }
}
