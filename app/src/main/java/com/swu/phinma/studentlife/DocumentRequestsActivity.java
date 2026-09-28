package com.swu.phinma.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONObject;
import com.swu.phinma.studentlife.api.ApiClient;

/**
 * Document Requests Catalog screen.
 * Matches student_life_document_requests.png.
 */
public class DocumentRequestsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_document_requests);

        findViewById(R.id.btnBackDocRequests).setOnClickListener(v -> finish());

        findViewById(R.id.btnDocNotifications).setOnClickListener(v -> {
            startActivity(new Intent(this, NotificationsActivity.class));
        });

        // Request Now Buttons
        if (findViewById(R.id.btnRequestCoc) != null) {
            findViewById(R.id.btnRequestCoc).setOnClickListener(v ->
                submitServiceRequest("Certificate of Completion (COC)", "University Registrar", "Document")
            );
        }

        if (findViewById(R.id.btnRequestGoodMoral) != null) {
            findViewById(R.id.btnRequestGoodMoral).setOnClickListener(v ->
                submitServiceRequest("Good Moral Certificate", "Dean of Student Affairs", "Clearance")
            );
        }

        if (findViewById(R.id.btnRequestLostId) != null) {
            findViewById(R.id.btnRequestLostId).setOnClickListener(v ->
                submitServiceRequest("Lost ID Replacement", "Campus Security & Records", "ID Card")
            );
        }
    }

    private void submitServiceRequest(String title, String department, String category) {
        JSONObject payload = new JSONObject();
        try {
            payload.put("title", title);
            payload.put("department", department);
            payload.put("category", category);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to format request payload", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.postJson(this, "requests.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    String message = obj.optString("message", "Request submitted");

                    if (success) {
                        JSONObject dataObj = obj.optJSONObject("data");
                        String refNum = dataObj != null ? dataObj.optString("reference_number", "SL-2026-REG") : "SL-2026-REG";

                        runOnUiThread(() -> {
                            Toast.makeText(DocumentRequestsActivity.this, "Request submitted! Ref #" + refNum, Toast.LENGTH_LONG).show();
                            startActivity(new Intent(DocumentRequestsActivity.this, RequestHistoryActivity.class));
                            finish();
                        });
                        return;
                    }

                    runOnUiThread(() -> {
                        Toast.makeText(DocumentRequestsActivity.this, message, Toast.LENGTH_LONG).show();
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        Toast.makeText(DocumentRequestsActivity.this, "Response parsing error.", Toast.LENGTH_LONG).show();
                    });
                }
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    Toast.makeText(DocumentRequestsActivity.this, "Submission failed: " + errorMessage, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
}
