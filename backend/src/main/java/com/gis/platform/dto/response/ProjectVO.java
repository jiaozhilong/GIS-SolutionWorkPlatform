package com.gis.platform.dto.response;

import com.gis.platform.entity.Project;

import java.time.LocalDateTime;

public class ProjectVO {
    private String id;
    private String name;
    private String customerName;
    private String industry;
    private String gisDomain;
    private String status;
    private String priority;
    private String description;
    private String githubRepoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectVO from(Project project) {
        ProjectVO vo = new ProjectVO();
        vo.setId(project.getId());
        vo.setName(project.getName());
        vo.setCustomerName(project.getCustomerName());
        vo.setIndustry(project.getIndustry());
        vo.setGisDomain(project.getGisDomain());
        vo.setStatus(project.getStatus());
        vo.setPriority(project.getPriority());
        vo.setDescription(project.getDescription());
        vo.setGithubRepoUrl(project.getGithubRepoUrl());
        vo.setCreatedAt(project.getCreatedAt());
        vo.setUpdatedAt(project.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getGisDomain() { return gisDomain; }
    public void setGisDomain(String gisDomain) { this.gisDomain = gisDomain; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getGithubRepoUrl() { return githubRepoUrl; }
    public void setGithubRepoUrl(String githubRepoUrl) { this.githubRepoUrl = githubRepoUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

