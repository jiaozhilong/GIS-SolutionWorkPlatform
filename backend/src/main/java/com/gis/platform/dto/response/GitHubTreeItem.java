package com.gis.platform.dto.response;

public class GitHubTreeItem {
    private String path;
    private String type;
    private Long size;
    private String sha;
    private String url;

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }
    public String getSha() { return sha; }
    public void setSha(String sha) { this.sha = sha; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
