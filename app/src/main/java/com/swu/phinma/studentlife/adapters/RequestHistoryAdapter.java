package com.swu.phinma.studentlife.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.R;
import com.swu.phinma.studentlife.models.RequestHistoryItem;
import java.util.List;

public class RequestHistoryAdapter extends RecyclerView.Adapter<RequestHistoryAdapter.ViewHolder> {
    private final List<RequestHistoryItem> items;
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(RequestHistoryItem item);
        void onCancelClick(RequestHistoryItem item);
    }

    public RequestHistoryAdapter(List<RequestHistoryItem> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_request_history, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RequestHistoryItem item = items.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvDept.setText(item.getDepartment());
        holder.tvRef.setText("Ref: " + item.getReferenceNumber());
        holder.tvDate.setText("Submitted " + item.getSubmissionDate());
        holder.tvStatus.setText("● " + item.getStatus());

        // Bind Requirements Submission Progress (Separated from Request Status)
        int sub = item.getSubmittedReqs();
        int tot = item.getTotalReqs();
        int pct = item.getProgressPercent();

        if (holder.tvProgressText != null) {
            holder.tvProgressText.setText("Requirements Progress: " + sub + "/" + tot + " Uploaded (" + pct + "%)");
        }
        if (holder.progressSubmissions != null) {
            holder.progressSubmissions.setProgress(pct);
        }

        if ("Completed".equalsIgnoreCase(item.getStatus()) || "Approved".equalsIgnoreCase(item.getStatus())) {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_active);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_green_text));
        } else if ("Rejected".equalsIgnoreCase(item.getStatus())) {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_rejected);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.secondary_ruby));
        } else if ("Under Review".equalsIgnoreCase(item.getStatus())) {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_reviewing);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_purple_text));
        } else {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_processing);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_blue_text));
        }

        // Tapping card or View Details opens Request Details Screen (RequestTrackingActivity)
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onItemClick(item);
        });

        if (holder.btnDetails != null) {
            holder.btnDetails.setOnClickListener(v -> {
                if (listener != null) listener.onItemClick(item);
            });
        }

        // Long-pressing card or tapping status pill prompts Cancellation if eligible
        holder.itemView.setOnLongClickListener(v -> {
            if (listener != null) listener.onCancelClick(item);
            return true;
        });

        if (holder.tvStatus != null) {
            holder.tvStatus.setOnClickListener(v -> {
                if (listener != null) listener.onCancelClick(item);
            });
        }
    }

    @Override
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvDept, tvRef, tvDate, tvStatus, tvProgressText, btnDetails;
        ProgressBar progressSubmissions;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvHistoryItemTitle);
            tvDept = itemView.findViewById(R.id.tvHistoryItemDept);
            tvRef = itemView.findViewById(R.id.tvHistoryRef);
            tvDate = itemView.findViewById(R.id.tvHistoryDate);
            tvStatus = itemView.findViewById(R.id.tvHistoryStatusPill);
            tvProgressText = itemView.findViewById(R.id.tvReqsProgressText);
            progressSubmissions = itemView.findViewById(R.id.progressReqSubmissions);
            btnDetails = itemView.findViewById(R.id.btnViewDetails);
        }
    }
}
