package com.swu.phinma.studentlife;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.swu.phinma.studentlife.api.ApiClient;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Document Requests Catalog screen.
 * Matches student_life_document_requests.png with Phase 3 Per-Requirement Upload UX.
 */
public class DocumentRequestsActivity extends AppCompatActivity {

    private final Map<String, String> serviceRequirementsMap = new HashMap<>();

    private Integer activeRequestId = null;
    private String activeRequirementName = "Valid Identification";

    private final ActivityResultLauncher<String> reqFilePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            (Uri uri) -> {
                if (uri != null && activeRequestId != null && activeRequestId > 0) {
                    uploadRequirementFileForRequest(activeRequestId, activeRequirementName, uri);
                }
            }
    );

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
                submitServiceRequest("Certificate of Completion (COC)", "University Registrar", "Document", "COC")
            );
        }

        if (findViewById(R.id.btnRequestGoodMoral) != null) {
            findViewById(R.id.btnRequestGoodMoral).setOnClickListener(v ->
                submitServiceRequest("Good Moral Certificate", "Dean of Student Affairs", "Clearance", "GOOD_MORAL")
            );
        }

        if (findViewById(R.id.btnRequestLostId) != null) {
            findViewById(R.id.btnRequestLostId).setOnClickListener(v ->
                submitServiceRequest("Lost ID Replacement", "Campus Security & Records", "ID Card", "LOST_ID")
            );
        }

        // View Requirements Buttons
        View btnReqsCoc = findViewById(R.id.btnViewReqsCoc);
        if (btnReqsCoc != null) {
            btnReqsCoc.setOnClickListener(v ->
                showRequirementsDialog("COC", "Certificate of Completion (COC)", "University Registrar", "Document")
            );
        }

        View btnReqsGoodMoral = findViewById(R.id.btnViewReqsGoodMoral);
        if (btnReqsGoodMoral != null) {
            btnReqsGoodMoral.setOnClickListener(v ->
                showRequirementsDialog("GOOD_MORAL", "Good Moral Certificate", "Dean of Student Affairs", "Clearance")
            );
        }

        View btnReqsLostId = findViewById(R.id.btnViewReqsLostId);
        if (btnReqsLostId != null) {
            btnReqsLostId.setOnClickListener(v ->
                showRequirementsDialog("LOST_ID", "Lost ID Replacement", "Campus Security & Records", "ID Card")
            );
        }

        // Fetch dynamic requirements catalog from PostgreSQL API
        fetchServiceCatalogFromApi();
    }

    private void fetchServiceCatalogFromApi() {
        ApiClient.get(this, "get_service_types.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.optBoolean("success", false) && obj.has("data")) {
                        JSONArray array = obj.getJSONArray("data");
                        for (int i = 0; i < array.length(); i++) {
                            JSONObject item = array.getJSONObject(i);
                            String code = item.optString("service_code", "");
                            String reqs = item.optString("requirements", "");
                            if (!TextUtils.isEmpty(code)) {
                                serviceRequirementsMap.put(code, reqs);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(String errorMessage) {}
        });
    }

    private void showRequirementsDialog(String serviceCode, String serviceName, String department, String category) {
        String rawReqsJson = serviceRequirementsMap.get(serviceCode);

        StringBuilder sb = new StringBuilder();
        sb.append("📋 Prerequisite Checklist:\n\n");

        if (!TextUtils.isEmpty(rawReqsJson)) {
            try {
                JSONArray array = new JSONArray(rawReqsJson);
                for (int i = 0; i < array.length(); i++) {
                    JSONObject req = array.getJSONObject(i);
                    String name = req.optString("name", "Requirement");
                    String desc = req.optString("description", "");
                    boolean isConditional = req.optBoolean("conditional", false);

                    if (isConditional) {
                        sb.append("○ ").append(name).append(" (Conditional / If Applicable)\n");
                    } else {
                        sb.append("✔ ").append(name).append("\n");
                    }
                    if (!TextUtils.isEmpty(desc)) {
                        sb.append("   • ").append(desc).append("\n");
                    }
                    sb.append("\n");
                }
            } catch (Exception e) {
                sb.append(rawReqsJson).append("\n");
            }
        } else {
            if ("GOOD_MORAL".equalsIgnoreCase(serviceCode)) {
                sb.append("✔ Valid Identification (Student ID, Alumni ID, or Government-issued ID)\n\n");
                sb.append("✔ Clearance / Request Form (Filled out from Guidance / OSA)\n\n");
                sb.append("✔ Proof of Payment (Official receipt for processing fee)\n\n");
                sb.append("○ Documentary Stamps (Conditional / Attached upon claiming if applicable)\n\n");
            } else if ("COC".equalsIgnoreCase(serviceCode)) {
                sb.append("✔ NDA from Department\n\n");
                sb.append("✔ DTR (Daily Time Record - required hours depend on applicable scholarship)\n\n");
                sb.append("✔ Last Semester COC\n\n");
                sb.append("✔ Current Deployment Form\n\n");
                sb.append("✔ ORF (Official Registration Form / study load)\n\n");
            } else if ("LOST_ID".equalsIgnoreCase(serviceCode)) {
                sb.append("✔ Notarized Affidavit of Loss\n\n");
                sb.append("✔ Payment Receipt for replacement fee (₱150)\n\n");
                sb.append("✔ Current Certificate of Registration (COR)\n\n");
            } else {
                sb.append("✔ Valid Student ID & Registrar Clearance\n\n");
            }
        }

        new AlertDialog.Builder(this)
                .setTitle(serviceName)
                .setMessage(sb.toString().trim())
                .setPositiveButton("Request Now", (dialog, which) -> submitServiceRequest(serviceName, department, category, serviceCode))
                .setNegativeButton("Close", null)
                .show();
    }

    private void submitServiceRequest(String title, String department, String category, String serviceCode) {
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
                        int reqId = dataObj != null ? dataObj.optInt("id", 0) : 0;
                        String refNum = dataObj != null ? dataObj.optString("reference_number", "SL-2026-REG") : "SL-2026-REG";

                        runOnUiThread(() -> {
                            Toast.makeText(DocumentRequestsActivity.this, "Request created! Ref #" + refNum, Toast.LENGTH_SHORT).show();
                            if (reqId > 0) {
                                promptPerRequirementUploads(reqId, refNum, title, serviceCode);
                            } else {
                                startActivity(new Intent(DocumentRequestsActivity.this, RequestHistoryActivity.class));
                                finish();
                            }
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

    private void promptPerRequirementUploads(int requestId, String refNum, String serviceName, String serviceCode) {
        String rawReqsJson = serviceRequirementsMap.get(serviceCode);
        String[] parsedNames = null;
        if (!TextUtils.isEmpty(rawReqsJson)) {
            try {
                JSONArray array = new JSONArray(rawReqsJson);
                parsedNames = new String[array.length()];
                for (int i = 0; i < array.length(); i++) {
                    JSONObject item = array.getJSONObject(i);
                    String name = item.optString("name", "Requirement " + (i + 1));
                    boolean isConditional = item.optBoolean("conditional", false);
                    parsedNames[i] = (isConditional ? "○ " : "✔ ") + name + (isConditional ? " (Conditional)" : "");
                }
            } catch (Exception e) {
                parsedNames = null;
            }
        }

        if (parsedNames == null || parsedNames.length == 0) {
            if ("GOOD_MORAL".equalsIgnoreCase(serviceCode)) {
                parsedNames = new String[] { "✔ Valid Identification", "✔ Clearance / Request Form", "✔ Proof of Payment", "○ Documentary Stamps (Conditional)" };
            } else if ("COC".equalsIgnoreCase(serviceCode)) {
                parsedNames = new String[] { "✔ NDA from Department", "✔ DTR (Daily Time Record)", "✔ Last Semester COC", "✔ Current Deployment Form", "✔ ORF (Study Load)" };
            } else if ("LOST_ID".equalsIgnoreCase(serviceCode)) {
                parsedNames = new String[] { "✔ Notarized Affidavit of Loss", "✔ Payment Receipt (₱150)", "✔ Current Certificate of Registration (COR)" };
            } else {
                parsedNames = new String[] { "✔ Valid Identification", "✔ Official Clearance Form" };
            }
        }

        final String[] reqNames = parsedNames;

        new AlertDialog.Builder(this)
                .setTitle("Attach Requirements (#" + refNum + ")")
                .setMessage("Select an individual requirement below to attach your document file for " + serviceName + ". You may upload documents now or track progress later.")
                .setItems(reqNames, (dialog, which) -> {
                    String selectedName = reqNames[which].replace("✔ ", "").replace("○ ", "").replace(" (Conditional)", "").trim();
                    activeRequestId = requestId;
                    activeRequirementName = selectedName;
                    Toast.makeText(DocumentRequestsActivity.this, "Select file for " + selectedName, Toast.LENGTH_SHORT).show();
                    reqFilePickerLauncher.launch("*/*");
                })
                .setPositiveButton("Complete & View History", (dialog, which) -> {
                    startActivity(new Intent(DocumentRequestsActivity.this, RequestHistoryActivity.class));
                    finish();
                })
                .setNegativeButton("Upload Later", (dialog, which) -> {
                    startActivity(new Intent(DocumentRequestsActivity.this, RequestHistoryActivity.class));
                    finish();
                })
                .show();
    }

    private void uploadRequirementFileForRequest(int requestId, String requirementName, Uri fileUri) {
        Toast.makeText(this, "Uploading " + requirementName + " for Request #" + requestId + "...", Toast.LENGTH_SHORT).show();

        ApiClient.postMultipart(this, "upload_document.php", requirementName, fileUri, requestId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                runOnUiThread(() -> {
                    Toast.makeText(DocumentRequestsActivity.this, "✔ " + requirementName + " attached to Request #" + requestId + " successfully!", Toast.LENGTH_LONG).show();
                    startActivity(new Intent(DocumentRequestsActivity.this, RequestHistoryActivity.class));
                    finish();
                });
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    Toast.makeText(DocumentRequestsActivity.this, "Upload error: " + errorMessage, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
}
