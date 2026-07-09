package com.gis.platform.service;

import com.gis.platform.dto.request.FlowExecuteReq;
import com.gis.platform.dto.request.FlowReq;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.FlowVO;

import java.util.List;

public interface FlowService {
    FlowVO create(FlowReq req);
    FlowVO update(String id, FlowReq req);
    FlowVO detail(String id);
    List<FlowVO> list();
    void delete(String id);
    FlowExecutionVO execute(String id, FlowExecuteReq req);
    List<FlowExecutionVO> listExecutions(String flowId);
    FlowExecutionVO executionDetail(String executionId);
}