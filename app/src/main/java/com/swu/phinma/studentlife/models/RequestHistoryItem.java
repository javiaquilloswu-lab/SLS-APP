package com.swu.phinma.studentlife.models;

public class RequestHistoryItem {
    private String id;
    private String title;
    private String department;
    private String referenceNumber;
    private String submissionDate;
    private String status; // "Processing", "Under Review", "Approved", "Completed", "Rejected"

    public RequestHistoryItem(String id, String title, String department, String referenceNumber, String submissionDate, String status) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.referenceNumber = referenceNumber;
        this.submissionDate = submissionDate;
        this.status = status;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDepartment() { return department; }
    public String getReferenceNumber() { return referenceNumber; }
    public String getSubmissionDate() { return submissionDate; }
    public String getStatus() { return status; }
}
