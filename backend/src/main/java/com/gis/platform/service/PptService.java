package com.gis.platform.service;

import com.gis.platform.dto.request.PptGenerateReq;
import com.gis.platform.dto.request.PptRecordUpdateReq;
import com.gis.platform.dto.response.PptRecordVO;

import java.util.List;

public interface PptService {
    PptRecordVO generate(PptGenerateReq req);
    List<PptRecordVO> list(String projectId);
    PptRecordVO detail(String id);
    PptRecordVO update(String id, PptRecordUpdateReq req);
}
