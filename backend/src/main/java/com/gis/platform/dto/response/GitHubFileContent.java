package com.gis.platform.dto.response;

public class GitHubFileContent {
    private String owner;
    private String repo;
    private String path;
    private String name;
    private String sha;
    private String encoding;
    private String content;

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getRepo() { return repo; }
    public void setRepo(String repo) { this.repo = repo; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSha() { return sha; }
    public void setSha(String sha) { this.sha = sha; }
    public String getEncoding() { return encoding; }
    public void setEncoding(String encoding) { this.encoding = encoding; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
