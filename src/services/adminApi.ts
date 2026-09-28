/**
 * Southwestern University PHINMA - Student Life Admin API Client
 * Manages communication between the Admin Management Console and the PHP REST API.
 */

import { getApiBaseUrl } from '../config/api';

const ADMIN_TOKEN_KEY = 'swu_studentlife_admin_token';
const ADMIN_PROFILE_KEY = 'swu_studentlife_admin_profile';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
}

export interface AdminStats {
  total_students: number;
  pending_scholarships: number;
  documents_pending_review: number;
  active_requests: number;
  total_concerns: number;
  escalated_concerns: number;
  resolved_concerns: number;
  recent_activities?: Array<{
    type: 'document' | 'request' | 'concern';
    title: string;
    student_name: string;
    status: string;
    event_time: string;
  }>;
  authenticated_admin?: {
    username: string;
    full_name: string;
    department: string;
    role: string;
  };
}

export interface AdminStudent {
  id: number;
  student_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  course: string;
  year_level: string;
  academic_status: string;
  requirements_progress: number;
  verified_docs_count: number;
  total_docs_count: number;
  pending_actions_count: number;
  role: string;
  created_at: string;
}

export interface AdminDocument {
  id: number;
  student_id: string;
  document_type: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size_bytes: number;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  uploaded_at: string;
  student_name?: string;
  course?: string;
  year_level?: string;
}

export interface AdminRequest {
  id: number;
  student_id: string;
  title: string;
  department: string;
  reference_number: string;
  status: string;
  status_message?: string;
  category: string;
  assigned_to?: string;
  updated_at?: string;
  created_at: string;
  student_name?: string;
  course?: string;
  year_level?: string;
}

export interface AdminScholarshipProgram {
  id: number;
  code: string;
  title: string;
  description: string;
  academic_year: string;
  deadline: string;
  stipend_amount: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminScholarshipApplication {
  id: number;
  student_id: string;
  program_name: string;
  academic_year: string;
  application_type: string;
  status: string;
  tracking_ref: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  created_at: string;
  student_name?: string;
  course?: string;
  year_level?: string;
}

export interface AdminNotification {
  id: number;
  student_id: string;
  title: string;
  body: string;
  category: string;
  status_tag: string;
  is_unread: boolean;
  created_at: string;
  student_name?: string;
}

export interface ConcernMessage {
  id: number;
  concern_id: number;
  ticket_ref: string;
  sender_type: 'STUDENT' | 'AI' | 'STAFF' | 'SYSTEM';
  sender_id?: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface AdminConcern {
  id: number;
  student_id: string;
  ticket_ref: string;
  message: string;
  category: string;
  response?: string;
  status: string;
  responded_by?: string;
  responded_at?: string;
  internal_notes?: string;
  assigned_to?: string;
  escalation_reason?: string;
  is_ai_paused: boolean;
  created_at: string;
  updated_at?: string;
  student_name?: string;
  student_email?: string;
  course?: string;
  year_level?: string;
}

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function clearStoredAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

export function getStoredAdminProfile(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAdminProfile(admin: AdminUser): void {
  try {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
  } catch {}
}

export function clearStoredAdminProfile(): void {
  try {
    localStorage.removeItem(ADMIN_PROFILE_KEY);
  } catch {}
}

async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredAdminToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  const json = await response.json().catch(() => ({
    success: false,
    message: `Server returned HTTP ${response.status}`
  }));

  if (!response.ok && !json.message) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return json;
}

export const AdminApi = {
  // Authentication
  async login(identifier: string, password: string): Promise<{ success: boolean; message: string; data?: { admin: AdminUser; token: string } }> {
    const json = await adminFetch('admin_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (json.success && json.data) {
      setStoredAdminToken(json.data.token);
      setStoredAdminProfile(json.data.admin);
    }
    return json;
  },

  async logout(): Promise<void> {
    try {
      await adminFetch('admin_logout.php', { method: 'POST' });
    } finally {
      clearStoredAdminToken();
      clearStoredAdminProfile();
    }
  },

  // Telemetry & Dashboard
  async getStats(): Promise<{ success: boolean; data?: AdminStats; message?: string }> {
    return adminFetch('admin_stats.php', { method: 'GET' });
  },

  // Students Directory
  async getStudents(search = '', course = '', status = ''): Promise<{ success: boolean; data?: { count: number; students: AdminStudent[] }; message?: string }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (course && course !== 'all') params.append('course', course);
    if (status && status !== 'all') params.append('status', status);
    return adminFetch(`admin_students.php?${params.toString()}`, { method: 'GET' });
  },

