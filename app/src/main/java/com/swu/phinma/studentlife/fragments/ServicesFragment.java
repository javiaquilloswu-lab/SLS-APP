package com.swu.phinma.studentlife.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.swu.phinma.studentlife.*;

public class ServicesFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_services, container, false);
        setupClickListeners(view);
        return view;
    }

    private void setupClickListeners(View view) {
        view.findViewById(R.id.btnServicesNotifications).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), NotificationsActivity.class));
        });

        view.findViewById(R.id.cardApplyScholarship).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), ScholarshipApplicationActivity.class));
        });

        view.findViewById(R.id.cardScholarshipRequirements).setOnClickListener(v -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).selectTab(2);
            }
        });

        view.findViewById(R.id.cardSubmitConcern).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), StudentConcernActivity.class));
        });

        view.findViewById(R.id.cardDocCoc).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), DocumentRequestsActivity.class));
        });

        view.findViewById(R.id.cardDocGoodMoral).setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), DocumentRequestsActivity.class));
        });
    }
}
