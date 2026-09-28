package com.swu.phinma.studentlife.models;

public class ScholarshipRequirement {
    private String id;
    private String title;
    private String description;
    private String status; // "VERIFIED", "REVIEWING", "UPLOAD"

    public ScholarshipRequirement(String id, String title, String description, String status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
}
