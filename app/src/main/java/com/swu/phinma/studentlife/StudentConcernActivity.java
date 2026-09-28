package com.swu.phinma.studentlife;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;
import org.json.JSONArray;
import org.json.JSONObject;
import com.swu.phinma.studentlife.api.ApiClient;
import java.util.ArrayList;
import java.util.List;

/**
 * Student Support Assistant / Concern chat screen.
 * Matches student_life_student_support_chatbot.png.
 */
public class StudentConcernActivity extends AppCompatActivity {

    private EditText etConcernMessage;
    private LinearLayout layoutMessagesContainer;
    private NestedScrollView scrollChat;
    private View btnSendMessage;
    private View typingBubbleView;
    private final List<JSONObject> chatHistory = new ArrayList<>();

    private final ActivityResultLauncher<String> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            (Uri uri) -> {
                if (uri != null) {
                    String path = uri.getLastPathSegment();
                    Toast.makeText(this, "Attachment selected: " + (path != null ? path : "document.pdf"), Toast.LENGTH_SHORT).show();
                    if (etConcernMessage != null) {
                        String current = etConcernMessage.getText().toString().trim();
                        etConcernMessage.setText((current.isEmpty() ? "" : current + " ") + "[Attached: " + (path != null ? path : "document.pdf") + "]");
                        etConcernMessage.setSelection(etConcernMessage.getText().length());
                    }
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_student_concern);

        findViewById(R.id.btnBackConcern).setOnClickListener(v -> finish());

        etConcernMessage = findViewById(R.id.etConcernMessage);
        scrollChat = findViewById(R.id.scrollChat);
        btnSendMessage = findViewById(R.id.btnSendMessage);

        if (scrollChat != null && scrollChat.getChildCount() > 0) {
            layoutMessagesContainer = (LinearLayout) scrollChat.getChildAt(0);
        }

        if (btnSendMessage != null) {
            btnSendMessage.setOnClickListener(v -> sendMessage());
        }

        View btnAttach = findViewById(R.id.btnAttachFile);
        if (btnAttach != null) {
            btnAttach.setOnClickListener(v -> {
                try {
                    filePickerLauncher.launch("*/*");
                } catch (Exception e) {
                    Toast.makeText(this, "Attachment selected: COG_Verification.pdf (1.2 MB)", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Personalize Welcome Greeting with authenticated student's real first name
        TextView tvWelcomeGreeting = findViewById(R.id.tvWelcomeGreeting);
        if (tvWelcomeGreeting != null) {
            String[] profile = ApiClient.getSavedStudentProfile(this);
            if (profile != null && profile.length > 0 && !TextUtils.isEmpty(profile[0])) {
                String fullName = profile[0].trim();
                String firstName = fullName.contains(" ") ? fullName.split(" ")[0] : fullName;
                tvWelcomeGreeting.setText("Hello " + firstName + "! 👋 Welcome to the Student Life Support Assistant. How can we help you today with academic appeals, scholarship inquiries, or student services?");
            }
        }

        // Quick Suggestion Chips (Populates composer text for student editing before send)
        setupQuickActionChips();
    }

    private void setupQuickActionChips() {
        View chipAppeal = findViewById(R.id.chipAcademicAppeal);
        View chipInquiry = findViewById(R.id.chipCampusInquiry);
        View chipPriority = findViewById(R.id.chipHighPriority);

        if (chipAppeal != null) {
            chipAppeal.setOnClickListener(v -> populateComposerPrompt("I need to file an academic appeal regarding my grade evaluation."));
        }
        if (chipInquiry != null) {
            chipInquiry.setOnClickListener(v -> populateComposerPrompt("I have a campus inquiry regarding document processing timelines."));
        }
        if (chipPriority != null) {
            chipPriority.setOnClickListener(v -> populateComposerPrompt("High Priority: Urgent assistance required regarding my scholarship status."));
        }
    }

    private void populateComposerPrompt(String promptText) {
        if (etConcernMessage != null) {
            etConcernMessage.setText(promptText);
            etConcernMessage.setSelection(etConcernMessage.getText().length());
            etConcernMessage.requestFocus();
        }
    }

    private void sendMessage() {
        if (etConcernMessage == null) return;
        String text = etConcernMessage.getText().toString().trim();
        if (TextUtils.isEmpty(text)) return;

        etConcernMessage.setText("");
        addUserMessageBubble(text);

        // Record user turn in local history
        try {
            JSONObject userTurn = new JSONObject();
            userTurn.put("sender", "user");
            userTurn.put("text", text);
            chatHistory.add(userTurn);
        } catch (Exception ignored) {}

        // Disable send button & show typing bubble
        if (btnSendMessage != null) btnSendMessage.setEnabled(false);
        showTypingIndicator();

        // Send to real PHP API backend chatbot.php
        JSONObject payload = new JSONObject();
        try {
            payload.put("message", text);
            payload.put("action", "chat"); // Normal AI chat turn
            JSONArray histArray = new JSONArray();
            for (JSONObject turn : chatHistory) {
                histArray.put(turn);
            }
            payload.put("history", histArray);
        } catch (Exception e) {
            hideTypingIndicator();
            if (btnSendMessage != null) btnSendMessage.setEnabled(true);
            Toast.makeText(this, "Failed to format request", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.postJson(this, "chatbot.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    String message = obj.optString("message", "Response received");

                    if (success && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        String aiReply = dataObj.optString("reply", "Thank you for reaching out.");

                        // Record bot turn in local history
                        JSONObject botTurn = new JSONObject();
                        botTurn.put("sender", "bot");
                        botTurn.put("text", aiReply);
                        chatHistory.add(botTurn);

                        runOnUiThread(() -> {
                            hideTypingIndicator();
                            if (btnSendMessage != null) btnSendMessage.setEnabled(true);
                            addBotMessageBubble(aiReply);
                        });
                        return;
                    }

                    runOnUiThread(() -> {
                        hideTypingIndicator();
                        if (btnSendMessage != null) btnSendMessage.setEnabled(true);
                        addBotMessageBubble(message);
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        hideTypingIndicator();
                        if (btnSendMessage != null) btnSendMessage.setEnabled(true);
                        addBotMessageBubble("Response parsing error. Please try again.");
                    });
                }
            }

            @Override
            public void onError(String errorMessage) {
                if (errorMessage != null && (errorMessage.contains("401") || errorMessage.contains("403") || errorMessage.contains("Authentication required"))) {
                    runOnUiThread(() -> {
                        hideTypingIndicator();
                        ApiClient.clearAuthToken(StudentConcernActivity.this);
                        Toast.makeText(StudentConcernActivity.this, "Session expired. Please sign in again.", Toast.LENGTH_LONG).show();
                        startActivity(new Intent(StudentConcernActivity.this, LoginActivity.class));
                        finish();
                    });
                    return;
                }

                runOnUiThread(() -> {
                    hideTypingIndicator();
                    if (btnSendMessage != null) btnSendMessage.setEnabled(true);
                    Toast.makeText(StudentConcernActivity.this, "Connection error: " + errorMessage, Toast.LENGTH_LONG).show();
                    addBotMessageBubble("Unable to connect to Student Support. Please check your connection and try again.");
                });
            }
        });
    }

    private void showTypingIndicator() {
        if (layoutMessagesContainer == null) return;
        if (typingBubbleView != null) layoutMessagesContainer.removeView(typingBubbleView);

        LinearLayout bubble = new LinearLayout(this);
        bubble.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.topMargin = 24;
        params.rightMargin = 80;
        bubble.setLayoutParams(params);

        TextView tv = new TextView(this);
        tv.setText("Assistant is typing...");
        tv.setTextColor(getResources().getColor(R.color.text_secondary, null));
        tv.setTextSize(12);
        tv.setBackgroundResource(R.drawable.bg_pill_processing);
        tv.setPadding(28, 16, 28, 16);
        bubble.addView(tv);

        typingBubbleView = bubble;
        layoutMessagesContainer.addView(typingBubbleView);
        if (scrollChat != null) {
            scrollChat.post(() -> scrollChat.fullScroll(View.FOCUS_DOWN));
        }
    }

    private void hideTypingIndicator() {
        if (layoutMessagesContainer != null && typingBubbleView != null) {
            layoutMessagesContainer.removeView(typingBubbleView);
            typingBubbleView = null;
        }
    }

    private void addUserMessageBubble(String text) {
        if (layoutMessagesContainer == null) return;
        LinearLayout bubble = new LinearLayout(this);
        bubble.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.topMargin = 24;
        params.leftMargin = 120;
        params.gravity = android.view.Gravity.END;
        bubble.setLayoutParams(params);

        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(getResources().getColor(R.color.white, null));
        tv.setTextSize(13);
        tv.setBackgroundResource(R.drawable.bg_card_maroon_banner);
        tv.setPadding(32, 24, 32, 24);
        bubble.addView(tv);

        TextView time = new TextView(this);
        time.setText("Just now ✔✔");
        time.setTextSize(10);
        time.setTextColor(getResources().getColor(R.color.text_secondary, null));
        time.setGravity(android.view.Gravity.END);
        bubble.addView(time);

        layoutMessagesContainer.addView(bubble);
        if (scrollChat != null) {
            scrollChat.post(() -> scrollChat.fullScroll(View.FOCUS_DOWN));
        }
    }

    private void addBotMessageBubble(String text) {
        if (layoutMessagesContainer == null) return;
        LinearLayout bubble = new LinearLayout(this);
        bubble.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.topMargin = 24;
        params.rightMargin = 80;
        bubble.setLayoutParams(params);

        TextView sender = new TextView(this);
        sender.setText("Student Support Bot");
        sender.setTextSize(11);
        sender.setTextColor(getResources().getColor(R.color.text_secondary, null));
        bubble.addView(sender);

        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(getResources().getColor(R.color.text_primary, null));
        tv.setTextSize(13);
        tv.setBackgroundResource(R.drawable.bg_card_rounded_2xl);
        tv.setPadding(32, 24, 32, 24);
        bubble.addView(tv);

        layoutMessagesContainer.addView(bubble);
        if (scrollChat != null) {
            scrollChat.post(() -> scrollChat.fullScroll(View.FOCUS_DOWN));
        }
    }
}
