package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gis.platform.dto.request.FlowExecuteReq;
import com.gis.platform.dto.request.FlowReq;
import com.gis.platform.dto.request.SkillTestReq;
import com.gis.platform.dto.response.FlowEdgeVO;
import com.gis.platform.dto.response.FlowExecutionVO;
import com.gis.platform.dto.response.FlowNodeVO;
import com.gis.platform.dto.response.FlowVO;
import com.gis.platform.dto.response.SkillTestResult;
import com.gis.platform.entity.Flow;
import com.gis.platform.entity.FlowEdge;
import com.gis.platform.entity.FlowExecution;
import com.gis.platform.entity.FlowNode;
import com.gis.platform.entity.SystemLog;
import com.gis.platform.mapper.FlowEdgeMapper;
import com.gis.platform.mapper.FlowExecutionMapper;
import com.gis.platform.mapper.FlowMapper;
import com.gis.platform.mapper.FlowNodeMapper;
import com.gis.platform.mapper.SystemLogMapper;
import com.gis.platform.service.FlowService;
import com.gis.platform.service.SkillService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.stream.Collectors;

@Service
public class FlowServiceImpl implements FlowService {
    private final FlowMapper flowMapper;
    private final FlowNodeMapper flowNodeMapper;
    private final FlowEdgeMapper flowEdgeMapper;
    private final FlowExecutionMapper flowExecutionMapper;
    private final SystemLogMapper systemLogMapper;
    private final SkillService skillService;
    private final ObjectMapper objectMapper;

