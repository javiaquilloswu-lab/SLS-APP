package com.swu.phinma.studentlife.models;

public class RequestHistoryItem {
    private String id;
    private String title;
    private String department;
    private String referenceNumber;
    private String submissionDate;
    private String status; // "Processing", "Under Review", "Approved", "Completed", "Rejected"
    private int submittedReqs = 0;
    private int totalReqs = 4;
    private int progressPercent = 0;

    public RequestHistoryItem(String id, String title, String department, String referenceNumber, String submissionDate, String status) {
        this(id, title, department, referenceNumber, submissionDate, status, 0, 4, 0);
    }

    public RequestHistoryItem(String id, String title, String department, String referenceNumber, String submissionDate, String status, int submittedReqs, int totalReqs, int progressPercent) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.referenceNumber = referenceNumber;
        this.submissionDate = submissionDate;
        this.status = status;
        this.submittedReqs = submittedReqs;
        this.totalReqs = totalReqs;
        this.progressPercent = progressPercent;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDepartment() { return department; }
    public String getReferenceNumber() { return referenceNumber; }
    public String getSubmissionDate() { return submissionDate; }
    public String getStatus() { return status; }
    public int getSubmittedReqs() { return submittedReqs; }
    public int getTotalReqs() { return totalReqs; }
    public int getProgressPercent() { return progressPercent; }
}
