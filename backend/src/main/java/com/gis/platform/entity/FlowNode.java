package com.gis.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("flow_nodes")
public class FlowNode {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String flowId;
    private String skillId;
    private String nodeName;
    private Double positionX;
    private Double positionY;
    private String paramOverrides;
    private Integer timeoutSeconds;
    private Integer retryCount;
}

