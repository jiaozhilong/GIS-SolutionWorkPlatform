package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.FlowExecuteReq;
import com.gis.platform.dto.request.PptOutlineGenerateReq;
import com.gis.platform.dto.request.ProjectFlowRunReq;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.PptRecordVO;
import com.gis.platform.entity.FlowExecution;
import com.gis.platform.entity.PptRecord;
import com.gis.platform.entity.Project;
import com.gis.platform.mapper.FlowExecutionMapper;
import com.gis.platform.mapper.PptRecordMapper;
import com.gis.platform.mapper.ProjectMapper;
import com.gis.platform.service.FlowService;
import com.gis.platform.service.ProjectWorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProjectWorkflowServiceImpl implements ProjectWorkflowService {
    private final ProjectMapper projectMapper;
    private final FlowExecutionMapper flowExecutionMapper;
    private final PptRecordMapper pptRecordMapper;
    private final FlowService flowService;
    private final ObjectMapper objectMapper;

    public ProjectWorkflowServiceImpl(ProjectMapper projectMapper, FlowExecutionMapper flowExecutionMapper,
                                      PptRecordMapper pptRecordMapper, FlowService flowService,
                                      ObjectMapper objectMapper) {
        this.projectMapper = projectMapper;
        this.flowExecutionMapper = flowExecutionMapper;
        this.pptRecordMapper = pptRecordMapper;
        this.flowService = flowService;
        this.objectMapper = objectMapper;
    }

    @Override
    public FlowExecutionVO runFlow(String projectId, String flowId, ProjectFlowRunReq req) {
        Project project = requireProject(projectId);
        Map<String, Object> input = buildProjectContext(project);
        if (req != null && req.getInputContext() != null) {
            input.putAll(req.getInputContext());
        }
        FlowExecuteReq executeReq = new FlowExecuteReq();
        executeReq.setProjectId(projectId);
        executeReq.setInputContext(input);
        return flowService.execute(flowId, executeReq);
    }

    @Override
    public List<FlowExecutionVO> listExecutions(String projectId) {
        requireProject(projectId);
        return flowExecutionMapper.selectList(new LambdaQueryWrapper<FlowExecution>()
                        .eq(FlowExecution::getProjectId, projectId)
                        .orderByDesc(FlowExecution::getCreatedAt))
                .stream()
                .map(FlowExecutionVO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PptRecordVO generatePptOutline(String projectId, PptOutlineGenerateReq req) {
        Project project = requireProject(projectId);
        FlowExecution execution = resolveExecution(projectId, req == null ? null : req.getExecutionId());
        if (execution == null) {
            throw new IllegalArgumentException("请先为该项目执行一次流程，再生成 PPT 大纲");
        }
        if (!"SUCCESS".equals(execution.getStatus())) {
            throw new IllegalArgumentException("只能基于成功的流程执行生成 PPT 大纲");
        }

        Map<String, Object> output = parseJsonMap(execution.getOutputContext());
        List<Map<String, Object>> outline = buildOutline(project, execution, output);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("project", buildProjectContext(project));
        content.put("sourceExecutionId", execution.getId());
        content.put("flowId", execution.getFlowId());
        content.put("summary", summarizeOutput(output));
        content.put("outline", outline);

        PptRecord record = new PptRecord();
        record.setProjectId(projectId);
        record.setTitle(defaultString(req == null ? null : req.getTitle(), project.getName() + " 解决方案汇报"));
        record.setOutlineJson(toJson(outline));
        record.setContentJson(toJson(content));
        record.setStatus("DRAFT");
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        pptRecordMapper.insert(record);
        return PptRecordVO.from(record);
    }

    @Override
    public List<PptRecordVO> listPptRecords(String projectId) {
        requireProject(projectId);
        return pptRecordMapper.selectList(new LambdaQueryWrapper<PptRecord>()
                        .eq(PptRecord::getProjectId, projectId)
                        .orderByDesc(PptRecord::getCreatedAt))
                .stream()
                .map(PptRecordVO::from)
                .collect(Collectors.toList());
    }

    private Project requireProject(String projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new IllegalArgumentException("项目不存在: " + projectId);
        }
        return project;
    }

    private FlowExecution resolveExecution(String projectId, String executionId) {
        if (executionId != null && !executionId.trim().isEmpty()) {
            FlowExecution execution = flowExecutionMapper.selectById(executionId);
            if (execution == null || !projectId.equals(execution.getProjectId())) {
                throw new IllegalArgumentException("流程执行记录不存在或不属于当前项目");
            }
            return execution;
        }
        List<FlowExecution> executions = flowExecutionMapper.selectList(new LambdaQueryWrapper<FlowExecution>()
                .eq(FlowExecution::getProjectId, projectId)
                .eq(FlowExecution::getStatus, "SUCCESS")
                .orderByDesc(FlowExecution::getCreatedAt)
                .last("LIMIT 1"));
        return executions.isEmpty() ? null : executions.get(0);
    }

    private Map<String, Object> buildProjectContext(Project project) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("projectId", project.getId());
        context.put("projectName", project.getName());
        context.put("customerName", project.getCustomerName());
        context.put("industry", project.getIndustry());
        context.put("gisDomain", project.getGisDomain());
        context.put("status", project.getStatus());
        context.put("priority", project.getPriority());
        context.put("description", project.getDescription());
        context.put("githubRepoUrl", project.getGithubRepoUrl());
        return context;
    }

    private List<Map<String, Object>> buildOutline(Project project, FlowExecution execution, Map<String, Object> output) {
        List<Map<String, Object>> outline = new ArrayList<>();
        outline.add(section("封面", project.getName(), "客户：" + defaultString(project.getCustomerName(), "待补充")));
        outline.add(section("项目背景", defaultString(project.getIndustry(), "GIS") + "行业场景", defaultString(project.getDescription(), "围绕客户现状、痛点和目标展开。")));
        outline.add(section("需求分析", "流程执行结果", summarizeOutput(output)));
        outline.add(section("解决方案", "GIS 能力组合", "围绕数据治理、时空底座、业务应用、AI 助手和集成交付展开。"));
        outline.add(section("实施路径", "里程碑计划", "需求确认、原型设计、平台建设、联调验收、试运行与推广。"));
        outline.add(section("项目总结", "执行记录 " + execution.getId(), "沉淀可复用方案资产，后续可继续生成 Word/PPT/架构图。"));
        return outline;
    }

    private Map<String, Object> section(String title, String subtitle, String keyPoint) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", title);
        item.put("subtitle", subtitle);
        item.put("keyPoint", keyPoint);
        return item;
    }

    private String summarizeOutput(Map<String, Object> output) {
        if (output == null || output.isEmpty()) {
            return "流程已完成，暂无可解析的节点输出。";
        }
        Object nodeOutputs = output.get("nodeOutputs");
        if (nodeOutputs != null) {
            String text = String.valueOf(nodeOutputs);
            return text.length() > 500 ? text.substring(0, 500) + "..." : text;
        }
        String text = output.toString();
        return text.length() > 500 ? text.substring(0, 500) + "..." : text;
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            Map<String, Object> raw = new LinkedHashMap<>();
            raw.put("raw", json);
            return raw;
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("JSON 序列化失败: " + e.getMessage());
        }
    }

    private String defaultString(String value, String defaultValue) {
        return value == null || value.trim().isEmpty() ? defaultValue : value;
    }
}