package com.gis.platform.dto.response;

import java.util.List;

public class ImaSearchResult {
    private String query;
    private Integer totalFound;
    private List<ImaSearchItem> items;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public Integer getTotalFound() { return totalFound; }
    public void setTotalFound(Integer totalFound) { this.totalFound = totalFound; }
    public List<ImaSearchItem> getItems() { return items; }
    public void setItems(List<ImaSearchItem> items) { this.items = items; }
}

