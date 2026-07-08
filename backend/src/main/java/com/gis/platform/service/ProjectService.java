package com.gis.platform.service;

import com.gis.platform.dto.request.ProjectReq;
import com.gis.platform.dto.response.ProjectVO;

import java.util.List;

public interface ProjectService {
    ProjectVO create(ProjectReq req);
    ProjectVO update(String id, ProjectReq req);
    ProjectVO detail(String id);
    List<ProjectVO> list();
    void delete(String id);
}
