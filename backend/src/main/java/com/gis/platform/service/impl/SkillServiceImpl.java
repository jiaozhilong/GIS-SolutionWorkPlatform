package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.ImaSearchReq;
import com.gis.platform.dto.request.SkillReq;
import com.gis.platform.dto.request.SkillTestReq;
import com.gis.platform.dto.response.ImaSearchResult;
import com.gis.platform.dto.response.SkillTestResult;
import com.gis.platform.dto.response.SkillVO;
import com.gis.platform.entity.LlmConfig;
import com.gis.platform.entity.Skill;
import com.gis.platform.entity.SystemLog;
import com.gis.platform.mapper.LlmConfigMapper;
import com.gis.platform.mapper.SkillMapper;
import com.gis.platform.mapper.SystemLogMapper;
import com.gis.platform.service.ImaService;
import com.gis.platform.service.LlmService;
import com.gis.platform.service.SkillService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SkillServiceImpl implements SkillService {
    private static final Pattern TEMPLATE_VAR = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*}}");

    private final SkillMapper skillMapper;
    private final LlmConfigMapper llmConfigMapper;
    private final SystemLogMapper systemLogMapper;
    private final ImaService imaService;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public SkillServiceImpl(SkillMapper skillMapper, LlmConfigMapper llmConfigMapper, SystemLogMapper systemLogMapper,
                            ImaService imaService, LlmService llmService, ObjectMapper objectMapper) {
        this.skillMapper = skillMapper;
        this.llmConfigMapper = llmConfigMapper;
        this.systemLogMapper = systemLogMapper;
        this.imaService = imaService;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    @Override
    public SkillVO create(SkillReq req) {
        Skill skill = new Skill();
        applyReq(skill, req, true);
        skill.setCreatedAt(LocalDateTime.now());
        skill.setUpdatedAt(LocalDateTime.now());
        skillMapper.insert(skill);
        return SkillVO.from(skill);
    }

    @Override
    public SkillVO update(String id, SkillReq req) {
        Skill skill = requireSkill(id);
        applyReq(skill, req, false);
        skill.setUpdatedAt(LocalDateTime.now());
        skillMapper.updateById(skill);
        return SkillVO.from(skill);
    }

    @Override
    public SkillVO detail(String id) {
        return SkillVO.from(requireSkill(id));
    }

    @Override
    public List<SkillVO> list() {
        return skillMapper.selectList(new LambdaQueryWrapper<Skill>().orderByDesc(Skill::getUpdatedAt).orderByDesc(Skill::getCreatedAt))
                .stream()
                .map(SkillVO::from)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(String id) {
        requireSkill(id);
        skillMapper.deleteById(id);
    }

    @Override
    public SkillTestResult test(String id, SkillTestReq req) {
        Skill skill = requireSkill(id);
        long start = System.currentTimeMillis();
        SkillTestResult result = new SkillTestResult();
        result.setSkillId(skill.getId());
        result.setSkillName(skill.getName());
        String status = "SUCCESS";
        String detail = null;
        try {
            Map<String, Object> input = req == null || req.getInput() == null ? Collections.emptyMap() : req.getInput();
            String renderedPrompt = renderPrompt(skill.getPromptTemplate(), input);
            result.setRenderedPrompt(renderedPrompt);

            if (isEnabled(skill.getRequiresIma())) {
                ImaSearchReq searchReq = new ImaSearchReq();
                searchReq.setKbIds(parseKbIds(skill.getImaKbIds()));
                searchReq.setQuery(renderedPrompt);
                ImaSearchResult imaResult = imaService.search(searchReq);
                result.setImaResult(imaResult);
            }

            if (isEnabled(skill.getRequiresLlm())) {
                LlmConfig llmConfig = resolveLlmConfig(skill.getLlmConfigId());
                String llmResponse = llmService.call(llmConfig, "你是一个专业的 GIS 解决方案 Skill 执行器。", renderedPrompt);
                result.setLlmResponse(llmResponse);
            }

            result.setStatus("SUCCESS");
        } catch (Exception e) {
            status = "FAILED";
            detail = e.getMessage();
            result.setStatus("FAILED");
            result.setErrorMessage(e.getMessage());
        } finally {
            result.setDurationMs(System.currentTimeMillis() - start);
            writeLog(skill.getId(), status, detail, result.getDurationMs(), safeJson(req));
        }
        return result;
    }

    private void applyReq(Skill skill, SkillReq req, boolean creating) {
        skill.setName(req.getName());
        skill.setType(req.getType());
        skill.setCategory(req.getCategory());
        skill.setVersion(defaultString(req.getVersion(), creating ? "1.0.0" : skill.getVersion()));
        skill.setDescription(req.getDescription());
        skill.setPromptTemplate(req.getPromptTemplate());
        skill.setInputSchema(req.getInputSchema());
        skill.setOutputSchema(req.getOutputSchema());
        skill.setRequiresIma(defaultInt(req.getRequiresIma(), 0));
        skill.setRequiresLlm(defaultInt(req.getRequiresLlm(), 1));
        skill.setRequiresGithub(defaultInt(req.getRequiresGithub(), 0));
        skill.setImaKbIds(req.getImaKbIds());
        skill.setLlmConfigId(req.getLlmConfigId());
        skill.setTimeoutSeconds(defaultInt(req.getTimeoutSeconds(), 60));
        skill.setRetryCount(defaultInt(req.getRetryCount(), 0));
        skill.setStatus(defaultString(req.getStatus(), "ACTIVE"));
    }

    private Skill requireSkill(String id) {
        Skill skill = skillMapper.selectById(id);
        if (skill == null) {
            throw new IllegalArgumentException("Skill 不存在: " + id);
        }
        return skill;
    }

    private LlmConfig resolveLlmConfig(String id) {
        LlmConfig config;
        if (id != null && !id.trim().isEmpty()) {
            config = llmConfigMapper.selectById(id);
        } else {
            config = llmConfigMapper.selectOne(new LambdaQueryWrapper<LlmConfig>()
                    .eq(LlmConfig::getIsActive, 1)
                    .orderByDesc(LlmConfig::getCreatedAt)
                    .last("limit 1"));
        }
        if (config == null) {
            throw new IllegalArgumentException("需要 LLM 的 Skill 未找到可用大模型配置");
        }
        return config;
    }

    private String renderPrompt(String template, Map<String, Object> input) {
        Matcher matcher = TEMPLATE_VAR.matcher(template == null ? "" : template);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            Object value = lookup(input, matcher.group(1));
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(value == null ? "" : String.valueOf(value)));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    @SuppressWarnings("unchecked")
    private Object lookup(Map<String, Object> input, String path) {
        Object current = input;
        for (String part : path.split("\\.")) {
            if (!(current instanceof Map)) {
                return null;
            }
            current = ((Map<String, Object>) current).get(part);
        }
        return current;
    }

    private List<String> parseKbIds(String value) {
        if (value == null || value.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toList());
    }

    private void writeLog(String skillId, String status, String detail, Long durationMs, String inputSnapshot) {
        SystemLog log = new SystemLog();
        log.setModule("SKILL");
        log.setAction("TEST_RUN");
        log.setRefId(skillId);
        log.setLogType("SKILL");
        log.setLevel("SUCCESS".equals(status) ? "INFO" : "ERROR");
        log.setMessage(status);
        log.setDetail(detail == null ? inputSnapshot : detail);
        log.setDurationMs(durationMs);
        log.setCreatedAt(LocalDateTime.now());
        systemLogMapper.insert(log);
    }

    private String safeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private boolean isEnabled(Integer value) {
        return value != null && value == 1;
    }

    private Integer defaultInt(Integer value, Integer fallback) {
        return value == null ? fallback : value;
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}