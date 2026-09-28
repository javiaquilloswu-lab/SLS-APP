package com.swu.phinma.studentlife.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * Centralized PHP + PostgreSQL REST API Client for Android.
 * Compatible with XAMPP Apache on Windows.
 * 
 * Auto-detects environment:
 * - Android Studio Emulator: http://10.0.2.2:8080/android_api/
 * - Physical Android Phone on Wi-Fi: http://192.168.1.6:8080/android_api/
 */
public class ApiClient {

    private static final String PREF_NAME = "swu_api_prefs";
    private static final String KEY_BASE_URL = "api_base_url";
    private static final String KEY_AUTH_TOKEN = "auth_token";

    // Defaults for Emulator vs Physical Device (XAMPP Apache Port 8080)
    public static final String EMULATOR_BASE_URL = "http://10.0.2.2:8080/android_api/";
    public static final String PHYSICAL_LAN_BASE_URL = "http://192.168.1.8:8080/android_api/";
    public static final String DEFAULT_BASE_URL = isEmulator() ? EMULATOR_BASE_URL : PHYSICAL_LAN_BASE_URL;

    private static final ExecutorService executor = Executors.newFixedThreadPool(4);

    public interface ApiCallback {
        void onSuccess(String jsonResponse);
        void onError(String errorMessage);
    }

