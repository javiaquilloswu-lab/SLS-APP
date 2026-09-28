package com.swu.phinma.studentlife.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.R;
import com.swu.phinma.studentlife.models.ScholarshipRequirement;
import java.util.List;

public class ScholarshipRequirementsAdapter extends RecyclerView.Adapter<ScholarshipRequirementsAdapter.ViewHolder> {
    private final List<ScholarshipRequirement> items;
    private final OnUploadClickListener uploadListener;

    public interface OnUploadClickListener {
        void onUploadClick(ScholarshipRequirement requirement);
    }

    public ScholarshipRequirementsAdapter(List<ScholarshipRequirement> items, OnUploadClickListener uploadListener) {
        this.items = items;
        this.uploadListener = uploadListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_scholarship_requirement, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ScholarshipRequirement item = items.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvSubtitle.setText(item.getDescription());

        if ("VERIFIED".equalsIgnoreCase(item.getStatus())) {
            holder.tvBadge.setText("✔ Verified");
            holder.tvBadge.setBackgroundResource(R.drawable.bg_pill_active);
            holder.tvBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_green_text));
        } else if ("REVIEWING".equalsIgnoreCase(item.getStatus())) {
            holder.tvBadge.setText("🔄 Reviewing");
            holder.tvBadge.setBackgroundResource(R.drawable.bg_pill_reviewing);
            holder.tvBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_purple_text));
        } else {
            holder.tvBadge.setText("↑ Upload");
            holder.tvBadge.setBackgroundResource(R.drawable.bg_pill_rejected);
            holder.tvBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.secondary_ruby));
            holder.tvBadge.setOnClickListener(v -> {
                if (uploadListener != null) uploadListener.onUploadClick(item);
            });
        }
    }

    @Override
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvSubtitle, tvBadge;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvRequirementTitle);
            tvSubtitle = itemView.findViewById(R.id.tvRequirementSubtitle);
            tvBadge = itemView.findViewById(R.id.tvRequirementBadge);
        }
    }
}
