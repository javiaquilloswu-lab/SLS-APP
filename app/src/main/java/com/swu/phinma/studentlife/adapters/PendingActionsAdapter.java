package com.swu.phinma.studentlife.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.R;
import com.swu.phinma.studentlife.models.PendingAction;
import java.util.List;

public class PendingActionsAdapter extends RecyclerView.Adapter<PendingActionsAdapter.ViewHolder> {
    private final List<PendingAction> items;
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(PendingAction action);
    }

    public PendingActionsAdapter(List<PendingAction> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_pending_action, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        PendingAction item = items.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvSubtitle.setText(item.getDueDate() + " • " + item.getDepartment());
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onItemClick(item);
        });
    }

    @Override
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle;
        TextView tvSubtitle;
        View dotIndicator;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvActionTitle);
            tvSubtitle = itemView.findViewById(R.id.tvActionSubtitle);
            dotIndicator = itemView.findViewById(R.id.dotIndicator);
        }
    }
}
