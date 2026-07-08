package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;

public class ProjectReq {

    @NotBlank(message = "项目名称不能为空")
    private String name;
    private String customerName;
    private String industry;
    private String gisDomain;
    private String status;
    private String priority;
    private String description;
    private String githubRepoUrl;

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
}