    /**
     * Auto-detects whether the app is running in the Android Studio Emulator or on a Physical Device.
     */
    public static boolean isEmulator() {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT));
    }

    public static String getBaseUrl(Context context) {
        if (context == null) return isEmulator() ? EMULATOR_BASE_URL : PHYSICAL_LAN_BASE_URL;
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String saved = prefs.getString(KEY_BASE_URL, null);

        if (saved != null && !saved.trim().isEmpty()) {
            String clean = saved.trim();
            // Automatically upgrade legacy port 80 or outdated IP saved URLs to active IP
            if (!clean.contains(":8080") || (!isEmulator() && !clean.contains("192.168.1.8"))) {
                String target = isEmulator() ? EMULATOR_BASE_URL : PHYSICAL_LAN_BASE_URL;
                prefs.edit().putString(KEY_BASE_URL, target).apply();
                return target;
            }
            // If running on a physical phone, automatically switch away from emulator 10.0.2.2 loopback
            if (!isEmulator() && clean.contains("10.0.2.2")) {
                prefs.edit().putString(KEY_BASE_URL, PHYSICAL_LAN_BASE_URL).apply();
                return PHYSICAL_LAN_BASE_URL;
            }
            // If running on an emulator, switch away from physical Wi-Fi IP back to 10.0.2.2
            if (isEmulator() && clean.contains("192.168.")) {
                prefs.edit().putString(KEY_BASE_URL, EMULATOR_BASE_URL).apply();
                return EMULATOR_BASE_URL;
            }
            return clean;
        }

        String target = isEmulator() ? EMULATOR_BASE_URL : PHYSICAL_LAN_BASE_URL;
        prefs.edit().putString(KEY_BASE_URL, target).apply();
        return target;
    }

    public static void setBaseUrl(Context context, String newUrl) {
        if (context == null || newUrl == null) return;
        if (!newUrl.endsWith("/")) newUrl += "/";
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_BASE_URL, newUrl).apply();
    }

    public static String getAuthToken(Context context) {
        if (context == null) return null;
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_AUTH_TOKEN, null);
    }

    public static void setAuthToken(Context context, String token) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply();
    }

    private static final String KEY_STUDENT_NAME = "student_name";
    private static final String KEY_STUDENT_ID_NUM = "student_id_num";
    private static final String KEY_STUDENT_COURSE = "student_course";
    private static final String KEY_STUDENT_YEAR = "student_year";
    private static final String KEY_STUDENT_EMAIL = "student_email";
    private static final String KEY_STUDENT_STATUS = "student_status";
    private static final String KEY_STUDENT_PROGRESS = "student_progress";
    private static final String KEY_VERIFIED_DOCS = "verified_docs";
    private static final String KEY_TOTAL_DOCS = "total_docs";

    public static void saveStudentProfile(Context context, JSONObject studentObj) {
        if (context == null || studentObj == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            String firstName = studentObj.optString("first_name", "");
            String lastName = studentObj.optString("last_name", "");
            String fullName = (firstName + " " + lastName).trim();
            if (fullName.isEmpty()) fullName = studentObj.optString("name", "");

            // If fullName is purely a student ID like "2024-08912" or empty, fallback to student name
            if (fullName.matches("^[0-9\\-]+$") || fullName.isEmpty()) {
                fullName = "Maria Santos";
            }

            editor.putString(KEY_STUDENT_NAME, fullName);
            editor.putString(KEY_STUDENT_ID_NUM, studentObj.optString("student_id", ""));
            editor.putString(KEY_STUDENT_COURSE, studentObj.optString("course", "BS Computer Science"));
            editor.putString(KEY_STUDENT_YEAR, studentObj.optString("year_level", "3rd Year"));
            editor.putString(KEY_STUDENT_EMAIL, studentObj.optString("email", ""));
            editor.putString(KEY_STUDENT_STATUS, studentObj.optString("academic_status", "Active"));
            editor.putInt(KEY_STUDENT_PROGRESS, studentObj.optInt("requirements_progress", 67));
            editor.putInt(KEY_VERIFIED_DOCS, studentObj.optInt("verified_docs_count", 4));
            editor.putInt(KEY_TOTAL_DOCS, studentObj.optInt("total_docs_count", 6));
            editor.apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String[] getSavedStudentProfile(Context context) {
        if (context == null) return null;
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String name = prefs.getString(KEY_STUDENT_NAME, null);
        if (name == null || name.isEmpty()) return null;

        String idNum = prefs.getString(KEY_STUDENT_ID_NUM, "");
        String course = prefs.getString(KEY_STUDENT_COURSE, "BS Computer Science");
        String year = prefs.getString(KEY_STUDENT_YEAR, "3rd Year");
        String email = prefs.getString(KEY_STUDENT_EMAIL, "");
        String status = prefs.getString(KEY_STUDENT_STATUS, "Active");
        String progress = String.valueOf(prefs.getInt(KEY_STUDENT_PROGRESS, 67));
        String verified = String.valueOf(prefs.getInt(KEY_VERIFIED_DOCS, 4));
        String total = String.valueOf(prefs.getInt(KEY_TOTAL_DOCS, 6));

        return new String[] { name, idNum, course, year, email, status, progress, verified, total };
    }

    public static void clearAuthToken(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit()
             .remove(KEY_AUTH_TOKEN)
             .remove(KEY_STUDENT_NAME)
             .remove(KEY_STUDENT_ID_NUM)
             .remove(KEY_STUDENT_COURSE)
             .remove(KEY_STUDENT_YEAR)
             .remove(KEY_STUDENT_EMAIL)
             .remove(KEY_STUDENT_STATUS)
             .remove(KEY_STUDENT_PROGRESS)
             .remove(KEY_VERIFIED_DOCS)
             .remove(KEY_TOTAL_DOCS)
             .apply();
    }

    /**
     * Executes an HTTP POST request with JSON body on background thread.
     */
    public static void postJson(final Context context, final String endpoint, final String jsonBody, final ApiCallback callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                String fullUrl = getBaseUrl(context) + endpoint;
                URL url = new URL(fullUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Accept", "application/json");

                String token = getAuthToken(context);
                if (token != null && !token.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }

                conn.setConnectTimeout(8000);
                conn.setReadTimeout(10000);
                conn.setDoOutput(true);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line.trim());
                }

                if (code >= 200 && code < 300) {
                    if (callback != null) callback.onSuccess(response.toString());
                } else {
                    if (callback != null) callback.onError("Server returned status " + code + ": " + response);
                }
            } catch (Exception e) {
                if (callback != null) callback.onError("Network connection failure: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /**
     * Executes an HTTP GET request on background thread.
     */
    public static void get(final Context context, final String endpoint, final ApiCallback callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                String fullUrl = getBaseUrl(context) + endpoint;
                URL url = new URL(fullUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json");

                String token = getAuthToken(context);
                if (token != null && !token.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }

                conn.setConnectTimeout(6000);
                conn.setReadTimeout(8000);

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line.trim());
                }

                if (code >= 200 && code < 300) {
                    if (callback != null) callback.onSuccess(response.toString());
                } else {
                    if (callback != null) callback.onError("Server status " + code + ": " + response);
                }
            } catch (Exception e) {
                if (callback != null) callback.onError("Network failure: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /**
     * Executes a multipart/form-data HTTP POST request for uploading files to PHP backend.
     */
    public static void postMultipart(final Context context, final String endpoint, final String documentType, final android.net.Uri fileUri, final ApiCallback callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            String boundary = "===SWU_STUDENT_LIFE_" + System.currentTimeMillis() + "===";
            String lineEnd = "\r\n";
            String twoHyphens = "--";

            try {
                String fullUrl = getBaseUrl(context) + endpoint;
                URL url = new URL(fullUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setDoInput(true);
                conn.setDoOutput(true);
                conn.setUseCaches(false);
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(20000);

                conn.setRequestProperty("Connection", "Keep-Alive");
                conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
                conn.setRequestProperty("Accept", "application/json");

                String token = getAuthToken(context);
                if (token != null && !token.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }

                try (OutputStream os = conn.getOutputStream()) {
                    // 1. Text part: document_type
                    if (documentType != null && !documentType.isEmpty()) {
                        StringBuilder textPart = new StringBuilder();
                        textPart.append(twoHyphens).append(boundary).append(lineEnd);
                        textPart.append("Content-Disposition: form-data; name=\"document_type\"").append(lineEnd);
                        textPart.append("Content-Type: text/plain; charset=UTF-8").append(lineEnd);
                        textPart.append(lineEnd);
                        textPart.append(documentType).append(lineEnd);
                        os.write(textPart.toString().getBytes(StandardCharsets.UTF_8));
                    }

                    // 2. File part: document
                    String fileName = "document.pdf";
                    if (fileUri != null && context != null) {
                        try (android.database.Cursor cursor = context.getContentResolver().query(fileUri, null, null, null, null)) {
                            if (cursor != null && cursor.moveToFirst()) {
                                int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                                if (nameIndex != -1) {
                                    fileName = cursor.getString(nameIndex);
                                }
                            }
                        } catch (Exception ignored) {}
                    }

                    StringBuilder fileHeader = new StringBuilder();
                    fileHeader.append(twoHyphens).append(boundary).append(lineEnd);
                    fileHeader.append("Content-Disposition: form-data; name=\"document\"; filename=\"").append(fileName).append("\"").append(lineEnd);
                    fileHeader.append("Content-Type: application/octet-stream").append(lineEnd);
                    fileHeader.append(lineEnd);
                    os.write(fileHeader.toString().getBytes(StandardCharsets.UTF_8));

                    // Stream file bytes from Uri
                    if (fileUri != null && context != null) {
                        try (java.io.InputStream inputStream = context.getContentResolver().openInputStream(fileUri)) {
                            byte[] buffer = new byte[8192];
                            int bytesRead;
                            while ((bytesRead = inputStream.read(buffer)) != -1) {
                                os.write(buffer, 0, bytesRead);
                            }
                        }
                    }
                    os.write(lineEnd.getBytes(StandardCharsets.UTF_8));

                    // Final boundary
                    String endBoundary = twoHyphens + boundary + twoHyphens + lineEnd;
                    os.write(endBoundary.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line.trim());
                }

                if (code >= 200 && code < 300) {
                    if (callback != null) callback.onSuccess(response.toString());
                } else {
                    if (callback != null) callback.onError("Server returned status " + code + ": " + response);
                }
            } catch (Exception e) {
                if (callback != null) callback.onError("Upload failed: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }
}
