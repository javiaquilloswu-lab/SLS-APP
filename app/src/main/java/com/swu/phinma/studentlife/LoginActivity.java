package com.swu.phinma.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.text.TextUtils;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONObject;
import com.swu.phinma.studentlife.api.ApiClient;

/**
 * Sign In / Welcome back screen for Student Life.
 * Matches student_life_welcome_sign_in.png.
 */
public class LoginActivity extends AppCompatActivity {

    private EditText etStudentId;
    private EditText etPassword;
    private ImageView ivTogglePassword;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etStudentId = findViewById(R.id.etStudentId);
        etPassword = findViewById(R.id.etPassword);
        ivTogglePassword = findViewById(R.id.ivTogglePassword);

        // Toggle password visibility
        if (ivTogglePassword != null) {
            ivTogglePassword.setOnClickListener(v -> {
                isPasswordVisible = !isPasswordVisible;
                if (isPasswordVisible) {
                    etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                } else {
                    etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                }
                etPassword.setSelection(etPassword.getText().length());
            });
        }

        findViewById(R.id.btnDoSignIn).setOnClickListener(v -> attemptSignIn());

        TextView tvLinkSignUp = findViewById(R.id.tvLinkSignUp);
        if (tvLinkSignUp != null) {
            tvLinkSignUp.setOnClickListener(v -> {
                startActivity(new Intent(LoginActivity.this, SignUpActivity.class));
            });
        }
    }

    private void attemptSignIn() {
        String studentId = etStudentId.getText().toString().trim();
        String password = etPassword.getText().toString();

        if (TextUtils.isEmpty(studentId)) {
            etStudentId.setError("Student ID or Email is required");
            return;
        }
        if (TextUtils.isEmpty(password)) {
            etPassword.setError("Password is required");
            return;
        }

        JSONObject payload = new JSONObject();
        try {
            payload.put("student_id", studentId);
            payload.put("password", password);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to format request", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.postJson(this, "login.php", payload.toString(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(String jsonResponse) {
                try {
                    JSONObject obj = new JSONObject(jsonResponse);
                    boolean success = obj.optBoolean("success", false);
                    String message = obj.optString("message", "Authentication failed");

                    if (success && obj.has("data")) {
                        JSONObject dataObj = obj.getJSONObject("data");
                        String token = dataObj.optString("token", "");

                        if (!TextUtils.isEmpty(token)) {
                            ApiClient.setAuthToken(LoginActivity.this, token);
                            if (dataObj.has("student")) {
                                ApiClient.saveStudentProfile(LoginActivity.this, dataObj.getJSONObject("student"));
                            }

                            runOnUiThread(() -> {
                                Toast.makeText(LoginActivity.this, "Sign-in successful", Toast.LENGTH_SHORT).show();
                                Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                                startActivity(intent);
                                finish();
                            });
                            return;
                        }
                    }

                    // Strict Error Behavior: Remain on LoginActivity
                    runOnUiThread(() -> {
                        Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        Toast.makeText(LoginActivity.this, "Response parsing error. Please try again.", Toast.LENGTH_LONG).show();
                    });
                }
            }

            @Override
            public void onError(String errorMessage) {
                String userFacingMsg = errorMessage;
                try {
                    int jsonStart = errorMessage.indexOf('{');
                    if (jsonStart >= 0) {
                        JSONObject errJson = new JSONObject(errorMessage.substring(jsonStart));
                        if (errJson.has("message")) {
                            userFacingMsg = errJson.getString("message");
                        }
                    }
                } catch (Exception ignored) {}

                final String finalMsg = userFacingMsg;
                // Strict Error Behavior: Remain on LoginActivity
                runOnUiThread(() -> {
                    Toast.makeText(LoginActivity.this, finalMsg, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
}
