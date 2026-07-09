package com.gis.platform.dto.response;

public class GitHubTestResult {
    private Boolean connected;
    private Long latencyMs;
    private String message;
    private String login;
    private Integer rateLimitRemaining;

    public Boolean getConnected() { return connected; }
    public void setConnected(Boolean connected) { this.connected = connected; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public Integer getRateLimitRemaining() { return rateLimitRemaining; }
    public void setRateLimitRemaining(Integer rateLimitRemaining) { this.rateLimitRemaining = rateLimitRemaining; }
}
