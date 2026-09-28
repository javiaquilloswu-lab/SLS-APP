package com.swu.phinma.studentlife.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.*;
import com.swu.phinma.studentlife.adapters.PendingActionsAdapter;
import com.swu.phinma.studentlife.adapters.RecentRequestsAdapter;
import com.swu.phinma.studentlife.api.ApiClient;
import com.swu.phinma.studentlife.models.PendingAction;
import com.swu.phinma.studentlife.models.RecentRequest;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class DashboardFragment extends Fragment {

    private TextView tvStudentName, tvStudentInfo, tvRequirementPercentage, tvVerifiedDocuments, badgeActiveStatus;
    private ProgressBar progressRequirements;
    private RecyclerView rvPendingActions, rvRecentRequests;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);
        bindViews(view);
        populateStudentData();
        fetchLiveProfileFromDatabase();
        fetchLiveRecentRequestsFromApi();
        fetchLivePendingActionsFromApi();
        setupRecyclerViews();
        setupClickListeners(view);
        return view;
    }

    private void fetchLiveProfileFromDatabase() {
        if (getContext() == null) return;
        ApiClient.get(getContext(), "get_student.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    if (success && obj.has("data")) {
                        JSONObject studentData = obj.getJSONObject("data");
                        ApiClient.saveStudentProfile(getContext(), studentData);
                        if (getActivity() != null) {
                            getActivity().runOnUiThread(() -> populateStudentData());
                        }
                    }
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(String errorMessage) {
                if (errorMessage != null && (errorMessage.contains("401") || errorMessage.contains("403") || errorMessage.contains("Authentication required") || errorMessage.contains("Forbidden"))) {
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

    private void fetchLiveRecentRequestsFromApi() {
        if (getContext() == null) return;
        ApiClient.get(getContext(), "requests.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.has("data")) {
                        JSONArray array = obj.getJSONArray("data");
                        List<RecentRequest> list = new ArrayList<>();
                        for (int i = 0; i < Math.min(array.length(), 5); i++) {
                            JSONObject item = array.getJSONObject(i);
                            String id = String.valueOf(item.opt("id"));
                            String title = item.optString("title", "Request");
                            String refNum = item.optString("reference_number", "SL-2026-REG");
                            String date = item.optString("submission_date", "Recent");
                            String status = item.optString("status", "Processing");
                            String statusMsg = item.optString("status_message", "In processing");

                            list.add(new RecentRequest(id, title, refNum, date, status, statusMsg));
                        }

                        if (getActivity() != null) {
                            getActivity().runOnUiThread(() -> {
                                rvRecentRequests.setAdapter(new RecentRequestsAdapter(list, req -> {
                                    startActivity(new Intent(getActivity(), RequestHistoryActivity.class));
                                }));
                            });
                        }
                    }
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(String errorMessage) {}
        });
    }

    private void fetchLivePendingActionsFromApi() {
        if (getContext() == null) return;

        ApiClient.get(getContext(), "scholarships.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.optBoolean("success", false) && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        String nextCutoff = dataObj.optString("next_critical_cutoff", "Upcoming");

                        List<PendingAction> actionList = new ArrayList<>();
                        if (dataObj.has("requirements")) {
                            JSONArray array = dataObj.getJSONArray("requirements");
                            for (int i = 0; i < array.length(); i++) {
                                JSONObject reqObj = array.getJSONObject(i);
                                String reqStatus = reqObj.optString("status", "UPLOAD");
                                if ("UPLOAD".equalsIgnoreCase(reqStatus) || "REJECTED".equalsIgnoreCase(reqStatus)) {
                                    String id = String.valueOf(reqObj.opt("id"));
                                    String title = reqObj.optString("title", "Requirement Upload");
                                    actionList.add(new PendingAction(id, "Upload " + title, "Due " + nextCutoff, "Scholarship Grants Office", "high"));
                                }
                            }
                        }

                        if (getActivity() != null) {
                            getActivity().runOnUiThread(() -> {
                                rvPendingActions.setAdapter(new PendingActionsAdapter(actionList, action -> {
                                    Toast.makeText(getContext(), "Opening " + action.getTitle(), Toast.LENGTH_SHORT).show();
                                    startActivity(new Intent(getActivity(), ScholarshipApplicationActivity.class));
                                }));
                            });
                        }
                    }
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(String errorMessage) {}
        });
    }

    private void bindViews(View view) {
        tvStudentName = view.findViewById(R.id.tvStudentName);
        tvStudentInfo = view.findViewById(R.id.tvStudentInfo);
        tvRequirementPercentage = view.findViewById(R.id.tvRequirementPercentage);
        tvVerifiedDocuments = view.findViewById(R.id.tvVerifiedDocuments);
        badgeActiveStatus = view.findViewById(R.id.badgeActiveStatus);
        progressRequirements = view.findViewById(R.id.progressRequirements);
        rvPendingActions = view.findViewById(R.id.rvPendingActions);
        rvRecentRequests = view.findViewById(R.id.rvRecentRequests);
    }

    private void populateStudentData() {
        String[] savedProfile = ApiClient.getSavedStudentProfile(getContext());
        if (savedProfile != null && savedProfile.length >= 9) {
            String fullName = savedProfile[0];
            String studentNum = savedProfile[1];
            String course = savedProfile[2];
            String year = savedProfile[3];
            String status = savedProfile[5];
            int progress = Integer.parseInt(savedProfile[6]);
            int verified = Integer.parseInt(savedProfile[7]);
            int total = Integer.parseInt(savedProfile[8]);

            tvStudentName.setText(fullName);
            tvStudentInfo.setText("ID: " + studentNum + " • " + course + " • " + year);
            if (badgeActiveStatus != null) {
                badgeActiveStatus.setText("✔ " + status);
            }
            tvRequirementPercentage.setText(progress + "%");
            progressRequirements.setProgress(progress);
            tvVerifiedDocuments.setText(verified + " of " + total + " verified documents");
        } else {
            tvStudentName.setText("SWU Student");
            tvStudentInfo.setText("ID: Loading... • BS Computer Science • 3rd Year");
            if (badgeActiveStatus != null) {
                badgeActiveStatus.setText("✔ Active");
            }
            tvRequirementPercentage.setText("0%");
            progressRequirements.setProgress(0);
            tvVerifiedDocuments.setText("0 verified documents");
        }
    }

    private void setupRecyclerViews() {
        rvPendingActions.setLayoutManager(new LinearLayoutManager(getContext()));
        rvPendingActions.setAdapter(new PendingActionsAdapter(new ArrayList<>(), action -> {
            Toast.makeText(getContext(), "Opening " + action.getTitle(), Toast.LENGTH_SHORT).show();
            startActivity(new Intent(getActivity(), ScholarshipApplicationActivity.class));
        }));

        rvRecentRequests.setLayoutManager(new LinearLayoutManager(getContext()));
        rvRecentRequests.setAdapter(new RecentRequestsAdapter(new ArrayList<>(), req -> {
            startActivity(new Intent(getActivity(), RequestHistoryActivity.class));
        }));
    }

    private void setupClickListeners(View view) {
        view.findViewById(R.id.btnNotifications).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), NotificationsActivity.class));
        });

        view.findViewById(R.id.tvViewAllRecent).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), RequestHistoryActivity.class));
        });

        // Quick services
        view.findViewById(R.id.quickScholarship).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).selectTab(2);
            }
        });

        view.findViewById(R.id.quickDocuments).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), DocumentRequestsActivity.class));
        });

        view.findViewById(R.id.quickConcerns).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), StudentConcernActivity.class));
        });

        view.findViewById(R.id.quickLostId).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), DocumentRequestsActivity.class));
        });

        view.findViewById(R.id.quickHistory).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), RequestHistoryActivity.class));
        });

        view.findViewById(R.id.cardGuidance).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), StudentConcernActivity.class));
        });

        // User Profile Avatar - Logout Action
        View btnProfile = view.findViewById(R.id.btnProfile);
        if (btnProfile != null) {
            btnProfile.setOnClickListener(v -> {
                new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                    .setTitle("Sign Out")
                    .setMessage("Are you sure you want to log out of Student Life?")
                    .setPositiveButton("Log Out", (dialog, which) -> {
                        com.swu.phinma.studentlife.api.ApiClient.clearAuthToken(requireContext());
                        Toast.makeText(requireContext(), "Logged out successfully", Toast.LENGTH_SHORT).show();
                        Intent intent = new Intent(getActivity(), LoginActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            });
        }
    }
}
