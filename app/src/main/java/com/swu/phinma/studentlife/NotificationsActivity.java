package com.swu.phinma.studentlife;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.adapters.NotificationsAdapter;
import com.swu.phinma.studentlife.api.ApiClient;
import com.swu.phinma.studentlife.models.NotificationItem;
import java.util.ArrayList;
import java.util.List;

/**
 * Notifications Center screen with live tabs and unread badges.
 * Matches student_life_notifications.png.
 */
public class NotificationsActivity extends AppCompatActivity {

    private RecyclerView rvNotifications;
    private NotificationsAdapter adapter;
    private List<NotificationItem> allNotifications;
    private List<NotificationItem> displayedNotifications;
    private TextView tvInboxUnreadCount, tabAll, tabUnread;
    private boolean showOnlyUnread = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notifications);

        findViewById(R.id.btnBackNotifications).setOnClickListener(v -> finish());

        tvInboxUnreadCount = findViewById(R.id.tvInboxUnreadCount);
        rvNotifications = findViewById(R.id.rvNotifications);
        tabAll = findViewById(R.id.tabNotificationsAll);
        tabUnread = findViewById(R.id.tabNotificationsUnread);

        allNotifications = new ArrayList<>();
        displayedNotifications = new ArrayList<>();

        adapter = new NotificationsAdapter(displayedNotifications, item -> {
            markSingleNotificationAsRead(item);
            updateUnreadCount();
        });

        rvNotifications.setLayoutManager(new LinearLayoutManager(this));
        rvNotifications.setAdapter(adapter);

        setupTabs();
        fetchNotificationsFromApi();

        findViewById(R.id.btnMarkAllRead).setOnClickListener(v -> {
            ApiClient.postJson(this, "notifications.php", "{}", new ApiClient.ApiCallback() {
                @Override public void onSuccess(String jsonResponse) {}
                @Override public void onError(String errorMessage) {}
            });
            for (NotificationItem item : allNotifications) {
                item.setUnread(false);
            }
            updateUnreadCount();
            refreshFilter();
            Toast.makeText(this, "All notifications marked as read", Toast.LENGTH_SHORT).show();
        });

        updateUnreadCount();
    }

    private void fetchNotificationsFromApi() {
        ApiClient.get(this, "notifications.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    org.json.JSONObject obj = new org.json.JSONObject(jsonResponse);
                    if (obj.has("data")) {
                        org.json.JSONObject dataObj = obj.getJSONObject("data");
                        if (dataObj.has("notifications")) {
                            org.json.JSONArray array = dataObj.getJSONArray("notifications");
                            List<NotificationItem> list = new ArrayList<>();
                            for (int i = 0; i < array.length(); i++) {
                                org.json.JSONObject item = array.getJSONObject(i);
                                String id = String.valueOf(item.opt("id"));
                                String title = item.optString("title", "Notification");
                                String body = item.optString("body", "");
                                String timestamp = item.optString("timestamp", "Recent");
                                String category = item.optString("category", "Notice");
                                String statusTag = item.optString("status_tag", "Info");
                                boolean isUnread = item.optBoolean("is_unread", false)
                                        || "1".equals(item.optString("is_unread"))
                                        || "true".equalsIgnoreCase(item.optString("is_unread"))
                                        || "t".equalsIgnoreCase(item.optString("is_unread"));

                                list.add(new NotificationItem(id, title, body, timestamp, category, statusTag, isUnread));
                            }

                            runOnUiThread(() -> {
                                allNotifications.clear();
                                allNotifications.addAll(list);
                                refreshFilter();
                                updateUnreadCount();
                            });
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String errorMessage) {
                if (errorMessage != null && (errorMessage.contains("401") || errorMessage.contains("403") || errorMessage.contains("Authentication required"))) {
                    runOnUiThread(() -> {
                        ApiClient.clearAuthToken(NotificationsActivity.this);
                        Toast.makeText(NotificationsActivity.this, "Session expired. Please sign in again.", Toast.LENGTH_LONG).show();
                        startActivity(new android.content.Intent(NotificationsActivity.this, LoginActivity.class));
                        finish();
                    });
                }
            }
        });
    }

    private void markSingleNotificationAsRead(NotificationItem item) {
        if (item == null || item.getId() == null) return;
        org.json.JSONObject payload = new org.json.JSONObject();
        try {
            payload.put("notification_id", Integer.parseInt(item.getId()));
        } catch (Exception ignored) {}

        ApiClient.postJson(this, "notifications.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override public void onSuccess(String jsonResponse) {}
            @Override public void onError(String errorMessage) {}
        });
    }

    private void setupTabs() {
        if (tabAll != null) {
            tabAll.setOnClickListener(v -> {
                showOnlyUnread = false;
                tabAll.setBackgroundResource(R.drawable.bg_card_maroon_banner);
                tabAll.setTextColor(ContextCompat.getColor(this, R.color.white));
                tabUnread.setBackgroundResource(R.drawable.bg_pill_processing);
                tabUnread.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.card_surface));
                tabUnread.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
                refreshFilter();
            });
        }
        if (tabUnread != null) {
            tabUnread.setOnClickListener(v -> {
                showOnlyUnread = true;
                tabUnread.setBackgroundResource(R.drawable.bg_card_maroon_banner);
                tabUnread.setTextColor(ContextCompat.getColor(this, R.color.white));
                tabAll.setBackgroundResource(R.drawable.bg_pill_processing);
                tabAll.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.card_surface));
                tabAll.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
                refreshFilter();
            });
        }
    }

    private void refreshFilter() {
        displayedNotifications.clear();
        for (NotificationItem item : allNotifications) {
            if (!showOnlyUnread || item.isUnread()) {
                displayedNotifications.add(item);
            }
        }
        adapter.notifyDataSetChanged();
    }

    private void updateUnreadCount() {
        int count = 0;
        for (NotificationItem item : allNotifications) {
            if (item.isUnread()) count++;
        }
        if (tvInboxUnreadCount != null) {
            tvInboxUnreadCount.setText(count + " unread");
        }
        if (tabUnread != null) {
            tabUnread.setText("Unread (" + count + ")");
        }
    }
}
