package com.gis.platform.dto.response;

public class ImaSearchItem {
    private String id;
    private String title;
    private String type;
    private Double score;
    private String kbId;
    private String kbName;

    public ImaSearchItem() {
    }

    public ImaSearchItem(String id, String title, String type, Double score, String kbId, String kbName) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.score = score;
        this.kbId = kbId;
        this.kbName = kbName;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public String getKbId() { return kbId; }
    public void setKbId(String kbId) { this.kbId = kbId; }
    public String getKbName() { return kbName; }
    public void setKbName(String kbName) { this.kbName = kbName; }
}

