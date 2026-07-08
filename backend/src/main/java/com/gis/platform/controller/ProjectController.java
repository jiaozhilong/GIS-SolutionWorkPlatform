package com.gis.platform.controller;

import com.gis.platform.dto.request.ProjectReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.ProjectVO;
import com.gis.platform.service.ProjectService;
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

    @PutMapping("/{id}")
    public ApiResult<ProjectVO> update(@PathVariable String id, @Validated @RequestBody ProjectReq req) {
        return ApiResult.ok(projectService.update(id, req));
    }

    @GetMapping("/{id}")
    public ApiResult<ProjectVO> detail(@PathVariable String id) {
        return ApiResult.ok(projectService.detail(id));
    }

    @GetMapping
    public ApiResult<List<ProjectVO>> list() {
        return ApiResult.ok(projectService.list());
    }

    @DeleteMapping("/{id}")
    public ApiResult<Boolean> delete(@PathVariable String id) {
        projectService.delete(id);
        return ApiResult.ok(true);
    }
}
