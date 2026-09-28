package com.swu.phinma.studentlife.models;

public class RecentRequest {
    private String id;
    private String title;
    private String referenceNumber;
    private String date;
    private String status; // "Processing", "Completed", "Under Review", "Rejected"
    private String statusMessage;

    public RecentRequest(String id, String title, String referenceNumber, String date, String status, String statusMessage) {
        this.id = id;
        this.title = title;
        this.referenceNumber = referenceNumber;
        this.date = date;
        this.status = status;
        this.statusMessage = statusMessage;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getReferenceNumber() { return referenceNumber; }
    public String getDate() { return date; }
    public String getStatus() { return status; }
    public String getStatusMessage() { return statusMessage; }
}