    public FlowServiceImpl(FlowMapper flowMapper, FlowNodeMapper flowNodeMapper, FlowEdgeMapper flowEdgeMapper,
                           FlowExecutionMapper flowExecutionMapper, SystemLogMapper systemLogMapper,
                           SkillService skillService, ObjectMapper objectMapper) {
        this.flowMapper = flowMapper;
        this.flowNodeMapper = flowNodeMapper;
        this.flowEdgeMapper = flowEdgeMapper;
        this.flowExecutionMapper = flowExecutionMapper;
        this.systemLogMapper = systemLogMapper;
        this.skillService = skillService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public FlowVO create(FlowReq req) {
        Flow flow = new Flow();
        applyReq(flow, req, true);
        flow.setCreatedAt(LocalDateTime.now());
        flow.setUpdatedAt(LocalDateTime.now());
        flowMapper.insert(flow);
        saveNodesAndEdges(flow.getId(), req);
        return detail(flow.getId());
    }

    @Override
    @Transactional
    public FlowVO update(String id, FlowReq req) {
        Flow flow = requireFlow(id);
        applyReq(flow, req, false);
        flow.setUpdatedAt(LocalDateTime.now());
        flowMapper.updateById(flow);
        flowEdgeMapper.delete(new LambdaQueryWrapper<FlowEdge>().eq(FlowEdge::getFlowId, id));
        flowNodeMapper.delete(new LambdaQueryWrapper<FlowNode>().eq(FlowNode::getFlowId, id));
        saveNodesAndEdges(id, req);
        return detail(id);
    }

    @Override
    public FlowVO detail(String id) {
        Flow flow = requireFlow(id);
        FlowVO vo = FlowVO.from(flow);
        vo.setNodes(nodes(id).stream().map(FlowNodeVO::from).collect(Collectors.toList()));
        vo.setEdges(edges(id).stream().map(FlowEdgeVO::from).collect(Collectors.toList()));
        return vo;
    }

    @Override
    public List<FlowVO> list() {
        return flowMapper.selectList(new LambdaQueryWrapper<Flow>().orderByDesc(Flow::getUpdatedAt).orderByDesc(Flow::getCreatedAt))
                .stream()
                .map(flow -> {
                    FlowVO vo = FlowVO.from(flow);
                    vo.setNodes(nodes(flow.getId()).stream().map(FlowNodeVO::from).collect(Collectors.toList()));
                    vo.setEdges(edges(flow.getId()).stream().map(FlowEdgeVO::from).collect(Collectors.toList()));
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(String id) {
        requireFlow(id);
        flowEdgeMapper.delete(new LambdaQueryWrapper<FlowEdge>().eq(FlowEdge::getFlowId, id));
        flowNodeMapper.delete(new LambdaQueryWrapper<FlowNode>().eq(FlowNode::getFlowId, id));
        flowMapper.deleteById(id);
    }

    @Override
    public FlowExecutionVO execute(String id, FlowExecuteReq req) {
        Flow flow = requireFlow(id);
        List<FlowNode> nodeList = nodes(id);
        List<FlowEdge> edgeList = edges(id);
        if (nodeList.isEmpty()) {
            throw new IllegalArgumentException("流程至少需要一个节点");
        }
        List<FlowNode> ordered = topologicalSort(nodeList, edgeList);
        FlowExecution execution = new FlowExecution();
        execution.setFlowId(flow.getId());
        execution.setFlowVersion(flow.getVersion());
        execution.setProjectId(req == null ? null : req.getProjectId());
        execution.setTriggerType("MANUAL");
        execution.setInputContext(toJson(req == null ? Collections.emptyMap() : defaultMap(req.getInputContext())));
        execution.setStatus("RUNNING");
        execution.setStartedAt(LocalDateTime.now());
        execution.setCreatedAt(LocalDateTime.now());
        flowExecutionMapper.insert(execution);

        long start = System.currentTimeMillis();
        Map<String, Object> context = new LinkedHashMap<>(req == null ? Collections.emptyMap() : defaultMap(req.getInputContext()));
        Map<String, Object> nodeOutputs = new LinkedHashMap<>();
        String status = "SUCCESS";
        String error = null;
        try {
            for (FlowNode node : ordered) {
                Map<String, Object> nodeInput = new LinkedHashMap<>(context);
                nodeInput.putAll(parseOverrides(node.getParamOverrides()));
                SkillTestReq skillReq = new SkillTestReq();
                skillReq.setInput(nodeInput);
                SkillTestResult skillResult = skillService.test(node.getSkillId(), skillReq);
                if (!"SUCCESS".equals(skillResult.getStatus())) {
                    throw new IllegalArgumentException("节点执行失败: " + node.getNodeName() + " - " + skillResult.getErrorMessage());
                }
                Map<String, Object> output = objectMapper.convertValue(skillResult, new TypeReference<Map<String, Object>>() {});
                nodeOutputs.put(node.getId(), output);
                context.put(node.getNodeName(), output);
            }
        } catch (Exception e) {
            status = "FAILED";
            error = e.getMessage();
        }
        Map<String, Object> outputContext = new LinkedHashMap<>();
        outputContext.put("status", status);
        outputContext.put("error", error);
        outputContext.put("nodeOutputs", nodeOutputs);
        outputContext.put("context", context);
        execution.setStatus(status);
        execution.setOutputContext(toJson(outputContext));
        execution.setFinishedAt(LocalDateTime.now());
        flowExecutionMapper.updateById(execution);
        writeLog(flow.getId(), execution.getId(), status, error, System.currentTimeMillis() - start);
        return FlowExecutionVO.from(execution);
    }

    @Override
    public List<FlowExecutionVO> listExecutions(String flowId) {
        requireFlow(flowId);
        return flowExecutionMapper.selectList(new LambdaQueryWrapper<FlowExecution>().eq(FlowExecution::getFlowId, flowId).orderByDesc(FlowExecution::getCreatedAt))
                .stream().map(FlowExecutionVO::from).collect(Collectors.toList());
    }

    @Override
    public FlowExecutionVO executionDetail(String executionId) {
        FlowExecution execution = flowExecutionMapper.selectById(executionId);
        if (execution == null) {
            throw new IllegalArgumentException("流程执行记录不存在: " + executionId);
        }
        return FlowExecutionVO.from(execution);
    }

    private void applyReq(Flow flow, FlowReq req, boolean creating) {
        flow.setName(req.getName());
        flow.setDescription(req.getDescription());
        flow.setCategory(req.getCategory());
        flow.setVersion(defaultString(req.getVersion(), creating ? "1.0.0" : flow.getVersion()));
        flow.setStatus(defaultString(req.getStatus(), "ACTIVE"));
    }

    private void saveNodesAndEdges(String flowId, FlowReq req) {
        Map<String, String> idMap = new HashMap<>();
        if (req.getNodes() != null) {
            req.getNodes().forEach(nodeReq -> {
                FlowNode node = new FlowNode();
                node.setFlowId(flowId);
                node.setSkillId(nodeReq.getSkillId());
                node.setNodeName(nodeReq.getNodeName());
                node.setPositionX(nodeReq.getPositionX() == null ? 0 : nodeReq.getPositionX());
                node.setPositionY(nodeReq.getPositionY() == null ? 0 : nodeReq.getPositionY());
                node.setParamOverrides(nodeReq.getParamOverrides());
                node.setTimeoutSeconds(nodeReq.getTimeoutSeconds());
                node.setRetryCount(nodeReq.getRetryCount() == null ? 0 : nodeReq.getRetryCount());
                flowNodeMapper.insert(node);
                if (nodeReq.getClientId() != null && !nodeReq.getClientId().trim().isEmpty()) {
                    idMap.put(nodeReq.getClientId(), node.getId());
                }
                idMap.put(node.getId(), node.getId());
            });
        }
        if (req.getEdges() != null) {
            req.getEdges().forEach(edgeReq -> {
                FlowEdge edge = new FlowEdge();
                edge.setFlowId(flowId);
                edge.setSourceNodeId(resolveNodeId(idMap, edgeReq.getSourceNodeId()));
                edge.setTargetNodeId(resolveNodeId(idMap, edgeReq.getTargetNodeId()));
                flowEdgeMapper.insert(edge);
            });
        }
    }

    private String resolveNodeId(Map<String, String> idMap, String id) {
        String resolved = idMap.get(id);
        if (resolved == null) {
            throw new IllegalArgumentException("流程边引用了不存在的节点: " + id);
        }
        return resolved;
    }

    private List<FlowNode> topologicalSort(List<FlowNode> nodeList, List<FlowEdge> edgeList) {
        Map<String, FlowNode> nodeMap = nodeList.stream().collect(Collectors.toMap(FlowNode::getId, node -> node));
        Map<String, Integer> indegree = new HashMap<>();
        Map<String, List<String>> adjacency = new HashMap<>();
        nodeList.forEach(node -> { indegree.put(node.getId(), 0); adjacency.put(node.getId(), new ArrayList<>()); });
        for (FlowEdge edge : edgeList) {
            if (!nodeMap.containsKey(edge.getSourceNodeId()) || !nodeMap.containsKey(edge.getTargetNodeId())) {
                throw new IllegalArgumentException("流程边引用了不存在的节点");
            }
            adjacency.get(edge.getSourceNodeId()).add(edge.getTargetNodeId());
            indegree.put(edge.getTargetNodeId(), indegree.get(edge.getTargetNodeId()) + 1);
        }
        Queue<String> queue = new ArrayDeque<>();
        indegree.forEach((key, value) -> { if (value == 0) queue.add(key); });
        List<FlowNode> ordered = new ArrayList<>();
        while (!queue.isEmpty()) {
            String nodeId = queue.poll();
            ordered.add(nodeMap.get(nodeId));
            for (String next : adjacency.get(nodeId)) {
                indegree.put(next, indegree.get(next) - 1);
                if (indegree.get(next) == 0) queue.add(next);
            }
        }
        if (ordered.size() != nodeList.size()) {
            throw new IllegalArgumentException("流程不是合法 DAG，请检查是否存在环路");
        }
        return ordered;
    }

    private Flow requireFlow(String id) {
        Flow flow = flowMapper.selectById(id);
        if (flow == null) throw new IllegalArgumentException("流程不存在: " + id);
        return flow;
    }

    private List<FlowNode> nodes(String flowId) {
        return flowNodeMapper.selectList(new LambdaQueryWrapper<FlowNode>().eq(FlowNode::getFlowId, flowId));
    }

    private List<FlowEdge> edges(String flowId) {
        return flowEdgeMapper.selectList(new LambdaQueryWrapper<FlowEdge>().eq(FlowEdge::getFlowId, flowId));
    }

    private Map<String, Object> parseOverrides(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("节点参数覆盖必须是 JSON 对象: " + e.getMessage());
        }
    }

    private Map<String, Object> defaultMap(Map<String, Object> value) {
        return value == null ? Collections.emptyMap() : value;
    }

    private String toJson(Object value) {
        try { return objectMapper.writeValueAsString(value); } catch (Exception e) { return "{}"; }
    }

    private void writeLog(String flowId, String executionId, String status, String detail, long durationMs) {
        SystemLog log = new SystemLog();
        log.setModule("FLOW");
        log.setAction("EXECUTE");
        log.setRefId(executionId);
        log.setLogType("FLOW");
        log.setLevel("SUCCESS".equals(status) ? "INFO" : "ERROR");
        log.setMessage(status);
        log.setDetail(detail == null ? "flowId=" + flowId : detail);
        log.setDurationMs(durationMs);
        log.setCreatedAt(LocalDateTime.now());
        systemLogMapper.insert(log);
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}