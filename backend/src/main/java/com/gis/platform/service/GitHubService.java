package com.gis.platform.service;

import com.gis.platform.dto.request.GitHubConfigReq;
import com.gis.platform.dto.response.GitHubConfigVO;
import com.gis.platform.dto.response.GitHubFileContent;
import com.gis.platform.dto.response.GitHubTestResult;
import com.gis.platform.dto.response.GitHubTreeItem;

import java.util.List;

public interface GitHubService {
    GitHubConfigVO createConfig(GitHubConfigReq req);
    GitHubConfigVO updateConfig(String id, GitHubConfigReq req);
    List<GitHubConfigVO> listConfigs();
    void deleteConfig(String id);
    GitHubTestResult testConnection(String id);
    String readReadme(String owner, String repo);
    List<GitHubTreeItem> readTree(String owner, String repo);
    GitHubFileContent readFile(String owner, String repo, String path);
}
