/**
 * Centralized API Base URL Configuration for Student Life - SWU PHINMA
 * 
 * Supports:
 * - Localhost XAMPP (http://localhost:8080/android_api)
 * - Android Emulator loopback (http://10.0.2.2:8080/android_api)
 * - Physical Android device over LAN (http://192.168.x.x:8080/android_api)
 * - Runtime user customization stored in localStorage
 */

const STORAGE_KEY = 'swu_studentlife_api_base_url';
export const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined'
    ? `http://${window.location.hostname === 'localhost' ? 'localhost' : '192.168.1.6:8080'}:8080/android_api`
    : 'http://localhost:8080/android_api';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim() !== '') {
      const cleanSaved = saved.trim().replace(/\/+$/, '');
      // Prevent stale default port 80 URL from overriding current port 8080 configuration
      const isStalePort80 = /^(http:\/\/(localhost|127\.0\.0\.1)(:80)?\/android_api)$/i.test(cleanSaved);
      if (isStalePort80) {
        localStorage.setItem(STORAGE_KEY, DEFAULT_API_BASE_URL);
        return DEFAULT_API_BASE_URL;
      }
      return cleanSaved;
    }
  }
  // Check Vite environment variable if provided
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, cleanUrl);
  }
}

export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const API_ENDPOINTS = {
  TEST_CONNECTION: '/test_connection.php',
  REGISTER: '/register.php',
  LOGIN: '/login.php',
  GET_STUDENTS: '/get_students.php',
  GET_STUDENT: '/get_student.php',
  UPLOAD_DOCUMENT: '/upload_document.php',
  CHATBOT: '/chatbot.php',
  REQUESTS: '/requests.php',
  SCHOLARSHIPS: '/scholarships.php',
  NOTIFICATIONS: '/notifications.php',
  ADMIN: '/admin.php'
} as const;
