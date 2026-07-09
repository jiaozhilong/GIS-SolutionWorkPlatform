package com.gis.platform.service;

import com.gis.platform.dto.request.SkillReq;
import com.gis.platform.dto.request.SkillTestReq;
import com.gis.platform.dto.response.SkillTestResult;
import com.gis.platform.dto.response.SkillVO;

import java.util.List;

public interface SkillService {
    SkillVO create(SkillReq req);
    SkillVO update(String id, SkillReq req);
    SkillVO detail(String id);
    List<SkillVO> list();
    void delete(String id);
    SkillTestResult test(String id, SkillTestReq req);
}