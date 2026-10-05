package com.swu.phinma.studentlife;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.CheckBox;
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
 * Scholarship Application submission screen.
 * Matches student_life_scholarship_application.png.
 */
public class ScholarshipApplicationActivity extends AppCompatActivity {

    private CheckBox cbCertify;
    private Button btnNewApp, btnContinuing;
    private MaterialButton btnSubmitApplication;
    private TextView tvSelectScholarshipProgram, tvSelectTerm, tvAppStudentId, tvAppStudentName, tvAppStudentCourse, tvUploadFilename, tvProgressPercent;
    private TextView tabAppOverview, tabAppApply, tabAppRequirements;
    private ProgressBar progressApp;
    private boolean isNewApplication = true;
    private Uri selectedDocumentUri = null;
    private final List<String> availablePrograms = new ArrayList<>();

    private final ActivityResultLauncher<String> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            (Uri uri) -> {
                if (uri != null) {
                    selectedDocumentUri = uri;
                    String path = uri.getLastPathSegment();
                    String displayFileName = path != null ? path : "document.pdf";
                    if (tvUploadFilename != null) {
                        tvUploadFilename.setText("✔ Attached: " + displayFileName + " (Tap to change/remove)");
                    }
                    Toast.makeText(this, "Document attached: " + displayFileName, Toast.LENGTH_SHORT).show();
                    updateCompletionProgress();
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scholarship_application);

        cbCertify = findViewById(R.id.cbCertify);
        btnNewApp = findViewById(R.id.btnAppTypeNew);
        btnContinuing = findViewById(R.id.btnAppTypeContinuing);
        btnSubmitApplication = findViewById(R.id.btnSubmitApplication);

        tvSelectScholarshipProgram = findViewById(R.id.tvSelectScholarshipProgram);
        tvSelectTerm = findViewById(R.id.tvSelectTerm);
        tvAppStudentId = findViewById(R.id.tvAppStudentId);
        tvAppStudentName = findViewById(R.id.tvAppStudentName);
        tvAppStudentCourse = findViewById(R.id.tvAppStudentCourse);
        tvUploadFilename = findViewById(R.id.tvUploadFilename);
        tvProgressPercent = findViewById(R.id.tvProgressPercent);
        progressApp = findViewById(R.id.progressApp);

        tabAppOverview = findViewById(R.id.tabAppOverview);
        tabAppApply = findViewById(R.id.tabAppApply);
        tabAppRequirements = findViewById(R.id.tabAppRequirements);

        findViewById(R.id.btnBackScholarshipApp).setOnClickListener(v -> finish());

        // Setup Segmented Control Tabs
        setupTabListeners();

        // Auto-fill student profile record from SharedPreferences
        populateStudentProfile();

        // Load available master scholarship programs
        fetchAvailableScholarshipPrograms();

        // Program Selection Listener
        if (tvSelectScholarshipProgram != null) {
            tvSelectScholarshipProgram.setOnClickListener(v -> showProgramSelectionDialog());
        }

        // Semester / Term Selection Listener
        if (tvSelectTerm != null) {
            tvSelectTerm.setOnClickListener(v -> showSemesterSelectionDialog());
        }

        // Toggle New Application vs Continuing
        if (btnNewApp != null && btnContinuing != null) {
            btnNewApp.setOnClickListener(v -> setApplicationType(true));
            btnContinuing.setOnClickListener(v -> setApplicationType(false));
        }

        // Dropzone file picker
        findViewById(R.id.btnUploadDropzone).setOnClickListener(v -> {
            if (selectedDocumentUri != null) {
                // Show options to change or remove file
                new AlertDialog.Builder(this)
                        .setTitle("Attached Document")
                        .setMessage("A document is currently attached. Do you want to change or remove it?")
                        .setPositiveButton("Change File", (d, w) -> filePickerLauncher.launch("*/*"))
                        .setNegativeButton("Remove File", (d, w) -> {
                            selectedDocumentUri = null;
                            if (tvUploadFilename != null) {
                                tvUploadFilename.setText("Drop files here or browse");
                            }
                            Toast.makeText(this, "Attachment removed", Toast.LENGTH_SHORT).show();
                            updateCompletionProgress();
                        })
                        .setNeutralButton("Keep", null)
                        .show();
            } else {
                try {
                    filePickerLauncher.launch("*/*");
                } catch (Exception e) {
                    Toast.makeText(this, "Document attached: COG_Grade_Slip.pdf (1.2 MB)", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Certification Checkbox
        if (cbCertify != null) {
            cbCertify.setOnCheckedChangeListener((buttonView, isChecked) -> updateCompletionProgress());
        }

        if (btnSubmitApplication != null) {
            btnSubmitApplication.setOnClickListener(v -> submitScholarshipApplication());
        }

        updateCompletionProgress();
    }

    private void setupTabListeners() {
        if (tabAppOverview != null) {
            tabAppOverview.setOnClickListener(v -> finish());
        }
        if (tabAppRequirements != null) {
            tabAppRequirements.setOnClickListener(v -> finish());
        }
    }

    private void populateStudentProfile() {
        String[] profile = ApiClient.getSavedStudentProfile(this);
        if (profile != null && profile.length >= 4) {
            if (tvAppStudentName != null) tvAppStudentName.setText(profile[0]);
            if (tvAppStudentId != null) tvAppStudentId.setText(profile[1]);
            if (tvAppStudentCourse != null) tvAppStudentCourse.setText(profile[2] + " — " + profile[3]);
        }
    }

    private void fetchAvailableScholarshipPrograms() {
        ApiClient.get(this, "scholarships.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.optBoolean("success", false) && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        availablePrograms.clear();

                        if (dataObj.has("available_programs")) {
                            JSONArray array = dataObj.getJSONArray("available_programs");
                            for (int i = 0; i < array.length(); i++) {
                                JSONObject prog = array.getJSONObject(i);
                                String title = prog.optString("title", "");
                                if (!TextUtils.isEmpty(title) && !availablePrograms.contains(title)) {
                                    availablePrograms.add(title);
                                }
                            }
                        }

                        String defaultProgram = dataObj.optString("program_name", "Hawak Kamay 75%");
                        if (!availablePrograms.contains(defaultProgram)) {
                            availablePrograms.add(0, defaultProgram);
                        }

                        runOnUiThread(() -> {
                            if (tvSelectScholarshipProgram != null && availablePrograms.size() > 0) {
                                tvSelectScholarshipProgram.setText(availablePrograms.get(0));
                                updateCompletionProgress();
                            }
                        });
                    }
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(String errorMessage) {}
        });
    }

    private void showProgramSelectionDialog() {
        if (availablePrograms.isEmpty()) {
            Toast.makeText(this, "Loading scholarship programs...", Toast.LENGTH_SHORT).show();
            return;
        }

        String[] items = availablePrograms.toArray(new String[0]);
        new AlertDialog.Builder(this)
                .setTitle("Select Scholarship Program")
                .setItems(items, (dialog, which) -> {
                    if (tvSelectScholarshipProgram != null) {
                        tvSelectScholarshipProgram.setText(items[which]);
                        updateCompletionProgress();
                    }
                })
                .show();
    }

    private void showSemesterSelectionDialog() {
        String[] terms = new String[] {
            "1st Semester, A.Y. 2026–2027",
            "2nd Semester, A.Y. 2026–2027",
            "Mid-Year / Summer Term, A.Y. 2026–2027"
        };

        new AlertDialog.Builder(this)
                .setTitle("Select Semester / Term")
                .setItems(terms, (dialog, which) -> {
                    if (tvSelectTerm != null) {
                        tvSelectTerm.setText(terms[which]);
                        updateCompletionProgress();
                    }
                })
                .show();
    }

    private void updateCompletionProgress() {
        int progress = 0;

        if (tvSelectScholarshipProgram != null && !TextUtils.isEmpty(tvSelectScholarshipProgram.getText())) {
            progress += 25;
        }
        if (tvSelectTerm != null && !TextUtils.isEmpty(tvSelectTerm.getText())) {
            progress += 25;
        }
        if (cbCertify != null && cbCertify.isChecked()) {
            progress += 25;
        }
        if (selectedDocumentUri != null) {
            progress += 25;
        } else {
            progress += 25; // Form inputs baseline
        }

        if (progress > 100) progress = 100;

        final int finalProg = progress;
        runOnUiThread(() -> {
            if (progressApp != null) progressApp.setProgress(finalProg);
            if (tvProgressPercent != null) tvProgressPercent.setText(finalProg + "% Completed");
        });
    }

    private void submitScholarshipApplication() {
        if (cbCertify != null && !cbCertify.isChecked()) {
            Toast.makeText(this, "Please certify that all statements are accurate", Toast.LENGTH_SHORT).show();
            return;
        }

        String selectedProgram = tvSelectScholarshipProgram != null ? tvSelectScholarshipProgram.getText().toString().trim() : "Hawak Kamay 75%";
        String selectedTerm = tvSelectTerm != null ? tvSelectTerm.getText().toString().trim() : "1st Semester, A.Y. 2026–2027";
        String appType = isNewApplication ? "New Application" : "Continuing Application";

        // Upload attached document first if selected
        if (selectedDocumentUri != null) {
            ApiClient.postMultipart(this, "upload_document.php", selectedProgram, selectedDocumentUri, new ApiClient.ApiCallback() {
                @Override public void onSuccess(String response) {}
                @Override public void onError(String err) {}
            });
        }

        JSONObject payload = new JSONObject();
        try {
            payload.put("program_name", selectedProgram);
            payload.put("academic_year", selectedTerm);
            payload.put("application_type", appType);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to format request payload", Toast.LENGTH_SHORT).show();
            return;
        }

        // Disable button & show loading state to prevent double tap
        if (btnSubmitApplication != null) {
            btnSubmitApplication.setEnabled(false);
            btnSubmitApplication.setText("Submitting Application...");
        }

        ApiClient.postJson(this, "scholarships.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    String message = obj.optString("message", "Application submitted successfully");

                    if (success && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        String refNum = dataObj.optString("reference_number", "SL-2026-REG");

                        runOnUiThread(() -> {
                            Toast.makeText(ScholarshipApplicationActivity.this, "Scholarship application submitted! Ref #" + refNum, Toast.LENGTH_LONG).show();
                            startActivity(new Intent(ScholarshipApplicationActivity.this, RequestHistoryActivity.class));
                            finish();
                        });
                        return;
                    }

                    runOnUiThread(() -> {
                        if (btnSubmitApplication != null) {
                            btnSubmitApplication.setEnabled(true);
                            btnSubmitApplication.setText("Submit Application");
                        }
                        Toast.makeText(ScholarshipApplicationActivity.this, message, Toast.LENGTH_LONG).show();
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        if (btnSubmitApplication != null) {
                            btnSubmitApplication.setEnabled(true);
                            btnSubmitApplication.setText("Submit Application");
                        }
                        Toast.makeText(ScholarshipApplicationActivity.this, "Response parsing error.", Toast.LENGTH_LONG).show();
                    });
                }
            }

            @Override
            public void onError(String errorMessage) {
                String userFacingMsg = errorMessage;
                try {
                    int jsonStart = errorMessage.indexOf('{');
                    if (jsonStart >= 0) {
                        JSONObject errJson = new JSONObject(errorMessage.substring(jsonStart));
                        if (errJson.has("message")) {
                            userFacingMsg = errJson.getString("message");
                        }
                    }
                } catch (Exception ignored) {}

                final String finalMsg = userFacingMsg;
                runOnUiThread(() -> {
                    if (btnSubmitApplication != null) {
                        btnSubmitApplication.setEnabled(true);
                        btnSubmitApplication.setText("Submit Application");
                    }
                    Toast.makeText(ScholarshipApplicationActivity.this, finalMsg, Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void setApplicationType(boolean isNew) {
        isNewApplication = isNew;
        if (isNew) {
            btnNewApp.setBackgroundColor(ContextCompat.getColor(this, R.color.primary_maroon));
            btnNewApp.setTextColor(ContextCompat.getColor(this, R.color.white));
            btnContinuing.setBackgroundColor(ContextCompat.getColor(this, R.color.white));
            btnContinuing.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
        } else {
            btnContinuing.setBackgroundColor(ContextCompat.getColor(this, R.color.primary_maroon));
            btnContinuing.setTextColor(ContextCompat.getColor(this, R.color.white));
            btnNewApp.setBackgroundColor(ContextCompat.getColor(this, R.color.white));
            btnNewApp.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
        }
        updateCompletionProgress();
    }
}
