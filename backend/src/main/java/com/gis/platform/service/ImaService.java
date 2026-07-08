package com.gis.platform.service;

import com.gis.platform.dto.request.ImaConfigReq;
import com.gis.platform.dto.request.ImaSearchReq;
import com.gis.platform.dto.response.ImaConfigVO;
import com.gis.platform.dto.response.ImaSearchResult;

import java.util.List;

public interface ImaService {
    ImaConfigVO createConfig(ImaConfigReq req);
    ImaConfigVO updateConfig(String id, ImaConfigReq req);
    List<ImaConfigVO> listConfigs();
    void deleteConfig(String id);
    boolean testConnection(String id);
    ImaSearchResult search(ImaSearchReq req);
}

