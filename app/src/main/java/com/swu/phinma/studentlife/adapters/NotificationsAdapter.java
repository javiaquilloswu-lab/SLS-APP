package com.swu.phinma.studentlife.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.swu.phinma.studentlife.R;
import com.swu.phinma.studentlife.models.NotificationItem;
import java.util.List;

public class NotificationsAdapter extends RecyclerView.Adapter<NotificationsAdapter.ViewHolder> {
    private final List<NotificationItem> items;
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(NotificationItem notification);
    }

    public NotificationsAdapter(List<NotificationItem> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_notification, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        NotificationItem item = items.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvBody.setText(item.getBody());
        holder.tvFooter.setText(item.getTimestamp() + " • " + item.getStatusTag());
        holder.dotUnread.setVisibility(item.isUnread() ? View.VISIBLE : View.GONE);

        holder.itemView.setOnClickListener(v -> {
            item.setUnread(false);
            holder.dotUnread.setVisibility(View.GONE);
            if (listener != null) listener.onItemClick(item);
        });
    }

    @Override
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvBody, tvFooter;
        View dotUnread;

        ViewHolder(View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvNotificationTitle);
            tvBody = itemView.findViewById(R.id.tvNotificationBody);
            tvFooter = itemView.findViewById(R.id.tvNotificationFooter);
            dotUnread = itemView.findViewById(R.id.dotUnreadIndicator);
        }
    }
}
