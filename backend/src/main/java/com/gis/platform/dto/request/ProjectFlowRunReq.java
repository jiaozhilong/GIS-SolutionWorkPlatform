package com.gis.platform.dto.request;

import java.util.Map;

public class ProjectFlowRunReq {
    private Map<String, Object> inputContext;

    public Map<String, Object> getInputContext() { return inputContext; }
    public void setInputContext(Map<String, Object> inputContext) { this.inputContext = inputContext; }
}