package com.gis.platform.service;

import com.gis.platform.dto.request.PptOutlineGenerateReq;
import com.gis.platform.dto.request.ProjectFlowRunReq;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.PptRecordVO;

import java.util.List;

public interface ProjectWorkflowService {
    FlowExecutionVO runFlow(String projectId, String flowId, ProjectFlowRunReq req);
    List<FlowExecutionVO> listExecutions(String projectId);
    PptRecordVO generatePptOutline(String projectId, PptOutlineGenerateReq req);
    List<PptRecordVO> listPptRecords(String projectId);
}