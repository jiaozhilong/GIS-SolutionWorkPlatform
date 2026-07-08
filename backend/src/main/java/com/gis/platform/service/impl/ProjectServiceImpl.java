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
        project.setName(req.getName());
        project.setCustomerName(req.getCustomerName());
        project.setIndustry(req.getIndustry());
        project.setGisDomain(req.getGisDomain());
        project.setStatus(defaultValue(req.getStatus(), "OPPORTUNITY"));
        project.setPriority(defaultValue(req.getPriority(), "P2"));
        project.setDescription(req.getDescription());
        project.setGithubRepoUrl(req.getGithubRepoUrl());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        projectMapper.insert(project);
        return ProjectVO.from(project);
    }

    @Override
    public List<ProjectVO> list() {
        return projectMapper.selectList(new LambdaQueryWrapper<Project>().orderByDesc(Project::getCreatedAt))
                .stream()
                .map(ProjectVO::from)
                .collect(Collectors.toList());
    }

    private String defaultValue(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}

