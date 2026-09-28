package com.swu.phinma.studentlife.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.R;
import com.swu.phinma.studentlife.models.RecentRequest;
import java.util.List;

public class RecentRequestsAdapter extends RecyclerView.Adapter<RecentRequestsAdapter.ViewHolder> {
    private final List<RecentRequest> items;
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(RecentRequest request);
    }

    public RecentRequestsAdapter(List<RecentRequest> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_recent_request, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RecentRequest item = items.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvRef.setText(item.getReferenceNumber());
        holder.tvDate.setText(item.getDate());
        holder.tvEta.setText(item.getStatusMessage());
        holder.tvStatus.setText(item.getStatus());

        if ("Completed".equalsIgnoreCase(item.getStatus())) {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_active);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_green_text));
        } else {
            holder.tvStatus.setBackgroundResource(R.drawable.bg_pill_processing);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_blue_text));
        }

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onItemClick(item);
        });
    }

    @Override
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvRef, tvStatus, tvDate, tvEta;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvRecentRequestTitle);
            tvRef = itemView.findViewById(R.id.tvRecentRequestRef);
            tvStatus = itemView.findViewById(R.id.tvRecentRequestStatus);
            tvDate = itemView.findViewById(R.id.tvRecentRequestDate);
            tvEta = itemView.findViewById(R.id.tvRecentRequestEta);
        }
    }
}
