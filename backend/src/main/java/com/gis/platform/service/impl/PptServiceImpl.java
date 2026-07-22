package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.PptGenerateReq;
import com.gis.platform.dto.request.PptRecordUpdateReq;
import com.gis.platform.dto.response.PptRecordVO;
import com.gis.platform.entity.FlowExecution;
import com.gis.platform.entity.PptRecord;
import com.gis.platform.entity.Project;
import com.gis.platform.mapper.FlowExecutionMapper;
import com.gis.platform.mapper.PptRecordMapper;
import com.gis.platform.mapper.ProjectMapper;
import com.gis.platform.service.PptService;
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
public class PptServiceImpl implements PptService {
    private final ProjectMapper projectMapper;
    private final FlowExecutionMapper flowExecutionMapper;
    private final PptRecordMapper pptRecordMapper;
    private final ObjectMapper objectMapper;

    public PptServiceImpl(ProjectMapper projectMapper, FlowExecutionMapper flowExecutionMapper,
                          PptRecordMapper pptRecordMapper, ObjectMapper objectMapper) {
        this.projectMapper = projectMapper;
        this.flowExecutionMapper = flowExecutionMapper;
        this.pptRecordMapper = pptRecordMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public PptRecordVO generate(PptGenerateReq req) {
        if (req == null || !hasText(req.getProjectId())) {
            throw new IllegalArgumentException("projectId 不能为空");
        }
        Project project = requireProject(req.getProjectId());
        FlowExecution execution = resolveExecution(project.getId(), req.getExecutionId());
        if (execution == null) {
            throw new IllegalArgumentException("请先为该项目执行一次成功流程，再生成 PPT 内容");
        }
        if (!"SUCCESS".equals(execution.getStatus())) {
            throw new IllegalArgumentException("只能基于成功的流程执行生成 PPT 内容");
        }

        Map<String, Object> output = parseJsonMap(execution.getOutputContext());
        List<Map<String, Object>> slides = buildSlides(project, execution, output);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("version", "1.0");
        content.put("projectId", project.getId());
        content.put("sourceExecutionId", execution.getId());
        content.put("slides", slides);

        PptRecord record = new PptRecord();
        record.setProjectId(project.getId());
        record.setTitle(defaultString(req.getTitle(), project.getName() + " 解决方案汇报"));
        record.setOutlineJson(toJson(buildOutline(slides)));
        record.setContentJson(toJson(content));
        record.setStatus("EDITING");
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        pptRecordMapper.insert(record);
        return PptRecordVO.from(record);
    }

    @Override
    public List<PptRecordVO> list(String projectId) {
        LambdaQueryWrapper<PptRecord> wrapper = new LambdaQueryWrapper<>();
        if (hasText(projectId)) {
            wrapper.eq(PptRecord::getProjectId, projectId.trim());
        }
        wrapper.orderByDesc(PptRecord::getUpdatedAt).orderByDesc(PptRecord::getCreatedAt);
        return pptRecordMapper.selectList(wrapper).stream().map(PptRecordVO::from).collect(Collectors.toList());
    }

    @Override
    public PptRecordVO detail(String id) {
        return PptRecordVO.from(requireRecord(id));
    }

    @Override
    public PptRecordVO update(String id, PptRecordUpdateReq req) {
        PptRecord record = requireRecord(id);
        record.setTitle(req.getTitle());
        record.setOutlineJson(req.getOutlineJson());
        record.setContentJson(req.getContentJson());
        record.setStatus(defaultString(req.getStatus(), "EDITING"));
        record.setUpdatedAt(LocalDateTime.now());
        pptRecordMapper.updateById(record);
        return PptRecordVO.from(record);
    }

    private List<Map<String, Object>> buildSlides(Project project, FlowExecution execution, Map<String, Object> output) {
        List<Map<String, Object>> slides = new ArrayList<>();
        slides.add(slide("cover", project.getName() + " 解决方案汇报",
                list("客户：" + defaultString(project.getCustomerName(), "待补充"),
                        "行业：" + defaultString(project.getIndustry(), "GIS"),
                        "阶段：" + defaultString(project.getStatus(), "方案编制")),
                "封面页突出项目名称、客户和汇报主题。",
                "建议使用城市三维底图、自然资源一张图或业务系统截图作为主视觉。"));
        slides.add(slide("background", "项目背景与建设目标",
                list(defaultString(project.getDescription(), "围绕客户现状、业务痛点和建设目标展开。"),
                        "统一沉淀数据、平台、应用和 AI 能力。",
                        "形成可持续演进的 GIS 解决方案底座。"),
                "说明客户为什么需要本次建设，以及本次方案要解决的核心问题。",
                "使用现状架构图、业务流程图或地图数据分布图。"));
        slides.add(slide("analysis", "需求分析与关键能力",
                list("流程执行记录：" + execution.getId(),
                        "关键输出：" + summarizeOutput(output),
                        "建议拆解为数据治理、空间分析、专题应用、集成运维四类能力。"),
                "把流程分析结果翻译成客户能理解的业务能力清单。",
                "使用能力矩阵或需求优先级四象限。"));
        slides.add(slide("solution", "总体解决方案",
                list("建设统一时空数据底座。",
                        "提供二三维一体化 GIS 展示与分析服务。",
                        "联动审批、监管、运营等业务系统。",
                        "通过 Skill/Flow 机制沉淀 AI 辅助方案生产能力。"),
                "这一页讲清楚总体架构和模块分工。",
                "使用平台架构图或分层能力图。"));
        slides.add(slide("roadmap", "实施路径与交付计划",
                list("需求确认与资料梳理。",
                        "原型设计与数据接入。",
                        "平台建设与业务联调。",
                        "试运行、培训与验收。",
                        "模板、流程和知识资产持续运营。"),
                "按阶段说明交付节奏、责任边界和验收口径。",
                "使用时间轴或里程碑甘特图。"));
        slides.add(slide("summary", "项目价值与下一步",
                list("提升方案编制效率和交付一致性。",
                        "支撑客户 GIS 业务的一体化展示、分析和决策。",
                        "下一步可继续生成 Word 方案、PPT 精修和架构图。"),
                "收束价值，明确下一步行动建议。",
                "使用价值指标卡或交付物清单。"));
        return slides;
    }

    private Map<String, Object> slide(String type, String title, List<String> bullets, String speakerNotes, String imageSuggestion) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("type", type);
        item.put("title", title);
        item.put("bullets", bullets);
        item.put("speakerNotes", speakerNotes);
        item.put("imageSuggestion", imageSuggestion);
        return item;
    }

