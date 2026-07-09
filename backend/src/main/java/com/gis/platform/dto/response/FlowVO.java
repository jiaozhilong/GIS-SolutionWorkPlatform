package com.gis.platform.dto.response;

import com.gis.platform.entity.Flow;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FlowVO {
    private String id;
    private String name;
    private String description;
    private String category;
    private String version;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FlowNodeVO> nodes = new ArrayList<>();
    private List<FlowEdgeVO> edges = new ArrayList<>();

    public static FlowVO from(Flow flow) {
        FlowVO vo = new FlowVO();
        vo.setId(flow.getId());
        vo.setName(flow.getName());
        vo.setDescription(flow.getDescription());
        vo.setCategory(flow.getCategory());
        vo.setVersion(flow.getVersion());
        vo.setStatus(flow.getStatus());
        vo.setCreatedAt(flow.getCreatedAt());
        vo.setUpdatedAt(flow.getUpdatedAt());
        return vo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<FlowNodeVO> getNodes() { return nodes; }
    public void setNodes(List<FlowNodeVO> nodes) { this.nodes = nodes; }
    public List<FlowEdgeVO> getEdges() { return edges; }
    public void setEdges(List<FlowEdgeVO> edges) { this.edges = edges; }
}