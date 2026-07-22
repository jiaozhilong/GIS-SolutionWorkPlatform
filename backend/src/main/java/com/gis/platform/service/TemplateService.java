package com.gis.platform.service;

import com.gis.platform.dto.request.TemplateReq;
import com.gis.platform.dto.response.TemplateVO;

import java.util.List;

public interface TemplateService {
    TemplateVO create(TemplateReq req);
    TemplateVO update(String id, TemplateReq req);
    TemplateVO detail(String id);
    List<TemplateVO> list(String type, String category, String keyword);
    void delete(String id);
    void ensurePresetTemplates();
}
