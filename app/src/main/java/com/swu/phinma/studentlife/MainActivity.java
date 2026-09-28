package com.swu.phinma.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;
import com.swu.phinma.studentlife.fragments.DashboardFragment;
import com.swu.phinma.studentlife.fragments.ScholarshipFragment;
import com.swu.phinma.studentlife.fragments.ServicesFragment;

/**
 * Main Container Activity.
 * Hosts the 4 primary tabs via the custom floating bottom navigation:
 * 1. Home (DashboardFragment)
 * 2. Services (ServicesFragment)
 * 3. Scholarship (ScholarshipFragment)
 * 4. Requests (Launches RequestHistoryActivity or switches tab)
 */
public class MainActivity extends AppCompatActivity {

    private int currentTab = 0; // 0=Home, 1=Services, 2=Scholarship, 3=Requests

    private View navHome, navServices, navScholarship, navRequests;
    private ImageView ivNavHome, ivNavServices, ivNavScholarship, ivNavRequests;
    private TextView tvNavHome, tvNavServices, tvNavScholarship, tvNavRequests;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        bindViews();
        setupNavigationListeners();

        // Default to Dashboard
        if (savedInstanceState == null) {
            selectTab(0);
        }
    }

    private void bindViews() {
        navHome = findViewById(R.id.navHome);
        navServices = findViewById(R.id.navServices);
        navScholarship = findViewById(R.id.navScholarship);
        navRequests = findViewById(R.id.navRequests);

        ivNavHome = findViewById(R.id.ivNavHome);
        ivNavServices = findViewById(R.id.ivNavServices);
        ivNavScholarship = findViewById(R.id.ivNavScholarship);
        ivNavRequests = findViewById(R.id.ivNavRequests);

        tvNavHome = findViewById(R.id.tvNavHome);
        tvNavServices = findViewById(R.id.tvNavServices);
        tvNavScholarship = findViewById(R.id.tvNavScholarship);
        tvNavRequests = findViewById(R.id.tvNavRequests);
    }

    private void setupNavigationListeners() {
        navHome.setOnClickListener(v -> selectTab(0));
        navServices.setOnClickListener(v -> selectTab(1));
        navScholarship.setOnClickListener(v -> selectTab(2));
        navRequests.setOnClickListener(v -> {
            // Direct launch to RequestHistoryActivity matching flow or internal tab
            startActivity(new Intent(MainActivity.this, RequestHistoryActivity.class));
        });
    }

    public void selectTab(int index) {
        currentTab = index;
        Fragment fragment = null;

        int activeColor = ContextCompat.getColor(this, R.color.primary_maroon);
        int inactiveColor = ContextCompat.getColor(this, R.color.text_secondary);

        // Reset all to inactive
        ivNavHome.setColorFilter(inactiveColor);
        tvNavHome.setTextColor(inactiveColor);
        ivNavServices.setColorFilter(inactiveColor);
        tvNavServices.setTextColor(inactiveColor);
        ivNavScholarship.setColorFilter(inactiveColor);
        tvNavScholarship.setTextColor(inactiveColor);
        ivNavRequests.setColorFilter(inactiveColor);
        tvNavRequests.setTextColor(inactiveColor);

        switch (index) {
            case 0:
                fragment = new DashboardFragment();
                ivNavHome.setColorFilter(activeColor);
                tvNavHome.setTextColor(activeColor);
                break;
            case 1:
                fragment = new ServicesFragment();
                ivNavServices.setColorFilter(activeColor);
                tvNavServices.setTextColor(activeColor);
                break;
            case 2:
                fragment = new ScholarshipFragment();
                ivNavScholarship.setColorFilter(activeColor);
                tvNavScholarship.setTextColor(activeColor);
                break;
            case 3:
                startActivity(new Intent(MainActivity.this, RequestHistoryActivity.class));
                return;
        }

        if (fragment != null) {
            FragmentTransaction ft = getSupportFragmentManager().beginTransaction();
            ft.replace(R.id.fragmentContainer, fragment);
            ft.commit();
        }
    }
}
