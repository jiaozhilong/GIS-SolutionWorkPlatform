package com.gis.platform.dto.response;

public class LlmTestResult {
    private Boolean connected;
    private Long latencyMs;
    private String message;
    private String responsePreview;

    public Boolean getConnected() { return connected; }
    public void setConnected(Boolean connected) { this.connected = connected; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getResponsePreview() { return responsePreview; }
    public void setResponsePreview(String responsePreview) { this.responsePreview = responsePreview; }
}