    private List<Map<String, Object>> buildOutline(List<Map<String, Object>> slides) {
        List<Map<String, Object>> outline = new ArrayList<>();
        for (int i = 0; i < slides.size(); i++) {
            Map<String, Object> slide = slides.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("page", i + 1);
            item.put("title", slide.get("title"));
            item.put("keyPoint", firstBullet(slide.get("bullets")));
            outline.add(item);
        }
        return outline;
    }

    @SuppressWarnings("unchecked")
    private String firstBullet(Object bullets) {
        if (bullets instanceof List && !((List<Object>) bullets).isEmpty()) {
            return String.valueOf(((List<Object>) bullets).get(0));
        }
        return "";
    }

    private Project requireProject(String projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new IllegalArgumentException("项目不存在: " + projectId);
        }
        return project;
    }

    private PptRecord requireRecord(String id) {
        PptRecord record = pptRecordMapper.selectById(id);
        if (record == null) {
            throw new IllegalArgumentException("PPT 记录不存在: " + id);
        }
        return record;
    }

    private FlowExecution resolveExecution(String projectId, String executionId) {
        if (hasText(executionId)) {
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

    private Map<String, Object> parseJsonMap(String json) {
        if (!hasText(json)) {
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

    private String summarizeOutput(Map<String, Object> output) {
        if (output == null || output.isEmpty()) {
            return "流程已完成，暂无可解析的节点输出。";
        }
        Object nodeOutputs = output.get("nodeOutputs");
        String text = String.valueOf(nodeOutputs == null ? output : nodeOutputs);
        return text.length() > 260 ? text.substring(0, 260) + "..." : text;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("JSON 序列化失败: " + e.getMessage());
        }
    }

    private List<String> list(String... values) {
        List<String> result = new ArrayList<>();
        Collections.addAll(result, values);
        return result;
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
