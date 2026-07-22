package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.TemplateReq;
import com.gis.platform.dto.response.TemplateVO;
import com.gis.platform.entity.Template;
import com.gis.platform.mapper.TemplateMapper;
import com.gis.platform.service.TemplateService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class TemplateServiceImpl implements TemplateService {
    private static final Pattern TEMPLATE_VAR = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*}}");

    private final TemplateMapper templateMapper;
    private final ObjectMapper objectMapper;

    public TemplateServiceImpl(TemplateMapper templateMapper, ObjectMapper objectMapper) {
        this.templateMapper = templateMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public TemplateVO create(TemplateReq req) {
        Template template = new Template();
        applyReq(template, req);
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        templateMapper.insert(template);
        return TemplateVO.from(template);
    }

    @Override
    public TemplateVO update(String id, TemplateReq req) {
        Template template = requireTemplate(id);
        applyReq(template, req);
        template.setUpdatedAt(LocalDateTime.now());
        templateMapper.updateById(template);
        return TemplateVO.from(template);
    }

    @Override
    public TemplateVO detail(String id) {
        return TemplateVO.from(requireTemplate(id));
    }

    @Override
    public List<TemplateVO> list(String type, String category, String keyword) {
        LambdaQueryWrapper<Template> wrapper = new LambdaQueryWrapper<>();
        if (hasText(type)) {
            wrapper.eq(Template::getType, type.trim());
        }
        if (hasText(category)) {
            wrapper.eq(Template::getCategory, category.trim());
        }
        if (hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(item -> item.like(Template::getName, value).or().like(Template::getContent, value));
        }
        wrapper.orderByDesc(Template::getIsSystem).orderByDesc(Template::getUpdatedAt).orderByDesc(Template::getCreatedAt);
        return templateMapper.selectList(wrapper).stream().map(TemplateVO::from).collect(Collectors.toList());
    }

    @Override
    public void delete(String id) {
        Template template = requireTemplate(id);
        if (Integer.valueOf(1).equals(template.getIsSystem())) {
            throw new IllegalArgumentException("系统预置模板不能删除");
        }
        templateMapper.deleteById(id);
    }

    @Override
    public void ensurePresetTemplates() {
        if (templateMapper.selectCount(new LambdaQueryWrapper<Template>().eq(Template::getIsSystem, 1)) > 0) {
            return;
        }
        preset("智慧城市综合解决方案模板", "PROPOSAL", "智慧城市",
                "# {{projectName}}\n\n## 1. 项目背景\n面向 {{customerName}} 的智慧城市建设目标，围绕 {{businessScenario}} 构建统一时空底座。\n\n## 2. 建设内容\n- 数据资源治理\n- 二三维 GIS 一体化展示\n- 业务专题应用\n- 运维与安全体系\n\n## 3. 实施计划\n建议以 {{deliveryTime}} 为周期分阶段交付。");
        preset("自然资源一张图升级模板", "PROPOSAL", "自然资源",
                "# {{projectName}}\n\n## 1. 现状分析\n客户已有 {{existingSystems}}，需要通过一张图能力提升数据汇聚、分析和协同审批效率。\n\n## 2. 总体方案\n建设自然资源时空数据底座、专题图层管理、空间分析服务和业务联动门户。\n\n## 3. 价值呈现\n支撑规划、用地、确权、监管等场景的一体化决策。");
        preset("GIS 投标技术响应模板", "BID", "投标",
                "# {{projectName}} 技术响应\n\n## 技术路线\n采用 {{techStack}}，围绕数据、平台、应用、安全四层展开。\n\n## 服务承诺\n项目团队按 {{deliveryTime}} 完成方案深化、开发实施、部署培训和验收支持。");
    }

    private void preset(String name, String type, String category, String content) {
        TemplateReq req = new TemplateReq();
        req.setName(name);
        req.setType(type);
        req.setCategory(category);
        req.setContent(content);
        req.setIsSystem(1);
        create(req);
    }

    private void applyReq(Template template, TemplateReq req) {
        template.setName(req.getName());
        template.setType(req.getType());
        template.setCategory(req.getCategory());
        template.setContent(req.getContent());
        template.setIsSystem(req.getIsSystem() == null ? 0 : req.getIsSystem());
        template.setVariablesJson(hasText(req.getVariablesJson()) ? req.getVariablesJson() : extractVariablesJson(req.getContent()));
    }

    private Template requireTemplate(String id) {
        Template template = templateMapper.selectById(id);
        if (template == null) {
            throw new IllegalArgumentException("模板不存在: " + id);
        }
        return template;
    }

    private String extractVariablesJson(String content) {
        Set<String> variables = new LinkedHashSet<>();
        Matcher matcher = TEMPLATE_VAR.matcher(content == null ? "" : content);
        while (matcher.find()) {
            variables.add(matcher.group(1));
        }
        List<String> result = new ArrayList<>(variables);
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
