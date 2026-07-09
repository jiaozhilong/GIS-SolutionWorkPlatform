package com.gis.platform.service;

import com.gis.platform.dto.request.SystemLogQueryReq;
import com.gis.platform.dto.response.SystemLogPageVO;

public interface SystemLogService {
    SystemLogPageVO page(SystemLogQueryReq req);
}