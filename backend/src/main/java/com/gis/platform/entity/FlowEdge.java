package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("flow_edges")
public class FlowEdge {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String flowId;
    private String sourceNodeId;
    private String targetNodeId;
}

