package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gis.platform.dto.request.ProjectReq;
import com.gis.platform.dto.response.ProjectVO;
import com.gis.platform.entity.Project;
import com.gis.platform.mapper.ProjectMapper;
import com.gis.platform.service.ProjectService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectMapper projectMapper;

    public ProjectServiceImpl(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    @Override
    public ProjectVO create(ProjectReq req) {
        Project project = new Project();
        applyReq(project, req);
        project.setStatus(defaultValue(project.getStatus(), "OPPORTUNITY"));
        project.setPriority(defaultValue(project.getPriority(), "P2"));
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        projectMapper.insert(project);
        return ProjectVO.from(project);
    }

    @Override
    public ProjectVO update(String id, ProjectReq req) {
        Project project = requireProject(id);
        applyReq(project, req);
        project.setUpdatedAt(LocalDateTime.now());
        projectMapper.updateById(project);
        return ProjectVO.from(project);
    }

    @Override
    public ProjectVO detail(String id) {
        return ProjectVO.from(requireProject(id));
    }

    @Override
    public List<ProjectVO> list() {
        return projectMapper.selectList(new LambdaQueryWrapper<Project>().orderByDesc(Project::getCreatedAt))
                .stream()
                .map(ProjectVO::from)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(String id) {
        requireProject(id);
        projectMapper.deleteById(id);
    }

    private Project requireProject(String id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new IllegalArgumentException("项目不存在: " + id);
        }
        return project;
    }

    private void applyReq(Project project, ProjectReq req) {
        project.setName(req.getName());
        project.setCustomerName(req.getCustomerName());
        project.setIndustry(req.getIndustry());
        project.setGisDomain(req.getGisDomain());
        project.setStatus(req.getStatus());
        project.setPriority(req.getPriority());
        project.setDescription(req.getDescription());
        project.setGithubRepoUrl(req.getGithubRepoUrl());
    }

    private String defaultValue(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