  // Document Management
  async getDocuments(status = ''): Promise<{ success: boolean; data?: AdminDocument[]; message?: string }> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return adminFetch(`admin_documents.php${query}`, { method: 'GET' });
  },

  async reviewDocument(documentId: number, status: string, adminNotes = ''): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_documents.php', {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, status, admin_notes: adminNotes })
    });
  },

  // Request Management
  async getRequests(status = ''): Promise<{ success: boolean; data?: AdminRequest[]; message?: string }> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return adminFetch(`admin_requests.php${query}`, { method: 'GET' });
  },

  async updateRequest(requestId: number, status: string, statusMessage = '', assignedTo = ''): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_requests.php', {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId, status, status_message: statusMessage, assigned_to: assignedTo })
    });
  },

  // Scholarship Management
  async getScholarships(): Promise<{ success: boolean; data?: { programs: AdminScholarshipProgram[]; applications: AdminScholarshipApplication[] }; message?: string }> {
    return adminFetch('admin_scholarships.php', { method: 'GET' });
  },

  async createScholarshipProgram(program: { code: string; title: string; description: string; academic_year: string; deadline: string; stipend_amount: string }): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_scholarships.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_program', ...program })
    });
  },

  async updateApplication(applicationId: number, status: string, adminNotes = ''): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_scholarships.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_application', application_id: applicationId, status, admin_notes: adminNotes })
    });
  },

  // Notifications Management (with Real Persistence)
  async getNotifications(): Promise<{ success: boolean; data?: AdminNotification[]; message?: string }> {
    return adminFetch('admin_notifications.php', { method: 'GET' });
  },

  async dispatchNotification(payload: { title: string; body: string; category: string; status_tag: string; target: string }): Promise<{ success: boolean; message: string; data?: any }> {
    return adminFetch('admin_notifications.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // AI Conversations & Escalated Concerns
  async getConcerns(status = ''): Promise<{ success: boolean; data?: AdminConcern[]; message?: string }> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return adminFetch(`admin_concerns.php${query}`, { method: 'GET' });
  },

  async getConcernDetail(ticketRef: string): Promise<{ success: boolean; data?: { concern: AdminConcern; transcript: ConcernMessage[] }; message?: string }> {
    return adminFetch(`admin_concerns.php?ticket=${encodeURIComponent(ticketRef)}`, { method: 'GET' });
  },

  async takeoverConcern(ticketRef: string): Promise<{ success: boolean; message: string; data?: any }> {
    return adminFetch('admin_concerns.php', {
      method: 'POST',
      body: JSON.stringify({ ticket_ref: ticketRef, action: 'takeover' })
    });
  },

  async sendStaffReply(ticketRef: string, message: string): Promise<{ success: boolean; message: string; data?: any }> {
    return adminFetch('admin_concerns.php', {
      method: 'POST',
      body: JSON.stringify({ ticket_ref: ticketRef, action: 'reply', message })
    });
  },

  async saveInternalNote(ticketRef: string, internalNotes: string): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_concerns.php', {
      method: 'POST',
      body: JSON.stringify({ ticket_ref: ticketRef, action: 'note', internal_notes: internalNotes })
    });
  },

  async updateConcernStatus(ticketRef: string, status: string): Promise<{ success: boolean; message: string }> {
    return adminFetch('admin_concerns.php', {
      method: 'POST',
      body: JSON.stringify({ ticket_ref: ticketRef, action: 'status', status })
    });
  }
};
