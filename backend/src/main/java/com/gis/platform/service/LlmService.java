package com.gis.platform.service;

import com.gis.platform.dto.request.LlmConfigReq;
import com.gis.platform.dto.response.LlmConfigVO;
import com.gis.platform.dto.response.LlmTestResult;
import com.gis.platform.entity.LlmConfig;

import java.util.List;

public interface LlmService {
    LlmConfigVO createConfig(LlmConfigReq req);
    LlmConfigVO updateConfig(String id, LlmConfigReq req);
    List<LlmConfigVO> listConfigs();
    void deleteConfig(String id);
    LlmTestResult testConnection(String id);
    String call(LlmConfig config, String systemPrompt, String userMessage);
}

