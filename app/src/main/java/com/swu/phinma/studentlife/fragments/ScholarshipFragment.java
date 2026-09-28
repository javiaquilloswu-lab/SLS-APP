package com.swu.phinma.studentlife.fragments;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.*;
import com.swu.phinma.studentlife.adapters.ScholarshipRequirementsAdapter;
import com.swu.phinma.studentlife.api.ApiClient;
import com.swu.phinma.studentlife.models.ScholarshipRequirement;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class ScholarshipFragment extends Fragment {

    private RecyclerView rvRequirements;
    private TextView tvScholarshipName, tvScholarshipAcadYear, tvScholarshipGrantStatus;
    private TextView tvScholarshipDocCount, tvScholarshipProgressPercent, tvScholarshipCutoff;
    private TextView tvApprovedCount, tvInReviewCount, tvRequiredCount, tvStipendTimeline;
    private ProgressBar progressBarCompliance;

    private String selectedRequirementTitle = "General Document";

    private final ActivityResultLauncher<String> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            (Uri uri) -> {
                if (uri != null && getContext() != null) {
                    uploadRequirementDocument(selectedRequirementTitle, uri);
                }
            }
    );

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_scholarship, container, false);
        bindViews(view);
        setupClickListeners(view);
        fetchScholarshipCatalogFromApi();
        return view;
    }

    private void bindViews(View view) {
        rvRequirements = view.findViewById(R.id.rvScholarshipRequirements);
        tvScholarshipName = view.findViewById(R.id.tvScholarshipName);
        tvScholarshipAcadYear = view.findViewById(R.id.tvScholarshipAcadYear);
        tvScholarshipGrantStatus = view.findViewById(R.id.tvScholarshipGrantStatus);
        tvScholarshipDocCount = view.findViewById(R.id.tvScholarshipDocCount);
        tvScholarshipProgressPercent = view.findViewById(R.id.tvScholarshipProgressPercent);
        tvScholarshipCutoff = view.findViewById(R.id.tvScholarshipCutoff);
        tvApprovedCount = view.findViewById(R.id.tvApprovedCount);
        tvInReviewCount = view.findViewById(R.id.tvInReviewCount);
        tvRequiredCount = view.findViewById(R.id.tvRequiredCount);
        tvStipendTimeline = view.findViewById(R.id.tvStipendTimeline);
        progressBarCompliance = view.findViewById(R.id.progressBarCompliance);

        if (rvRequirements != null) {
            rvRequirements.setLayoutManager(new LinearLayoutManager(getContext()));
        }
    }

    private void fetchScholarshipCatalogFromApi() {
        if (getContext() == null) return;

        ApiClient.get(getContext(), "scholarships.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    if (success && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        String programName = dataObj.optString("program_name", "CHED Academic Excellence");
                        String acadYear = dataObj.optString("academic_year", "AY 2026–2027");
                        String grantStatus = dataObj.optString("grant_status", "Active Scholar");
                        int progress = dataObj.optInt("progress_percent", 0);
                        int verifiedCount = dataObj.optInt("verified_count", 0);
                        int reviewingCount = dataObj.optInt("reviewing_count", 0);
                        int requiredCount = dataObj.optInt("required_count", 0);
                        int totalCount = dataObj.optInt("total_count", 0);
                        String stipendAmount = dataObj.optString("stipend_amount", "₱30,000.00");
                        String nextCutoff = dataObj.optString("next_critical_cutoff", "October 31, 2026");

                        List<ScholarshipRequirement> reqList = new ArrayList<>();
                        if (dataObj.has("requirements")) {
                            JSONArray array = dataObj.getJSONArray("requirements");
                            for (int i = 0; i < array.length(); i++) {
                                JSONObject reqObj = array.getJSONObject(i);
                                String reqId = String.valueOf(reqObj.opt("id"));
                                String reqTitle = reqObj.optString("title", "Requirement");
                                String reqDesc = reqObj.optString("description", "");
                                String reqStatus = reqObj.optString("status", "UPLOAD");

                                reqList.add(new ScholarshipRequirement(reqId, reqTitle, reqDesc, reqStatus));
                            }
                        }

                        if (getActivity() != null) {
                            getActivity().runOnUiThread(() -> {
                                if (tvScholarshipName != null) tvScholarshipName.setText(programName);
                                if (tvScholarshipAcadYear != null) tvScholarshipAcadYear.setText(acadYear);
                                if (tvScholarshipGrantStatus != null) tvScholarshipGrantStatus.setText("✔ " + grantStatus);
                                if (tvScholarshipDocCount != null) tvScholarshipDocCount.setText(verifiedCount + " of " + totalCount + " Documents");
                                if (tvScholarshipProgressPercent != null) tvScholarshipProgressPercent.setText(progress + "%");
                                if (progressBarCompliance != null) progressBarCompliance.setProgress(progress);
                                if (tvScholarshipCutoff != null) tvScholarshipCutoff.setText("🕒 Next critical cutoff: " + nextCutoff);
                                if (tvApprovedCount != null) tvApprovedCount.setText(String.valueOf(verifiedCount));
                                if (tvInReviewCount != null) tvInReviewCount.setText(String.valueOf(reviewingCount));
                                if (tvRequiredCount != null) tvRequiredCount.setText(String.valueOf(requiredCount));
                                if (tvStipendTimeline != null) tvStipendTimeline.setText("Once all documents are validated, your semestral allowance (" + stipendAmount + ") will be credited directly to your registered Landbank / Maya account within 5 business days.");

                                if (rvRequirements != null) {
                                    rvRequirements.setAdapter(new ScholarshipRequirementsAdapter(reqList, req -> {
                                        selectedRequirementTitle = req.getTitle();
                                        filePickerLauncher.launch("*/*");
                                    }));
                                }
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
                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            ApiClient.clearAuthToken(requireContext());
                            Toast.makeText(requireContext(), "Session expired. Please sign in again.", Toast.LENGTH_LONG).show();
                            Intent intent = new Intent(getActivity(), LoginActivity.class);
                            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                            startActivity(intent);
                        });
                    }
                }
            }
        });
    }

    private void uploadRequirementDocument(String docType, Uri uri) {
        if (getContext() == null) return;
        Toast.makeText(getContext(), "Uploading " + docType + "...", Toast.LENGTH_SHORT).show();

        ApiClient.postMultipart(getContext(), "upload_document.php", docType, uri, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                if (getActivity() != null) {
                    getActivity().runOnUiThread(() -> {
                        Toast.makeText(requireContext(), "Document uploaded successfully! Status: Reviewing", Toast.LENGTH_LONG).show();
                        fetchScholarshipCatalogFromApi();
                    });
                }
            }

            @Override
            public void onError(String errorMessage) {
                if (getActivity() != null) {
                    getActivity().runOnUiThread(() -> {
                        Toast.makeText(requireContext(), "Upload failed: " + errorMessage, Toast.LENGTH_LONG).show();
                    });
                }
            }
        });
    }

    private void setupClickListeners(View view) {
        view.findViewById(R.id.btnScholarshipNotifications).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), NotificationsActivity.class));
        });

        view.findViewById(R.id.btnSubmitFiles).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), ScholarshipApplicationActivity.class));
        });

        view.findViewById(R.id.btnScholarshipGuidelines).setOnClickListener(v -> {
            Toast.makeText(getContext(), "Downloading CHED Grant Guidelines (PDF)", Toast.LENGTH_SHORT).show();
        });
    }
}
