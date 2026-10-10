package com.swu.phinma.studentlife;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.android.material.button.MaterialButton;
import com.swu.phinma.studentlife.api.ApiClient;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Request Details & Per-Requirement Document Upload Activity.
 * Renders individual requirement upload cards, uploaded filenames, verification states, and rejection notes.
 */
public class RequestTrackingActivity extends AppCompatActivity {

    private int requestId = 0;
    private String refNum = "";
    private String serviceTitle = "";
    private String department = "";
    private String reqStatus = "Processing";

    private TextView tvTrackingRefPill, tvTrackingTitle, tvTrackingDept, tvTrackingStatusPill;
    private TextView tvTrackingProgressText, tvRefreshReqs;
    private ProgressBar progressTracking;
    private LinearLayout llRequirementsContainer;

    private int targetReplaceDocId = 0;
    private String targetRequirementName = "Valid Identification";

    private final ActivityResultLauncher<String> reqFilePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            (Uri uri) -> {
                if (uri != null && requestId > 0) {
                    uploadOrReplaceRequirementFile(targetRequirementName, uri, targetReplaceDocId);
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_request_tracking);

        // Receive Intent Extras from RequestHistoryActivity
        Intent intent = getIntent();
        if (intent != null) {
            String reqIdStr = intent.getStringExtra("request_id");
            if (reqIdStr != null) {
                try {
                    requestId = Integer.parseInt(reqIdStr);
                } catch (Exception e) {
                    requestId = intent.getIntExtra("request_id", 0);
                }
            } else {
                requestId = intent.getIntExtra("request_id", 0);
            }
            refNum = intent.getStringExtra("reference_number");
            serviceTitle = intent.getStringExtra("title");
            department = intent.getStringExtra("department");
            reqStatus = intent.getStringExtra("status");
        }

        bindViews();
        populateHeaderInfo();

        findViewById(R.id.btnBackTracking).setOnClickListener(v -> finish());
        tvRefreshReqs.setOnClickListener(v -> loadRequestDetailsAndRequirements());

        loadRequestDetailsAndRequirements();
    }

    private void bindViews() {
        tvTrackingRefPill = findViewById(R.id.tvTrackingRefPill);
        tvTrackingTitle = findViewById(R.id.tvTrackingTitle);
        tvTrackingDept = findViewById(R.id.tvTrackingDept);
        tvTrackingStatusPill = findViewById(R.id.tvTrackingStatusPill);
        tvTrackingProgressText = findViewById(R.id.tvTrackingProgressText);
        tvRefreshReqs = findViewById(R.id.tvRefreshReqs);
        progressTracking = findViewById(R.id.progressTracking);
        llRequirementsContainer = findViewById(R.id.llRequirementsContainer);
    }

