package com.gis.platform.controller;

import com.gis.platform.dto.request.GitHubConfigReq;
import com.gis.platform.dto.response.ApiResult;
import com.gis.platform.dto.response.GitHubConfigVO;
import com.gis.platform.dto.response.GitHubFileContent;
import com.gis.platform.dto.response.GitHubTestResult;
import com.gis.platform.dto.response.GitHubTreeItem;
import com.gis.platform.service.GitHubService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/github")
public class GitHubController {
    private final GitHubService gitHubService;

    public GitHubController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    @PostMapping("/config")
    public ApiResult<GitHubConfigVO> createConfig(@Validated @RequestBody GitHubConfigReq req) {
        return ApiResult.ok(gitHubService.createConfig(req));
    }

    @PutMapping("/config/{id}")
    public ApiResult<GitHubConfigVO> updateConfig(@PathVariable String id, @Validated @RequestBody GitHubConfigReq req) {
        return ApiResult.ok(gitHubService.updateConfig(id, req));
    }

    @GetMapping("/config")
    public ApiResult<List<GitHubConfigVO>> listConfigs() {
        return ApiResult.ok(gitHubService.listConfigs());
    }

    @DeleteMapping("/config/{id}")
    public ApiResult<Boolean> deleteConfig(@PathVariable String id) {
        gitHubService.deleteConfig(id);
        return ApiResult.ok(true);
    }

    @PostMapping("/config/{id}/test")
    public ApiResult<GitHubTestResult> testConnection(@PathVariable String id) {
        return ApiResult.ok(gitHubService.testConnection(id));
    }

    @GetMapping("/repos/{owner}/{repo}/readme")
    public ApiResult<String> readReadme(@PathVariable String owner, @PathVariable String repo) {
        return ApiResult.ok(gitHubService.readReadme(owner, repo));
    }

    @GetMapping("/repos/{owner}/{repo}/tree")
    public ApiResult<List<GitHubTreeItem>> readTree(@PathVariable String owner, @PathVariable String repo) {
        return ApiResult.ok(gitHubService.readTree(owner, repo));
    }

    @GetMapping("/repos/{owner}/{repo}/file")
    public ApiResult<GitHubFileContent> readFile(@PathVariable String owner, @PathVariable String repo, @RequestParam String path) {
        return ApiResult.ok(gitHubService.readFile(owner, repo, path));
    }
}
