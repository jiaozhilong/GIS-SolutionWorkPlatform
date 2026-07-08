package com.gis.platform.dto.request;

import javax.validation.constraints.NotBlank;
import java.util.List;

public class ImaSearchReq {

    private List<String> kbIds;

    @NotBlank(message = "检索关键词不能为空")
    private String query;

    public List<String> getKbIds() { return kbIds; }
    public void setKbIds(List<String> kbIds) { this.kbIds = kbIds; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}

