package com.swu.phinma.studentlife.models;

public class NotificationItem {
    private String id;
    private String title;
    private String body;
    private String timestamp;
    private String category;
    private String statusTag;
    private boolean isUnread;

    public NotificationItem(String id, String title, String body, String timestamp, String category, String statusTag, boolean isUnread) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.timestamp = timestamp;
        this.category = category;
        this.statusTag = statusTag;
        this.isUnread = isUnread;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getTimestamp() { return timestamp; }
    public String getCategory() { return category; }
    public String getStatusTag() { return statusTag; }
    public boolean isUnread() { return isUnread; }
    public void setUnread(boolean unread) { isUnread = unread; }
}
