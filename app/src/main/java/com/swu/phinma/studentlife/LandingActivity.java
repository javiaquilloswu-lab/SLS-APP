package com.swu.phinma.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Landing / Welcome screen for Student Life - SWU PHINMA.
 * Matches student_life_welcome_auth.png.
 */
public class LandingActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_landing);

        View btnSignIn = findViewById(R.id.btnSignIn);
        View btnSignUp = findViewById(R.id.btnSignUp);

        btnSignIn.setOnClickListener(v -> {
            Intent intent = new Intent(LandingActivity.this, LoginActivity.class);
            startActivity(intent);
        });

        btnSignUp.setOnClickListener(v -> {
            Intent intent = new Intent(LandingActivity.this, SignUpActivity.class);
            startActivity(intent);
        });
    }
}
