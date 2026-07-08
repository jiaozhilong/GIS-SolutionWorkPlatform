package com.gis.platform.service;

import com.gis.platform.dto.request.ProjectReq;
import com.gis.platform.dto.response.ProjectVO;

import java.util.List;

public interface ProjectService {
    ProjectVO create(ProjectReq req);
    List<ProjectVO> list();
}

