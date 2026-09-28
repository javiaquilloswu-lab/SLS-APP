/**
 * Student Life - PHP + PostgreSQL API Client
 * Centralized REST API client for Southwestern University PHINMA
 */

import { getApiBaseUrl, API_ENDPOINTS } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface StudentProfile {
  id?: number;
  student_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  course?: string;
  year_level?: string;
  academic_status?: string;
  requirements_progress?: number;
  verified_docs_count?: number;
  total_docs_count?: number;
  pending_actions_count?: number;
}

export interface RequestItem {
  id: number | string;
  title: string;
  department: string;
  reference_number: string;
  submission_date: string;
  status: string;
  status_message?: string;
  category?: string;
}

export interface ScholarshipData {
  program_name: string;
  academic_year: string;
  grant_status: string;
  progress_percent: number;
  verified_count: number;
  reviewing_count: number;
  required_count: number;
  total_count: number;
  requirements: Array<{
    id: number | string;
    title: string;
    description: string;
    status: 'VERIFIED' | 'REVIEWING' | 'UPLOAD' | string;
  }>;
  stipend_amount: string;
  next_critical_cutoff: string;
}

export interface NotificationItemData {
  id: number | string;
  title: string;
  body: string;
  category: string;
  status_tag: string;
  is_unread: boolean;
  timestamp: string;
}

const TOKEN_KEY = 'swu_studentlife_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/**
 * Perform fetch with timeout and session Bearer token injection
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers || {});
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const StudentLifeApi = {
  /**
   * Test database and PHP connection
   */
  async testConnection(): Promise<{ connected: boolean; message: string; details?: any }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.TEST_CONNECTION}`, {
        method: 'GET'
      }, 4000);
      const json: ApiResponse = await res.json();
      return {
        connected: json.success,
        message: json.message,
        details: json.data
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err.name === 'AbortError'
          ? 'Connection timed out. Ensure XAMPP Apache is running.'
          : 'Failed to reach local PHP server. Check if Apache is running on port 8080.'
      };
    }
  },

  /**
   * Authenticate student with existing account
   */
  async login(studentIdOrEmail: string, password: string): Promise<ApiResponse<{ student: StudentProfile; token: string }>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentIdOrEmail,
          password
        })
      });

      const data = await res.json();
      if (data && data.success && data.data && data.data.token) {
        setStoredAuthToken(data.data.token);
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Network error connecting to PHP backend');
    }
  },

  /**
   * Register new student into PostgreSQL
   */
  async register(params: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    student_id: string;
    password: string;
    course?: string;
    year_level?: string;
  }): Promise<ApiResponse> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Network error connecting to PHP backend');
    }
  },

  /**
   * Get student profile
   */
  async getStudentProfile(studentId: string): Promise<ApiResponse<StudentProfile>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.GET_STUDENT}?student_id=${encodeURIComponent(studentId)}`);
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Network error retrieving student profile');
    }
  },

  /**
   * Upload document file (multipart/form-data)
   */
  async uploadDocument(file: File, studentId: string, documentType: string): Promise<ApiResponse<{ document_id: number; file_url: string; original_filename: string }>> {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('document', file);
    formData.append('student_id', studentId);
    formData.append('document_type', documentType);

    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.UPLOAD_DOCUMENT}`, {
        method: 'POST',
        body: formData
      }, 15000);

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upload document to PHP server');
    }
  },

  /**
   * Send chatbot message via PHP AI endpoint
   */
  async sendChatMessage(
    message: string,
    studentId: string,
    history: Array<{ sender: 'bot' | 'user'; text: string }> = []
  ): Promise<ApiResponse<{ reply: string; ticket_ref: string; time: string; model_used: string }>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.CHATBOT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          student_id: studentId,
          history
        })
      }, 15000);

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Chatbot request failed');
    }
  },

  /**
   * Get requests history
   */
  async getRequests(studentId: string, filterStatus = 'all'): Promise<ApiResponse<RequestItem[]>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(
        `${baseUrl}${API_ENDPOINTS.REQUESTS}?student_id=${encodeURIComponent(studentId)}&status=${encodeURIComponent(filterStatus)}`
      );
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch requests');
    }
  },

  /**
   * Submit new document / clearance / service request
   */
  async submitRequest(params: {
    student_id: string;
    title: string;
    department?: string;
    category?: string;
  }): Promise<ApiResponse> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.REQUESTS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit request');
    }
  },

  /**
   * Get scholarship checklist & status
   */
  async getScholarshipOverview(studentId: string): Promise<ApiResponse<ScholarshipData>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.SCHOLARSHIPS}?student_id=${encodeURIComponent(studentId)}`);
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch scholarship information');
    }
  },

  /**
   * Submit scholarship application
   */
  async submitScholarshipApplication(params: {
    student_id: string;
    program_name: string;
    academic_year: string;
    application_type: string;
  }): Promise<ApiResponse> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.SCHOLARSHIPS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit scholarship application');
    }
  },

  /**
   * Get student notifications
   */
  async getNotifications(studentId: string): Promise<ApiResponse<{ unread_count: number; notifications: NotificationItemData[] }>> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.NOTIFICATIONS}?student_id=${encodeURIComponent(studentId)}`);
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch notifications');
    }
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(studentId: string): Promise<ApiResponse> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetchWithTimeout(`${baseUrl}${API_ENDPOINTS.NOTIFICATIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to mark notifications read');
    }
  }
};