    private void populateHeaderInfo() {
        if (tvTrackingRefPill != null) tvTrackingRefPill.setText("REF: " + (refNum != null ? refNum : "SL-2026-REG"));
        if (tvTrackingTitle != null) tvTrackingTitle.setText(serviceTitle != null ? serviceTitle : "Service Request");
        if (tvTrackingDept != null) tvTrackingDept.setText(department != null ? department : "Student Life Office");

        if (tvTrackingStatusPill != null) {
            String status = reqStatus != null ? reqStatus : "Processing";
            tvTrackingStatusPill.setText("● " + status);

            if ("Completed".equalsIgnoreCase(status) || "Approved".equalsIgnoreCase(status)) {
                tvTrackingStatusPill.setBackgroundResource(R.drawable.bg_pill_active);
                tvTrackingStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_green_text));
            } else if ("Rejected".equalsIgnoreCase(status)) {
                tvTrackingStatusPill.setBackgroundResource(R.drawable.bg_pill_rejected);
                tvTrackingStatusPill.setTextColor(ContextCompat.getColor(this, R.color.secondary_ruby));
            } else if ("Under Review".equalsIgnoreCase(status)) {
                tvTrackingStatusPill.setBackgroundResource(R.drawable.bg_pill_reviewing);
                tvTrackingStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_purple_text));
            } else {
                tvTrackingStatusPill.setBackgroundResource(R.drawable.bg_pill_processing);
                tvTrackingStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_blue_text));
            }
        }
    }

    private void loadRequestDetailsAndRequirements() {
        if (requestId <= 0) {
            Toast.makeText(this, "Invalid request ID", Toast.LENGTH_SHORT).show();
            return;
        }

        // 1. Fetch requirements list for this service title from get_service_types.php
        ApiClient.get(this, "get_service_types.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonServices) {
                JSONArray matchedReqs = null;
                try {
                    JSONObject obj = new JSONObject(jsonServices);
                    if (obj.optBoolean("success", false) && obj.has("data")) {
                        JSONArray services = obj.getJSONArray("data");
                        for (int i = 0; i < services.length(); i++) {
                            JSONObject s = services.getJSONObject(i);
                            String sName = s.optString("service_name", "");
                            String sCode = s.optString("service_code", "");
                            if (serviceTitle != null && (serviceTitle.toLowerCase().contains(sName.toLowerCase()) || sName.toLowerCase().contains(serviceTitle.toLowerCase()) || serviceTitle.toLowerCase().contains(sCode.toLowerCase()))) {
                                String reqsStr = s.optString("requirements", "");
                                if (!TextUtils.isEmpty(reqsStr)) {
                                    matchedReqs = new JSONArray(reqsStr);
                                }
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {}

                final JSONArray finalReqs = matchedReqs != null ? matchedReqs : getDefaultRequirementsForService(serviceTitle);

                // 2. Fetch student's uploaded documents scoped to this request_id from upload_document.php
                ApiClient.get(RequestTrackingActivity.this, "upload_document.php?request_id=" + requestId, new ApiClient.ApiCallback() {
                    @Override
                    public void onSuccess(String jsonDocs) {
                        List<JSONObject> uploadedDocsList = new ArrayList<>();
                        try {
                            JSONObject obj = new JSONObject(jsonDocs);
                            if (obj.optBoolean("success", false) && obj.has("data")) {
                                JSONArray docsArray = obj.getJSONArray("data");
                                for (int i = 0; i < docsArray.length(); i++) {
                                    uploadedDocsList.add(docsArray.getJSONObject(i));
                                }
                            }
                        } catch (Exception ignored) {}

                        runOnUiThread(() -> renderRequirementCards(finalReqs, uploadedDocsList));
                    }

                    @Override
                    public void onError(String errorMessage) {
                        runOnUiThread(() -> renderRequirementCards(finalReqs, new ArrayList<>()));
                    }
                });
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> renderRequirementCards(getDefaultRequirementsForService(serviceTitle), new ArrayList<>()));
            }
        });
    }

    private JSONArray getDefaultRequirementsForService(String title) {
        JSONArray array = new JSONArray();
        try {
            if (title != null && title.toLowerCase().contains("good moral")) {
                array.put(new JSONObject().put("name", "Valid Identification").put("description", "Student ID, Alumni ID, or Government-issued ID.").put("conditional", false));
                array.put(new JSONObject().put("name", "Clearance / Request Form").put("description", "Filled-out form from Guidance, Registrar, or Student Affairs.").put("conditional", false));
                array.put(new JSONObject().put("name", "Proof of Payment").put("description", "Official receipt for processing fee.").put("conditional", false));
                array.put(new JSONObject().put("name", "Documentary Stamps").put("description", "Attached upon claiming if applicable.").put("conditional", true));
            } else if (title != null && title.toLowerCase().contains("coc")) {
                array.put(new JSONObject().put("name", "NDA from Department").put("description", "Signed Non-Disclosure Agreement.").put("conditional", false));
                array.put(new JSONObject().put("name", "DTR (Daily Time Record)").put("description", "Required hours depend on applicable scholarship.").put("conditional", false));
                array.put(new JSONObject().put("name", "Last Semester COC").put("description", "Certificate of Completion from previous semester.").put("conditional", false));
                array.put(new JSONObject().put("name", "Current Deployment Form").put("description", "Validated department deployment form.").put("conditional", false));
                array.put(new JSONObject().put("name", "ORF (Study Load)").put("description", "Official Registration Form showing study load.").put("conditional", false));
            } else if (title != null && title.toLowerCase().contains("lost id")) {
                array.put(new JSONObject().put("name", "Notarized Affidavit of Loss").put("description", "Notarized Affidavit stating missing student smart card.").put("conditional", false));
                array.put(new JSONObject().put("name", "Payment Receipt (₱150)").put("description", "Official receipt for replacement fee.").put("conditional", false));
                array.put(new JSONObject().put("name", "Current Certificate of Registration (COR)").put("description", "Validated Certificate of Registration.").put("conditional", false));
            } else {
                array.put(new JSONObject().put("name", "Valid Identification").put("description", "Student ID or Government-issued ID.").put("conditional", false));
                array.put(new JSONObject().put("name", "Official Clearance Form").put("description", "Signed registrar clearance form.").put("conditional", false));
            }
        } catch (Exception ignored) {}
        return array;
    }

    private void renderRequirementCards(JSONArray reqsArray, List<JSONObject> uploadedDocs) {
        if (llRequirementsContainer == null) return;
        llRequirementsContainer.removeAllViews();

        int totalMandatory = 0;
        int submittedMandatory = 0;

        LayoutInflater inflater = LayoutInflater.from(this);

        for (int i = 0; i < reqsArray.length(); i++) {
            JSONObject reqObj = reqsArray.optJSONObject(i);
            if (reqObj == null) continue;

            String reqName = reqObj.optString("name", "Requirement " + (i + 1));
            String reqDesc = reqObj.optString("description", "");
            boolean isConditional = reqObj.optBoolean("conditional", false);

            if (!isConditional) {
                totalMandatory++;
            }

            // Find matching current upload document
            JSONObject matchingDoc = null;
            for (JSONObject doc : uploadedDocs) {
                boolean isCurrent = doc.optBoolean("is_current", true);
                String docType = doc.optString("document_type", "");
                if (isCurrent && (docType.equalsIgnoreCase(reqName) || docType.toLowerCase().contains(reqName.toLowerCase()) || reqName.toLowerCase().contains(docType.toLowerCase()))) {
                    matchingDoc = doc;
                    break;
                }
            }

            View cardView = inflater.inflate(R.layout.item_requirement_upload_card, llRequirementsContainer, false);

            TextView tvReqCardName = cardView.findViewById(R.id.tvReqCardName);
            TextView tvReqCardStatusPill = cardView.findViewById(R.id.tvReqCardStatusPill);
            TextView tvReqCardDesc = cardView.findViewById(R.id.tvReqCardDesc);
            TextView tvReqCardFilename = cardView.findViewById(R.id.tvReqCardFilename);
            LinearLayout llRejectionContainer = cardView.findViewById(R.id.llRejectionContainer);
            TextView tvRejectionReason = cardView.findViewById(R.id.tvRejectionReason);
            MaterialButton btnReqCardUpload = cardView.findViewById(R.id.btnReqCardUpload);
            MaterialButton btnReqCardReplace = cardView.findViewById(R.id.btnReqCardReplace);

            if (tvReqCardName != null) {
                tvReqCardName.setText((isConditional ? "○ " : "✔ ") + reqName);
            }
            if (tvReqCardDesc != null) {
                tvReqCardDesc.setText(reqDesc);
            }

            if (matchingDoc != null) {
                int docId = matchingDoc.optInt("id", 0);
                String origFilename = matchingDoc.optString("original_filename", "document.pdf");
                String docStatus = matchingDoc.optString("status", "Pending Review");
                String adminNotes = matchingDoc.optString("admin_notes", "");

                boolean isRejected = "Rejected".equalsIgnoreCase(docStatus);
                boolean isVerified = "Verified".equalsIgnoreCase(docStatus) || "Approved".equalsIgnoreCase(docStatus);

                if (!isConditional && !isRejected) {
                    submittedMandatory++;
                }

                if (tvReqCardFilename != null) {
                    tvReqCardFilename.setText("✔ Attached: " + origFilename);
                    tvReqCardFilename.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
                }

                if (tvReqCardStatusPill != null) {
                    if (isVerified) {
                        tvReqCardStatusPill.setText("✔ Verified");
                        tvReqCardStatusPill.setBackgroundResource(R.drawable.bg_pill_active);
                        tvReqCardStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_green_text));
                    } else if (isRejected) {
                        tvReqCardStatusPill.setText("❌ Rejected");
                        tvReqCardStatusPill.setBackgroundResource(R.drawable.bg_pill_rejected);
                        tvReqCardStatusPill.setTextColor(ContextCompat.getColor(this, R.color.secondary_ruby));
                    } else {
                        tvReqCardStatusPill.setText("● Pending Review");
                        tvReqCardStatusPill.setBackgroundResource(R.drawable.bg_pill_reviewing);
                        tvReqCardStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_purple_text));
                    }
                }

                if (isRejected && llRejectionContainer != null && tvRejectionReason != null) {
                    llRejectionContainer.setVisibility(View.VISIBLE);
                    tvRejectionReason.setText(!TextUtils.isEmpty(adminNotes) ? adminNotes : "Document rejected by staff. Please upload a clear, valid copy.");
                } else if (llRejectionContainer != null) {
                    llRejectionContainer.setVisibility(View.GONE);
                }

                if (btnReqCardUpload != null) btnReqCardUpload.setVisibility(View.GONE);
                if (btnReqCardReplace != null) {
                    btnReqCardReplace.setVisibility(View.VISIBLE);
                    btnReqCardReplace.setOnClickListener(v -> promptReplaceDocument(docId, reqName));
                }
            } else {
                // Not Uploaded State
                if (tvReqCardFilename != null) {
                    tvReqCardFilename.setText("No document attached yet");
                    tvReqCardFilename.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }

                if (tvReqCardStatusPill != null) {
                    if (isConditional) {
                        tvReqCardStatusPill.setText("○ Conditional");
                        tvReqCardStatusPill.setBackgroundResource(R.drawable.bg_pill_processing);
                        tvReqCardStatusPill.setTextColor(ContextCompat.getColor(this, R.color.status_blue_text));
                    } else {
                        tvReqCardStatusPill.setText("○ Required");
                        tvReqCardStatusPill.setBackgroundResource(R.drawable.bg_pill_processing);
                        tvReqCardStatusPill.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
                    }
                }

                if (llRejectionContainer != null) llRejectionContainer.setVisibility(View.GONE);
                if (btnReqCardReplace != null) btnReqCardReplace.setVisibility(View.GONE);

                if (btnReqCardUpload != null) {
                    btnReqCardUpload.setVisibility(View.VISIBLE);
                    btnReqCardUpload.setOnClickListener(v -> {
                        targetReplaceDocId = 0;
                        targetRequirementName = reqName;
                        reqFilePickerLauncher.launch("*/*");
                    });
                }
            }

            llRequirementsContainer.addView(cardView);
        }

        // Update Requirements Progress Header
        if (totalMandatory == 0) totalMandatory = 1;
        int progressPct = (int)roundPercent(submittedMandatory, totalMandatory);

        if (tvTrackingProgressText != null) {
            tvTrackingProgressText.setText("Requirements Progress: " + submittedMandatory + "/" + totalMandatory + " Uploaded (" + progressPct + "%)");
        }
        if (progressTracking != null) {
            progressTracking.setProgress(progressPct);
        }
    }

    private double roundPercent(int sub, int tot) {
        if (tot <= 0) return 100.0;
        double pct = ((double) sub / (double) tot) * 100.0;
        return Math.min(100.0, Math.max(0.0, pct));
    }

    private void promptReplaceDocument(int docId, String requirementName) {
        new AlertDialog.Builder(this)
                .setTitle("Replace Document?")
                .setMessage("Your current document for '" + requirementName + "' will be preserved in submission history, and the new file will become active for staff review.")
                .setPositiveButton("Choose New File", (dialog, which) -> {
                    targetReplaceDocId = docId;
                    targetRequirementName = requirementName;
                    reqFilePickerLauncher.launch("*/*");
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void uploadOrReplaceRequirementFile(String requirementName, Uri fileUri, int replaceDocId) {
        Toast.makeText(this, "Uploading " + requirementName + "...", Toast.LENGTH_SHORT).show();

        Integer repId = replaceDocId > 0 ? replaceDocId : null;

        ApiClient.postMultipart(this, "upload_document.php", requirementName, fileUri, requestId, repId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                runOnUiThread(() -> {
                    Toast.makeText(RequestTrackingActivity.this, "✔ Document uploaded for " + requirementName + "!", Toast.LENGTH_LONG).show();
                    loadRequestDetailsAndRequirements();
                });
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    Toast.makeText(RequestTrackingActivity.this, "Upload failed: " + errorMessage, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
}
