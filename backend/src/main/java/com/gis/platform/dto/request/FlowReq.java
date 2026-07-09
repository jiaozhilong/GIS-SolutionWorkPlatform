package com.gis.platform.dto.request;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.List;

public class FlowReq {
    @NotBlank(message = "流程名称不能为空")
    private String name;
    private String description;
    private String category;
    private String version;
    private String status;
    @Valid
    private List<FlowNodeReq> nodes;
    @Valid
    private List<FlowEdgeReq> edges;

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
    public List<FlowNodeReq> getNodes() { return nodes; }
    public void setNodes(List<FlowNodeReq> nodes) { this.nodes = nodes; }
    public List<FlowEdgeReq> getEdges() { return edges; }
    public void setEdges(List<FlowEdgeReq> edges) { this.edges = edges; }
}