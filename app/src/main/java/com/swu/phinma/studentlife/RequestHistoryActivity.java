package com.swu.phinma.studentlife;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.adapters.RequestHistoryAdapter;
import com.swu.phinma.studentlife.api.ApiClient;
import com.swu.phinma.studentlife.models.RequestHistoryItem;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Request History screen with live search and status filter chips.
 * Matches student_life_request_history.png.
 */
public class RequestHistoryActivity extends AppCompatActivity {

    private RecyclerView rvHistory;
    private RequestHistoryAdapter adapter;
    private List<RequestHistoryItem> allItems;
    private List<RequestHistoryItem> displayedItems;
    private EditText etSearch;

    private TextView filterAll, filterUnderReview, filterProcessing, filterCompleted;
    private String currentFilter = "ALL";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_request_history);

        if (findViewById(R.id.btnBack) != null) {
            findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        }

        rvHistory = findViewById(R.id.rvRequestHistory);
        etSearch = findViewById(R.id.etSearchHistory);

        filterAll = findViewById(R.id.filterAll);
        filterUnderReview = findViewById(R.id.filterUnderReview);
        filterProcessing = findViewById(R.id.filterProcessing);
        filterCompleted = findViewById(R.id.filterCompleted);

        allItems = new ArrayList<>();
        displayedItems = new ArrayList<>();

        adapter = new RequestHistoryAdapter(displayedItems, item -> {
            promptCancelRequest(item);
        });

        rvHistory.setLayoutManager(new LinearLayoutManager(this));
        rvHistory.setAdapter(adapter);

        setupFilterChips();
        setupSearch();
        fetchRequestsFromApi();

        findViewById(R.id.btnExportHistory).setOnClickListener(v -> {
            Toast.makeText(this, "Exporting request history report (PDF/CSV)", Toast.LENGTH_SHORT).show();
        });
    }

    private void promptCancelRequest(RequestHistoryItem item) {
        if (item == null) return;
        String status = item.getStatus().toLowerCase();

        if (status.contains("completed") || status.contains("approved") || status.contains("rejected") || status.contains("cancelled")) {
            Toast.makeText(this, "Request " + item.getReferenceNumber() + " (" + item.getStatus() + ") cannot be cancelled.", Toast.LENGTH_SHORT).show();
            return;
        }

        new AlertDialog.Builder(this)
                .setTitle("Cancel Request")
                .setMessage("Are you sure you want to cancel request #" + item.getReferenceNumber() + " (" + item.getTitle() + ")?")
                .setPositiveButton("Cancel Request", (dialog, which) -> {
                    cancelRequestOnApi(item.getReferenceNumber());
                })
                .setNegativeButton("Back", null)
                .show();
    }

    private void cancelRequestOnApi(String refNum) {
        JSONObject payload = new JSONObject();
        try {
            payload.put("action", "cancel");
            payload.put("reference_number", refNum);
        } catch (Exception e) {
            return;
        }

        ApiClient.postJson(this, "requests.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                runOnUiThread(() -> {
                    Toast.makeText(RequestHistoryActivity.this, "Request #" + refNum + " cancelled.", Toast.LENGTH_SHORT).show();
                    fetchRequestsFromApi();
                });
            }

            @Override
            public void onError(String errorMessage) {
                runOnUiThread(() -> {
                    Toast.makeText(RequestHistoryActivity.this, "Cancellation failed: " + errorMessage, Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void fetchRequestsFromApi() {
        ApiClient.get(this, "requests.php", new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.has("data")) {
                        JSONArray array = obj.getJSONArray("data");
                        List<RequestHistoryItem> list = new ArrayList<>();
                        for (int i = 0; i < array.length(); i++) {
                            JSONObject item = array.getJSONObject(i);
                            String id = String.valueOf(item.opt("id"));
                            String title = item.optString("title", "Service Request");
                            String dept = item.optString("department", "Student Affairs");
                            String refNum = item.optString("reference_number", "SL-2026-REG");
                            String date = item.optString("submission_date", "Recent");
                            String status = item.optString("status", "Processing");

                            list.add(new RequestHistoryItem(id, title, dept, refNum, date, status));
                        }

                        runOnUiThread(() -> {
                            allItems.clear();
                            allItems.addAll(list);
                            filterList();
                        });
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String errorMessage) {
            }
        });
    }

    private void setupFilterChips() {
        if (filterAll != null) filterAll.setOnClickListener(v -> applyFilter("ALL", filterAll));
        if (filterUnderReview != null) filterUnderReview.setOnClickListener(v -> applyFilter("Under Review", filterUnderReview));
        if (filterProcessing != null) filterProcessing.setOnClickListener(v -> applyFilter("Processing", filterProcessing));
        if (filterCompleted != null) filterCompleted.setOnClickListener(v -> applyFilter("Completed", filterCompleted));
    }

    private void applyFilter(String filter, TextView activeView) {
        currentFilter = filter;
        resetFilterChipStyles();

        activeView.setBackgroundResource(R.drawable.bg_card_maroon_banner);
        activeView.setTextColor(ContextCompat.getColor(this, R.color.white));

        filterList();
    }

    private void resetFilterChipStyles() {
        TextView[] chips = {filterAll, filterUnderReview, filterProcessing, filterCompleted};
        for (TextView chip : chips) {
            if (chip != null) {
                chip.setBackgroundResource(R.drawable.bg_pill_processing);
                chip.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.card_surface));
                chip.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            }
        }
    }

    private void setupSearch() {
        if (etSearch == null) return;
        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterList();
            }
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    private void filterList() {
        String query = etSearch != null ? etSearch.getText().toString().trim().toLowerCase() : "";
        displayedItems.clear();

        for (RequestHistoryItem item : allItems) {
            boolean matchesFilter = currentFilter.equals("ALL")
                    || item.getStatus().equalsIgnoreCase(currentFilter)
                    || (currentFilter.equals("Completed") && item.getStatus().equalsIgnoreCase("Approved"));

            boolean matchesQuery = query.isEmpty()
                    || item.getTitle().toLowerCase().contains(query)
                    || item.getReferenceNumber().toLowerCase().contains(query)
                    || item.getDepartment().toLowerCase().contains(query);

            if (matchesFilter && matchesQuery) {
                displayedItems.add(item);
            }
        }
        adapter.notifyDataSetChanged();
    }
}
