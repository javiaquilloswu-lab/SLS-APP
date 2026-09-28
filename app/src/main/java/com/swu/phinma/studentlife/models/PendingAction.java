package com.swu.phinma.studentlife.models;

public class PendingAction {
    private String id;
    private String title;
    private String dueDate;
    private String department;
    private String urgency; // "high", "medium"

    public PendingAction(String id, String title, String dueDate, String department, String urgency) {
        this.id = id;
        this.title = title;
        this.dueDate = dueDate;
        this.department = department;
        this.urgency = urgency;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDueDate() { return dueDate; }
    public String getDepartment() { return department; }
    public String getUrgency() { return urgency; }
}
