/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  FileText,
  MessageSquare,
  CreditCard,
  Clock,
  Bell,
  User,
  Search,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Paperclip,
  Send,
  Eye,
  EyeOff,
  Lock,
  Info,
  Smartphone,
  Code2,
  Copy,
  Check,
  Building2,
  HelpCircle,
  FileCheck,
  Database,
  Server,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { StudentLifeApi, StudentProfile, RequestItem } from '../services/api';
import { BackendStatusModal } from './BackendStatusModal';
import { getApiBaseUrl } from '../config/api';

// Screen types matching visual references
type Screen =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'services'
  | 'scholarship_overview'
  | 'scholarship_apply'
  | 'document_requests'
  | 'student_concern'
  | 'notifications'
  | 'request_history';

export function StudentSimulator({ onBackToAdmin }: { onBackToAdmin?: () => void }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [viewMode, setViewMode] = useState<'simulator' | 'code' | 'split'>('simulator');
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>('activity_dashboard.xml');
  const [copied, setCopied] = useState(false);

  // Backend Integration State
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);

  // Authenticated Student Profile (Persisted in state)
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>({
    student_id: '2024-08912',
    first_name: 'Maria',
    middle_name: 'Clara',
    last_name: 'Santos',
    email: 'student@swu.edu.ph',
    course: 'BS Computer Science',
    year_level: '3rd Year',
    academic_status: 'Active',
    requirements_progress: 67,
    verified_docs_count: 4,
    total_docs_count: 6,
    pending_actions_count: 2
  });

  // Login form state
  const [loginId, setLoginId] = useState('2024-08912');
  const [loginPassword, setLoginPassword] = useState('student123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up form state
  const [signUpForm, setSignUpForm] = useState({
    firstName: 'Maria',
    middleName: 'Clara',
    lastName: 'Santos',
    studentId: '2024-08912',
    email: 'student@swu.edu.ph',
    password: 'student123password',
    agreed: true
  });
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Shared state for interactive simulation
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'scholarship' | 'requests'>('home');
  const [showPassword, setShowPassword] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; model?: string }>>([
    {
      sender: 'bot',
      text: 'Hello Maria! 👋 Welcome to the Student Life Support Assistant. How can we help you today with academic appeals, scholarship inquiries, or student services?',
      time: '10:40 AM'
    },
    {
      sender: 'user',
      text: 'I need to file an urgent appeal regarding my mid-year scholarship grade evaluation.',
      time: '10:42 AM'
    },
    {
      sender: 'bot',
      text: 'I understand. I can help expedite this appeal. Please confirm your concern category or choose an option below to proceed:',
      time: '10:43 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'under_review' | 'processing' | 'completed'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check PHP + PostgreSQL backend on initial load
  useEffect(() => {
    let mounted = true;
    StudentLifeApi.testConnection().then((res: any) => {
      if (mounted) {
        setBackendConnected(res.connected);
      }
    });
    return () => { mounted = false; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real Chatbot handler invoking PHP backend /chatbot.php
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatbotLoading) return;
    const userMsg = chatInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userMsg, time: nowTime }
    ]);
    setChatInput('');
    setIsChatbotLoading(true);

    try {
      const response = await StudentLifeApi.sendChatMessage(
        userMsg,
        currentStudent.student_id,
        chatMessages.map(m => ({ sender: m.sender, text: m.text }))
      );

      if (response.success && response.data) {
        const replyData = response.data;
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: replyData.reply,
            time: replyData.time || 'Just now',
            model: replyData.model_used
          }
        ]);
        showToast(`Support Ticket #${replyData.ticket_ref} logged in PostgreSQL`);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      // Fallback message if local PHP server is not yet running
      const ticketRef = 'SL-2026-' + Math.floor(100000 + Math.random() * 900000);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Thank you Maria. Your urgent appeal has been routed to the Dean of Student Affairs. Tracking ticket #${ticketRef} has been recorded.`,
          time: 'Just now'
        }
      ]);
      showToast(`Support ticket #${ticketRef} submitted`);
    } finally {
      setIsChatbotLoading(false);
    }
  };

  // Real File Upload handler invoking PHP backend /upload_document.php
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileName = file.name;
      setUploadedFiles(prev => [...prev, fileName]);
      showToast(`Uploading ${fileName} to PHP backend...`);

      try {
        const res = await StudentLifeApi.uploadDocument(file, currentStudent.student_id, 'Scholarship Document');
        if (res.success) {
          showToast(`✓ Stored in PostgreSQL: ${fileName}`);
        } else {
          showToast(res.message);
        }
      } catch (err: any) {
        showToast(`Uploaded locally: ${fileName} (Start XAMPP for PostgreSQL storage)`);
      }
    }
  };

  // Real Login submission invoking PHP backend /login.php
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await StudentLifeApi.login(loginId, loginPassword);
      if (res.success && res.data) {
        setCurrentStudent(res.data.student);
        showToast(`✓ Welcome back, ${res.data.student.first_name}!`);
        setCurrentScreen('dashboard');
        setActiveTab('home');
      } else {
        setLoginError(res.message || 'Authentication failed');
      }
    } catch (err: any) {
      // Local fallback for smooth demonstration if Apache is offline
      showToast(`Signed in as demo student (PHP offline)`);
      setCurrentScreen('dashboard');
      setActiveTab('home');
    } finally {
      setLoginLoading(false);
    }
  };

  // Real Sign Up submission invoking PHP backend /register.php
  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signUpForm.agreed) {
      showToast('Please agree to terms');
      return;
    }
    setSignUpLoading(true);
    setSignUpError(null);

    try {
      const res = await StudentLifeApi.register({
        first_name: signUpForm.firstName,
        middle_name: signUpForm.middleName,
        last_name: signUpForm.lastName,
        email: signUpForm.email,
        student_id: signUpForm.studentId,
        password: signUpForm.password
      });

      if (res.success) {
        setCurrentStudent({
          student_id: signUpForm.studentId,
          first_name: signUpForm.firstName,
          middle_name: signUpForm.middleName,
          last_name: signUpForm.lastName,
          email: signUpForm.email,
          course: 'BS Computer Science',
          year_level: '1st Year',
          academic_status: 'Active',
          requirements_progress: 10,
          verified_docs_count: 0,
          total_docs_count: 6,
          pending_actions_count: 2
        });
        showToast(`✓ Account created in PostgreSQL! Welcome, ${signUpForm.firstName}!`);
        setCurrentScreen('dashboard');
        setActiveTab('home');
      } else {
        setSignUpError(res.message);
      }
    } catch (err: any) {
      showToast(`Account registered locally (PHP offline)`);
      setCurrentScreen('dashboard');
      setActiveTab('home');
    } finally {
      setSignUpLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Nav item switch handler
  const handleNavClick = (tab: 'home' | 'services' | 'scholarship' | 'requests') => {
    setActiveTab(tab);
    if (tab === 'home') setCurrentScreen('dashboard');
    else if (tab === 'services') setCurrentScreen('services');
    else if (tab === 'scholarship') setCurrentScreen('scholarship_overview');
    else if (tab === 'requests') setCurrentScreen('request_history');
  };

  // Android Studio Native Code Files content map for inspect tab
  const nativeFiles: Record<string, { lang: string; path: string; code: string }> = {
    'activity_dashboard.xml': {
      lang: 'xml',
      path: 'app/src/main/res/layout/fragment_dashboard.xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<androidx.core.widget.NestedScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/app_background"
    android:paddingBottom="@dimen/content_bottom_padding_for_nav">

    <!-- Header: Student Life | SWU PHINMA -->
    <LinearLayout ...>
        <TextView android:id="@+id/tvHeaderBrand" android:text="@string/app_name" />
        <TextView android:id="@+id/badgeUniversity" android:text="SWU PHINMA" />
        <!-- Notification Bell Badge: 3 unread -->
        <FrameLayout android:id="@+id/btnNotifications" ... />
    </LinearLayout>

    <!-- Student Greeting & Academic Status Card -->
    <TextView android:id="@+id/tvStudentName" android:text="Maria Santos" />
    <com.google.android.material.card.MaterialCardView android:id="@+id/cardAcademicStatus" ...>
        <ProgressBar android:id="@+id/progressRequirements" android:progress="67" />
        <TextView android:id="@+id/tvVerifiedDocuments" android:text="4 of 6 verified documents" />
    </com.google.android.material.card.MaterialCardView>

    <!-- Quick Services (Scholarship, Documents, Concerns, Lost ID, History) -->
    <!-- Recent Requests RecyclerView -->
    <!-- Guidance Counselor Banner -->
</androidx.core.widget.NestedScrollView>`
    },
    'LandingActivity.java': {
      lang: 'java',
      path: 'app/src/main/java/com/swu/phinma/studentlife/LandingActivity.java',
      code: `package com.swu.phinma.studentlife;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class LandingActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_landing);

        findViewById(R.id.btnSignIn).setOnClickListener(v -> 
            startActivity(new Intent(this, LoginActivity.class)));

        findViewById(R.id.btnSignUp).setOnClickListener(v -> 
            startActivity(new Intent(this, SignUpActivity.class)));
    }
}`
    },
    'DemoDataProvider.java': {
      lang: 'java',
      path: 'app/src/main/java/com/swu/phinma/studentlife/data/DemoDataProvider.java',
      code: `package com.swu.phinma.studentlife.data;

import com.swu.phinma.studentlife.models.*;

public class DemoDataProvider {
    public static Student getDemoStudent() {
        return new Student(
            "2023-00456", "Maria", "Clara", "Santos",
            "student@swu.edu.ph", "BS Computer Science", "3rd Year",
            "Active", 67, 4, 6, 2
        );
    }
}`
    },
    'colors.xml': {
      lang: 'xml',
      path: 'app/src/main/res/values/colors.xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary_maroon">#5B0E1B</color>
    <color name="secondary_ruby">#E11D48</color>
    <color name="status_green_bg">#ECFDF5</color>
    <color name="status_green_text">#047857</color>
    <color name="app_background">#FAF8FF</color>
    <color name="card_surface">#FFFFFF</color>
    <color name="text_primary">#0F172A</color>
    <color name="text_secondary">#64748B</color>
</resources>`
    },
    'view_floating_bottom_nav.xml': {
      lang: 'xml',
      path: 'app/src/main/res/layout/view_floating_bottom_nav.xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="64dp"
    android:layout_margin="16dp"
    android:background="@drawable/bg_floating_bottom_nav"
    android:elevation="8dp">
    <!-- Home | Services | Scholarship | Requests -->
</LinearLayout>`
    },
    'db.php': {
      lang: 'php',
      path: 'android_api/db.php',
      code: `<?php
// PostgreSQL PDO Connection via .env
$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_NAME') ?: 'android_studio_db';
$user = getenv('DB_USER') ?: 'postgres';
$pass = getenv('DB_PASSWORD') ?: 'root';

$dsn = "pgsql:host={$host};port={$port};dbname={$db};options='--client_encoding=UTF8'";
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
]);`
    },
    'login.php': {
      lang: 'php',
      path: 'android_api/login.php',
      code: `<?php
// Authenticate existing account using password_verify()
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

$stmt = $pdo->prepare('SELECT * FROM students WHERE email = ? OR student_id = ? LIMIT 1');
$stmt->execute([$identifier, $identifier]);
$student = $stmt->fetch();

if ($student && password_verify($password, $student['password'])) {
    unset($student['password']); // Never return password
    jsonResponse(true, 'Login successful', ['student' => $student]);
} else {
    jsonResponse(false, 'Invalid credentials', null, 401);
}`
    },
    'register.php': {
      lang: 'php',
      path: 'android_api/register.php',
      code: `<?php
// Insert new student with password_hash()
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare(
    'INSERT INTO students (first_name, middle_name, last_name, email, student_id, password)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$first_name, $middle_name, $last_name, $email, $student_id, $hashed]);
jsonResponse(true, 'Student registered successfully');`
    },
    'upload_document.php': {
      lang: 'php',
      path: 'android_api/upload_document.php',
      code: `<?php
// Multipart file upload with PDF/JPG/PNG validation & PostgreSQL logging
$allowed = ['application/pdf', 'image/jpeg', 'image/png'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($_FILES['document']['tmp_name']);

$target = __DIR__ . '/uploads/' . bin2hex(random_bytes(16)) . '.' . $ext;
move_uploaded_file($_FILES['document']['tmp_name'], $target);

$stmt = $pdo->prepare('INSERT INTO student_documents (...) VALUES (...)');`
    },
    'chatbot.php': {
      lang: 'php',
      path: 'android_api/chatbot.php',
      code: `<?php
// Server-side AI endpoint calling Gemini API using server .env key
$apiKey = getenv('GEMINI_API_KEY');
// Sends prompt to Google Generative Language REST API via PHP cURL
// Returns SWU Student Life counseling responses & ticket tracking`
    },
    'schema.sql': {
      lang: 'sql',
      path: 'android_api/schema.sql',
      code: `-- Authoritative PostgreSQL Schema
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE student_documents (...);
CREATE TABLE student_requests (...);
CREATE TABLE scholarship_requirements (...);`
    },
    'ApiClient.java': {
      lang: 'java',
      path: 'app/src/main/java/com/swu/phinma/studentlife/api/ApiClient.java',
      code: `package com.swu.phinma.studentlife.api;

public class ApiClient {
    // Configurable endpoint for Android Emulator or Physical LAN IP
    public static final String DEFAULT_BASE_URL = "http://10.0.2.2/android_api/";
    
    public static void postJson(Context ctx, String endpoint, String json, ApiCallback cb) {
        // Asynchronous HttpURLConnection / Retrofit call to PHP PostgreSQL API
    }
}`
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Studio Control Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B0E1B] text-white font-bold text-xs shadow-inner">
            SWU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">STUDENT LIFE</span>
              <span className="rounded bg-rose-950/80 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-800/40">
                PHINMA Native Android
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Southwestern University · Java &amp; Android XML</div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800 p-1 border border-slate-700/60">
          <button
            onClick={() => setViewMode('simulator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'simulator' ? 'bg-[#5B0E1B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Device Simulator
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'split' ? 'bg-[#5B0E1B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'code' ? 'bg-[#5B0E1B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Android XML / Java
          </button>
        </div>

        {/* Screen Quick Launcher Dropdown & Backend Status */}
        <div className="flex items-center gap-2">
          {/* PHP Backend Status Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
              backendConnected
                ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Configure PHP + PostgreSQL backend connection"
          >
            <div className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  backendConnected ? 'animate-ping bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  backendConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </div>
            <Database className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-[11px] font-mono">
              {backendConnected ? 'PostgreSQL Active' : 'PHP API'}
            </span>
          </button>

          <label className="text-xs text-slate-400 hidden sm:inline">Screen:</label>
          <select
            value={currentScreen}
            onChange={e => {
              const scr = e.target.value as Screen;
              setCurrentScreen(scr);
              if (scr === 'dashboard') setActiveTab('home');
              else if (scr === 'services') setActiveTab('services');
              else if (scr === 'scholarship_overview' || scr === 'scholarship_apply') setActiveTab('scholarship');
              else if (scr === 'request_history' || scr === 'document_requests') setActiveTab('requests');
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-[#5B0E1B] focus:outline-none"
          >
            <option value="landing">1. Welcome / Auth (Landing)</option>
            <option value="login">2. Sign In (Welcome back)</option>
            <option value="signup">3. Create Account (Sign Up)</option>
            <option value="dashboard">4. Student Dashboard</option>
            <option value="services">5. Services Directory</option>
            <option value="scholarship_overview">6. Scholarship Overview</option>
            <option value="scholarship_apply">7. Scholarship Application</option>
            <option value="document_requests">8. Document Requests</option>
            <option value="student_concern">9. Student Support Assistant</option>
            <option value="notifications">10. Notifications Center</option>
            <option value="request_history">11. Request History</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-full w-full pt-14">
        {/* Android Device Simulator View */}
        {(viewMode === 'simulator' || viewMode === 'split') && (
          <div
            className={`flex items-center justify-center p-4 overflow-auto transition-all ${
              viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'
            }`}
          >
            {/* Phone Bezel */}
            <div className="relative mx-auto h-[780px] w-[375px] shrink-0 rounded-[44px] border-[10px] border-slate-800 bg-[#FAF8FF] shadow-2xl ring-1 ring-slate-700 overflow-hidden flex flex-col font-sans">
              {/* Phone Speaker Notch */}
              <div className="absolute top-0 left-1/2 z-40 -translate-x-1/2 h-5 w-36 rounded-b-2xl bg-slate-800 flex items-center justify-center">
                <div className="h-1 w-10 rounded-full bg-slate-700"></div>
                <div className="ml-2 h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
              </div>

              {/* Status Bar */}
              <div className={`flex h-9 items-center justify-between px-6 pt-1 text-[11px] font-semibold shrink-0 z-30 ${
                currentScreen === 'landing' ? 'text-white/80' : 'text-slate-800'
              }`}>
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="h-2.5 w-4 rounded-sm border border-current p-0.5">
                    <div className="h-full w-full bg-current rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* Screen Body with custom scroll */}
              <div className="relative flex-1 overflow-y-auto no-scrollbar pb-20">
                {/* 1. LANDING SCREEN */}
                {currentScreen === 'landing' && (
                  <div className="flex min-h-full flex-col justify-between bg-gradient-to-b from-[#4A0713] via-[#5B0E1B] to-[#400610] p-6 text-center text-white">
                    {/* Top Pill */}
                    <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-wider">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>SOUTHWESTERN UNIVERSITY PHINMA</span>
                      <Info className="h-3 w-3 text-white/70" />
                    </div>

                    {/* Logo & Headline */}
                    <div className="my-auto py-8">
                      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-inner">
                        <Building2 className="h-10 w-10 text-white" />
                        <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#E11D48] text-white shadow">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <h1 className="text-3xl font-extrabold tracking-tight">Student Life .</h1>
                      <p className="mx-auto mt-3 max-w-[240px] text-sm text-rose-100/80 leading-relaxed">
                        Your centralized hub for student life services.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pb-6">
                      <button
                        onClick={() => setCurrentScreen('login')}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-bold text-[#5B0E1B] shadow-md transition-transform active:scale-[0.98]"
                      >
                        Sign In <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentScreen('signup')}
                        className="w-full rounded-full bg-white/15 border border-white/20 py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] hover:bg-white/20"
                      >
                        Sign Up
                      </button>
                      <div className="pt-4 text-[10px] font-bold uppercase tracking-widest text-white/50">
                        © 2026 STUDENT LIFE OFFICE
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LOGIN SCREEN */}
                {currentScreen === 'login' && (
                  <div className="p-5 text-slate-900">
                    <div className="mx-auto mt-4 mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-100 shadow-sm relative">
                      <GraduationCap className="h-8 w-8 text-[#5B0E1B]" />
                      <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                    </div>
                    <h2 className="text-center text-2xl font-bold text-slate-900">Welcome back</h2>
                    <p className="text-center text-xs text-slate-500 mt-1">Sign in to your Student Life account</p>

                    {/* Form Card */}
                    <form onSubmit={handleLoginSubmit} className="mt-5 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                      {loginError && (
                        <div className="mb-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                          {loginError}
                        </div>
                      )}

                      <label className="text-xs font-bold text-slate-800">Student ID or Email</label>
                      <div className="mt-1.5 flex h-11 items-center rounded-xl bg-slate-100/70 px-3 border border-slate-200/80">
                        <input
                          type="text"
                          value={loginId}
                          onChange={e => setLoginId(e.target.value)}
                          placeholder="2024-08912"
                          required
                          className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                        />
                        <CreditCard className="h-4 w-4 text-slate-400" />
                      </div>

                      <label className="mt-4 block text-xs font-bold text-slate-800">Password</label>
                      <div className="mt-1.5 flex h-11 items-center rounded-xl bg-slate-100/70 px-3 border border-slate-200/80">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between text-xs">
                        <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded accent-[#5B0E1B]" />
                          Remember me
                        </label>
                        <button type="button" className="font-semibold text-[#5B0E1B] hover:underline">Forgot password?</button>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#5B0E1B] py-3 text-xs font-bold text-white shadow-md active:scale-[0.98] disabled:opacity-60"
                      >
                        {loginLoading ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Authenticating with PostgreSQL...
                          </>
                        ) : (
                          <>
                            Sign In <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-4 text-center text-xs text-slate-600">
                      Don't have an account?{' '}
                      <button onClick={() => setCurrentScreen('signup')} className="font-bold text-slate-900 hover:underline">
                        Sign up
                      </button>
                    </div>

                    {/* Demo Student Access Callout */}
                    <div className="mt-5 flex gap-3 rounded-xl bg-blue-50/80 p-3.5 border border-blue-100 text-xs">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Demo Student Access</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                            Active Term
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          Pre-filled with test credentials for Department of Computer Studies (ID: <b>2024-08912</b>).
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure University Single Sign-On
                    </div>
                  </div>
                )}

                {/* 3. SIGN UP SCREEN */}
                {currentScreen === 'signup' && (
                  <div className="p-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentScreen('landing')}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-700"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                        ● Step 1 of 2
                      </span>
                    </div>

                    <div className="mx-auto mt-3 mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B0E1B] text-white shadow-md">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                    <h2 className="text-center text-2xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-center text-xs text-slate-500 mt-1">Sign up to get started with Student Life</p>

                    <form onSubmit={handleSignUpSubmit} className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
                      {signUpError && (
                        <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                          {signUpError}
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">FIRST NAME *</label>
                        <input
                          type="text"
                          value={signUpForm.firstName}
                          onChange={e => setSignUpForm(p => ({ ...p, firstName: e.target.value }))}
                          required
                          className="mt-1 w-full rounded-xl bg-slate-100/70 px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200/80 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">MIDDLE NAME (OPTIONAL)</label>
                        <input
                          type="text"
                          value={signUpForm.middleName}
                          onChange={e => setSignUpForm(p => ({ ...p, middleName: e.target.value }))}
                          className="mt-1 w-full rounded-xl bg-slate-100/70 px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200/80 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">LAST NAME *</label>
                        <input
                          type="text"
                          value={signUpForm.lastName}
                          onChange={e => setSignUpForm(p => ({ ...p, lastName: e.target.value }))}
                          required
                          className="mt-1 w-full rounded-xl bg-slate-100/70 px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200/80 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">STUDENT ID *</label>
                        <div className="mt-1 flex items-center rounded-xl bg-slate-100/70 px-3 py-2 border border-slate-200/80">
                          <input
                            type="text"
                            value={signUpForm.studentId}
                            onChange={e => setSignUpForm(p => ({ ...p, studentId: e.target.value }))}
                            required
                            className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                          />
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">UNIVERSITY EMAIL *</label>
                        <div className="mt-1 flex items-center rounded-xl bg-slate-100/70 px-3 py-2 border border-slate-200/80">
                          <input
                            type="email"
                            value={signUpForm.email}
                            onChange={e => setSignUpForm(p => ({ ...p, email: e.target.value }))}
                            required
                            className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                          />
                          <span className="text-xs text-slate-400 font-semibold">@</span>
                        </div>
                        <p className="mt-1 text-[10px] text-rose-600 font-medium">ⓘ Must be your active institutional (.edu) address</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">PASSWORD *</label>
                        <div className="mt-1 flex items-center rounded-xl bg-slate-100/70 px-3 py-2 border border-slate-200/80">
                          <input
                            type="password"
                            value={signUpForm.password}
                            onChange={e => setSignUpForm(p => ({ ...p, password: e.target.value }))}
                            required
                            minLength={8}
                            className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none"
                          />
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700">
                          <Check className="h-3 w-3" />
                          Minimum 8 characters with letters &amp; numbers
                        </div>
                      </div>

                      <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signUpForm.agreed}
                          onChange={e => setSignUpForm(p => ({ ...p, agreed: e.target.checked }))}
                          className="mt-0.5 rounded accent-[#5B0E1B]"
                        />
                        <span>I agree to the University Student Life Terms of Service and Privacy Policy.</span>
                      </label>

                      <button
                        type="submit"
                        disabled={signUpLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5B0E1B] py-3 text-xs font-bold text-white shadow-md active:scale-[0.98] disabled:opacity-60"
                      >
                        {signUpLoading ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Registering in PostgreSQL...
                          </>
                        ) : (
                          <>
                            Sign Up <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-4 text-center text-xs text-slate-600">
                      Already have an account?{' '}
                      <button onClick={() => setCurrentScreen('login')} className="font-bold text-slate-900 hover:underline">
                        Sign In
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. DASHBOARD SCREEN */}
                {currentScreen === 'dashboard' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 tracking-tight">Student Life</span>
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#5B0E1B]">
                          SWU PHINMA
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentScreen('notifications')}
                          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-700"
                        >
                          <Bell className="h-4 w-4" />
                          {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[9px] font-bold text-white">
                              {unreadNotifications}
                            </span>
                          )}
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Greeting & Student Metadata */}
                    <div>
                      <div className="text-xs text-slate-500">Good morning 👋</div>
                      <h1 className="text-2xl font-extrabold text-slate-900">{currentStudent.first_name} {currentStudent.last_name}</h1>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                        <span>ID: {currentStudent.student_id}</span>
                        <span>•</span>
                        <span>{currentStudent.course || 'BS Computer Science'}</span>
                        <span>•</span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                          {currentStudent.year_level || '3rd Year'}
                        </span>
                      </div>
                    </div>

                    {/* Academic Status Card */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#5B0E1B]">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">Academic Status</div>
                            <div className="text-[11px] text-emerald-600 font-medium">● Semester A.Y. 2026–2027</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                          ✓ {currentStudent.academic_status || 'Active'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Requirements Submitted</span>
                        <span className="font-extrabold text-slate-900 text-sm">{currentStudent.requirements_progress ?? 67}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#5B0E1B] transition-all duration-500"
                          style={{ width: `${currentStudent.requirements_progress ?? 67}%` }}
                        ></div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {currentStudent.verified_docs_count ?? 4} of {currentStudent.total_docs_count ?? 6} verified documents
                        </span>
                        <span className="font-bold text-[#E11D48]">Renewal in 14 days</span>
                      </div>
                    </div>

                    {/* Pending Actions */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Pending Actions</span>
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">
                            2
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Immediate tasks</span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setCurrentScreen('scholarship_apply')}
                          className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#E11D48]"></div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Grade Slip (2nd Sem)</div>
                              <div className="text-[11px] text-[#E11D48] font-medium">📅 Due Aug 20, 2026 • Bursar Review</div>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>

                        <div
                          onClick={() => setCurrentScreen('scholarship_apply')}
                          className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Enrollment Form</div>
                              <div className="text-[11px] text-slate-500 font-medium">🕒 Due Aug 25, 2026 • Registrar Signoff</div>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Services */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Quick Services</span>
                        <span className="text-[11px] text-slate-500">Tap to launch</span>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-2 text-center">
                        <button
                          onClick={() => {
                            setCurrentScreen('scholarship_overview');
                            setActiveTab('scholarship');
                          }}
                          className="group flex flex-col items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-[#5B0E1B] transition-transform group-active:scale-95 shadow-xs">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800">Scholarship</span>
                        </button>
                        <button
                          onClick={() => setCurrentScreen('document_requests')}
                          className="group flex flex-col items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition-transform group-active:scale-95 shadow-xs">
                            <FileText className="h-6 w-6" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800">Documents</span>
                        </button>
                        <button
                          onClick={() => setCurrentScreen('student_concern')}
                          className="group flex flex-col items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-transform group-active:scale-95 shadow-xs">
                            <MessageSquare className="h-6 w-6" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800">Concerns</span>
                        </button>
                        <button
                          onClick={() => setCurrentScreen('document_requests')}
                          className="group flex flex-col items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 transition-transform group-active:scale-95 shadow-xs">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800">Lost ID</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentScreen('request_history');
                            setActiveTab('requests');
                          }}
                          className="group flex flex-col items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition-transform group-active:scale-95 shadow-xs">
                            <Clock className="h-6 w-6" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold text-slate-800">History</span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Requests */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Recent Requests</span>
                        <button
                          onClick={() => {
                            setCurrentScreen('request_history');
                            setActiveTab('requests');
                          }}
                          className="text-xs font-bold text-[#E11D48] hover:underline"
                        >
                          View all →
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setCurrentScreen('request_history')}
                          className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-900">Good Moral Certificate</div>
                              <div className="text-[11px] text-slate-500">SL-2026-000121</div>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                              Processing
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                            <span className="text-slate-500">📅 Aug 10, 2026</span>
                            <span className="font-bold text-slate-900">Ready for pick-up in 2 days</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setCurrentScreen('request_history')}
                          className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-900">Student Concern</div>
                              <div className="text-[11px] text-slate-500">SL-2026-000072</div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                              Completed
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                            <span className="text-slate-500">📅 Jul 28, 2026</span>
                            <span className="font-bold text-emerald-700">Resolved by Dean's Office</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Counselor Banner */}
                    <div
                      onClick={() => setCurrentScreen('student_concern')}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4A0713] to-[#681422] p-4 text-white shadow-md cursor-pointer"
                    >
                      <div className="max-w-[200px]">
                        <span className="rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                          NEED GUIDANCE?
                        </span>
                        <h4 className="mt-2 text-sm font-bold leading-snug">Connect with SWU Guidance Counselor</h4>
                        <p className="mt-1 text-[11px] text-rose-100/80">Free 1-on-1 virtual or in-campus...</p>
                      </div>
                      <div className="absolute -bottom-2 -right-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        <GraduationCap className="h-10 w-10 text-white/40" />
                      </div>
                    </div>

                    {/* Stats 3 Cards */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900">12</div>
                        <div className="text-[10px] text-slate-500">Total Requests</div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <Check className="h-4 w-4" />
                        </div>
                        <div className="mt-1 text-lg font-bold text-emerald-600">9</div>
                        <div className="text-[10px] text-slate-500">Completed</div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[#E11D48]">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="mt-1 text-lg font-bold text-[#E11D48]">3</div>
                        <div className="text-[10px] text-slate-500">Pending</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SERVICES DIRECTORY */}
                {currentScreen === 'services' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">Student Life</span>
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#5B0E1B]">
                          SWU PHINMA
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentScreen('notifications')} className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                          <Bell className="h-4 w-4 text-slate-700" />
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[9px] font-bold text-white">
                            3
                          </span>
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Hero Card */}
                    <div className="rounded-2xl bg-[#5B0E1B] p-4 text-white shadow-md">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold">
                        ● One-Stop University Hub
                      </span>
                      <h2 className="mt-2 text-xl font-extrabold">Services Directory</h2>
                      <p className="mt-1 text-xs text-rose-100/80 leading-relaxed">
                        Streamlined requests, official documents, and direct student council assistance.
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-rose-200">ACTIVE GRANTS</div>
                          <div className="text-base font-extrabold">14</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-rose-200">AVG. TURNAROUND</div>
                          <div className="text-base font-extrabold">24 hrs</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-rose-200">CAMPUS DESK</div>
                          <div className="text-base font-extrabold text-emerald-400">Online</div>
                        </div>
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="flex h-11 items-center rounded-xl bg-white px-3 shadow-xs border border-slate-200/80">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search service, document, or form..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="ml-2 w-full bg-transparent text-xs text-slate-900 outline-none"
                      />
                    </div>

                    {/* Category: Scholarship */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-[#5B0E1B]" />
                          <span className="text-sm font-bold text-slate-900">Scholarship</span>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          3 available
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setCurrentScreen('scholarship_apply')}
                          className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-[#5B0E1B]">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">Apply / Continue Scholarship</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Submit a new application or renew credentials.
                                </div>
                              </div>
                            </div>
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                              AY 2024–25
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                            <span className="text-slate-500">Deadline: Sep 15, 2024</span>
                            <span className="font-bold text-[#E11D48]">Apply Now →</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setCurrentScreen('scholarship_overview')}
                          className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-[#5B0E1B]">
                              <FileCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Scholarship Requirements</div>
                              <div className="text-[11px] text-slate-500">View, upload, and track pending evaluation documents.</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Category: Student Support */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900">Student Support</span>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          2 channels
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setCurrentScreen('student_concern')}
                          className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <HelpCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">Submit Student Concern</span>
                                <span className="text-[9px] font-bold text-emerald-600">CONFIDENTIAL</span>
                              </div>
                              <div className="text-[11px] text-slate-500">Submit academic, mental wellness, or facility grievances.</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Category: Documents & Records */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">Documents &amp; Records</span>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          3 requests
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setCurrentScreen('document_requests')}
                          className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border border-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                              <FileCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Certificate of Completion (COC)</div>
                              <div className="text-[11px] text-slate-500">Official certification verifying completed subjects.</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SCHOLARSHIP OVERVIEW & TRACKING */}
                {currentScreen === 'scholarship_overview' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold tracking-widest text-[#E11D48] uppercase">UNIVERSITY PORTAL</div>
                        <div className="text-lg font-bold text-slate-900">Student Life</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentScreen('notifications')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                          <Bell className="h-4 w-4 text-slate-700" />
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider">GRANTS &amp; AIDS</span>
                      <div className="flex items-center justify-between">
                        <h1 className="text-xl font-extrabold text-slate-900">CHED Academic Excellence</h1>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-[#5B0E1B]">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">AY 2024–2025 • Mid-Year Renewal Cycle</p>
                    </div>

                    {/* Segmented Control */}
                    <div className="grid grid-cols-3 rounded-full bg-slate-200/70 p-1 text-center text-xs font-bold text-slate-600">
                      <button className="rounded-full bg-[#5B0E1B] py-1.5 text-white shadow-xs">Overview</button>
                      <button
                        onClick={() => setCurrentScreen('scholarship_apply')}
                        className="rounded-full py-1.5 hover:text-slate-900"
                      >
                        Apply
                      </button>
                      <button className="rounded-full py-1.5 hover:text-slate-900">Disbursements</button>
                    </div>

                    {/* Compliance Card */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">● Grant Status</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                          ✓ Active Scholar
                        </span>
                      </div>
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        CHECKLIST COMPLIANCE
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-slate-900">3 of 6 Documents</span>
                        <span className="text-xl font-extrabold text-[#5B0E1B]">50%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full w-1/2 rounded-full bg-[#5B0E1B]"></div>
                      </div>
                      <div className="mt-3 text-xs font-bold text-slate-800">
                        🕒 Next critical cutoff: August 25, 2026
                      </div>
                    </div>

                    {/* 3 Metric Tiles */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
                        <div className="mt-1 text-base font-bold text-slate-900">3</div>
                        <div className="text-[10px] font-bold text-emerald-600">Approved</div>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <Clock className="mx-auto h-5 w-5 text-purple-600" />
                        <div className="mt-1 text-base font-bold text-slate-900">2</div>
                        <div className="text-[10px] font-bold text-purple-600">In Review</div>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <AlertCircle className="mx-auto h-5 w-5 text-[#E11D48]" />
                        <div className="mt-1 text-base font-bold text-slate-900">1</div>
                        <div className="text-[10px] font-bold text-[#E11D48]">Required</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => showToast('Downloading Guidelines PDF')}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Guidelines
                      </button>
                      <button
                        onClick={() => setCurrentScreen('scholarship_apply')}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#5B0E1B] py-2.5 text-xs font-bold text-white shadow-sm"
                      >
                        <Upload className="h-3.5 w-3.5" /> Submit Files
                      </button>
                    </div>

                    {/* Required Documents List */}
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Required Documents</span>
                        <span className="text-[#E11D48] font-bold">Step 2 of 4</span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">Certificate of Grades (COG)</div>
                              <div className="text-[10px] text-slate-500">2nd Sem • 1.35 GWA verified</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ✓ Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">Certificate of Good Moral</div>
                              <div className="text-[10px] text-slate-500">Issued by Office of Student Affairs</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ✓ Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">Income Tax Return / Affidavit</div>
                              <div className="text-[10px] text-slate-500">Submitted July 18 • Bursar queue</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            🔄 Reviewing
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-5 w-5 text-rose-600" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">Scholarship Agreement</div>
                              <div className="text-[10px] text-rose-600 font-medium">Missing student signature</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setCurrentScreen('scholarship_apply')}
                            className="rounded-full bg-[#E11D48] px-3 py-1 text-[10px] font-bold text-white shadow-xs"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stipend Timeline */}
                    <div className="flex gap-2.5 rounded-xl bg-blue-50/80 p-3 border border-blue-100 text-xs">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Stipend Release Timeline</span>
                        <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                          Once all 6 documents are validated, your semestral allowance (₱30,000.00) will be credited directly to your registered Landbank / Maya account within 5 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. SCHOLARSHIP APPLICATION SCREEN */}
                {currentScreen === 'scholarship_apply' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentScreen('scholarship_overview')}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200"
                      >
                        <ArrowLeft className="h-4 w-4 text-slate-700" />
                      </button>
                      <h2 className="text-sm font-bold text-slate-900">Scholarship Applica...</h2>
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">
                        AY 2024–2025
                      </span>
                    </div>

                    {/* Segmented Control */}
                    <div className="grid grid-cols-3 rounded-full bg-slate-200/70 p-1 text-center text-xs font-bold text-slate-600">
                      <button onClick={() => setCurrentScreen('scholarship_overview')} className="rounded-full py-1.5 hover:text-slate-900">Overview</button>
                      <button className="rounded-full bg-[#5B0E1B] py-1.5 text-white shadow-xs">Apply</button>
                      <button onClick={() => setCurrentScreen('scholarship_overview')} className="rounded-full py-1.5 hover:text-slate-900">Requirements</button>
                    </div>

                    {/* Step 2 Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Step 2 of 2: Submission</span>
                        <span>85% Completed</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full w-[85%] rounded-full bg-[#5B0E1B]"></div>
                      </div>
                    </div>

                    {/* Form Controls */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span>Scholarship Program *</span>
                          <span className="text-slate-400 font-normal">CHED Verified</span>
                        </div>
                        <select className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 shadow-xs outline-none">
                          <option>CHED Full Merit Scholarship Award (CMSP)</option>
                          <option>SWU Presidential Grant</option>
                          <option>Alumni Excellence Foundation</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-800">Application Type *</label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-[#5B0E1B] py-2 text-xs font-bold text-white shadow-xs">
                            + New Application
                          </button>
                          <button className="rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-xs">
                            Continuing
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-800">Semester / Term *</label>
                        <div className="mt-1 flex items-center rounded-xl bg-white px-3 py-2 border border-slate-200 shadow-xs text-xs font-medium text-slate-900">
                          <span className="flex-1">1st Semester, A.Y. 2024–2025</span>
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Verified Student Record Card */}
                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700">✓ VERIFIED STUDENT RECORD</span>
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-[#E11D48]">Auto-filled</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Student ID</div>
                          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900">
                            <span>2023-00456</span>
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Full Name</div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900">
                            Maria Santos
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">Degree &amp; Academic Level</div>
                          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900">
                            <span>BS Computer Science — 3rd Year</span>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">Regular</span>
                          </div>
                        </div>
                      </div>

                      {/* File Upload Dropzone */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span>Supporting Documents *</span>
                          <span className="text-slate-400 font-normal">COG / ITR / Valid ID</span>
                        </div>
                        <label className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-4 text-center cursor-pointer hover:bg-rose-50/60 transition-colors">
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-[#5B0E1B]">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="mt-2 text-xs font-bold text-slate-900">Drop files here or browse</span>
                          <span className="mt-0.5 text-[10px] text-slate-500">Supports PDF, JPG, PNG (Max 100MB per document)</span>
                          {uploadedFiles.length > 0 && (
                            <div className="mt-2 text-[10px] font-semibold text-emerald-700">
                              Uploaded {uploadedFiles.length} file(s): {uploadedFiles.join(', ')}
                            </div>
                          )}
                        </label>
                      </div>

                      <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded accent-[#5B0E1B]" />
                        <span>I hereby certify that all statements made are true and correct to the best of my knowledge under SWU PHINMA academic policies.</span>
                      </label>

                      <button
                        onClick={() => {
                          showToast('Application submitted! Tracking ref: SL-2026-000142');
                          setCurrentScreen('request_history');
                          setActiveTab('requests');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5B0E1B] py-3 text-xs font-bold text-white shadow-md active:scale-[0.98]"
                      >
                        Submit Application <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. DOCUMENT REQUESTS */}
                {currentScreen === 'document_requests' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-[#E11D48] tracking-widest uppercase">PORTAL</div>
                        <div className="text-lg font-bold text-slate-900">Student Life</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentScreen('notifications')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-slate-100">
                          <Bell className="h-4 w-4 text-slate-700" />
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentScreen('services')}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200"
                      >
                        <ArrowLeft className="h-4 w-4 text-slate-700" />
                      </button>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#E11D48] border border-rose-100">
                        REGISTRAR OFFICE
                      </span>
                    </div>

                    <div>
                      <h1 className="text-2xl font-extrabold text-slate-900">Document Requests</h1>
                      <p className="text-xs text-slate-500 mt-1">Request official university documents and certifications online.</p>
                    </div>

                    {/* Banner Card */}
                    <div className="flex gap-3 rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100 text-xs">
                      <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Digital &amp; Physical Pick-up</div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          Approved credentials include cryptographic QR verification or direct registrar counter pickup.
                        </p>
                      </div>
                    </div>

                    {/* Available Certifications */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>AVAILABLE CERTIFICATIONS</span>
                        <span className="text-slate-400 normal-case font-medium">3 Services</span>
                      </div>

                      <div className="mt-2 space-y-3">
                        {/* COC Card */}
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-[#5B0E1B]">
                              <FileCheck className="h-5 w-5" />
                            </div>
                            <div className="flex gap-1.5 text-[10px] font-bold">
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">Free / Digital</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">2-3 Business Days</span>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900">Certificate of Completion (COC)</div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Official certification verifying completed subjects, units, or academic program graduation requirements.
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 font-medium">✓ Registrar Sealed</span>
                            <button
                              onClick={() => showToast('COC request submitted')}
                              className="rounded-full bg-[#5B0E1B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                            >
                              Request Now →
                            </button>
                          </div>
                        </div>

                        {/* Good Moral Card */}
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-[#5B0E1B]">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="flex gap-1.5 text-[10px] font-bold">
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">Clearance</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">1-2 Business Days</span>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900">Good Moral Certificate</div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Stamped conduct clearance certificate for scholarship qualification, internship endorsement, or employment.
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 font-medium">🎖️ Dean of Student Affairs</span>
                            <button
                              onClick={() => showToast('Good Moral request submitted')}
                              className="rounded-full bg-[#5B0E1B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                            >
                              Request Now →
                            </button>
                          </div>
                        </div>

                        {/* Lost ID Card */}
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div className="flex gap-1.5 text-[10px] font-bold">
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[#E11D48]">₱150</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">3-5 Days</span>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900">Lost ID Replacement</div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            File an affidavit of loss and request a reprint of your high-frequency NFC student RFID smart card.
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 font-medium">💳 Turnstile NFC Active</span>
                            <button
                              onClick={() => showToast('ID replacement request submitted')}
                              className="rounded-full bg-[#5B0E1B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                            >
                              Request Now →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">RECENT ACTIVITY</span>
                        <button onClick={() => setCurrentScreen('request_history')} className="font-bold text-[#E11D48]">
                          View History
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-5 w-5 text-rose-600" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">Official Transcript (TOR)</div>
                            <div className="text-[10px] text-slate-500">Filed Sep 24 • In Assessment</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          Processing
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. STUDENT SUPPORT CHATBOT */}
                {currentScreen === 'student_concern' && (
                  <div className="flex flex-col h-full bg-[#FAF8FF]">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-100 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setCurrentScreen('dashboard')}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            Student Support Assistant
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          </div>
                          <div className="text-[10px] text-slate-500">SWU PHINMA Guidance &amp; Support</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-[#E11D48] border border-rose-100">
                        GUIDANCE &amp; SUPPORT
                      </span>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                      <div className="mx-auto inline-block rounded-full bg-slate-200/70 px-3 py-1 text-[10px] font-bold text-slate-600">
                        Today, Dean of Student Affairs Desk
                      </div>

                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.sender === 'bot' && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-[#5B0E1B] text-white rounded-br-none'
                                : 'bg-white text-slate-900 shadow-xs border border-slate-100 rounded-bl-none'
                            }`}
                          >
                            {msg.text}
                            <div className="mt-1 flex items-center justify-between gap-2">
                              {msg.model && (
                                <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold text-rose-700">
                                  {msg.model}
                                </span>
                              )}
                              <div
                                className={`text-right text-[9px] ${
                                  msg.sender === 'user' ? 'text-rose-200' : 'text-slate-400'
                                }`}
                              >
                                {msg.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {isChatbotLoading && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 shadow-xs border border-slate-100 flex items-center gap-1.5">
                            <RefreshCw className="h-3 w-3 animate-spin text-[#5B0E1B]" />
                            <span className="text-[11px]">Connecting to PHP Student Affairs Assistant...</span>
                          </div>
                        </div>
                      )}

                      {/* Confidentiality Callout inside chat */}
                      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/80 p-3 border border-blue-100 text-[11px] text-slate-700">
                        <ShieldCheck className="h-4 w-4 text-[#5B0E1B] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900">Strictly Confidential</span>
                          <p className="mt-0.5 text-slate-600 leading-tight">
                            Your submission is strictly confidential and reviewed directly by credentialed Student Life coordinators and the Dean's Office.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => setChatInput('I need to file an academic appeal.')}
                        className="rounded-full bg-[#5B0E1B] px-3 py-1 text-[11px] font-bold text-white shrink-0 shadow-xs"
                      >
                        📋 Academic Appeal
                      </button>
                      <button
                        onClick={() => setChatInput('I have a question about campus facilities.')}
                        className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 shrink-0"
                      >
                        ❓ Campus Inquiry
                      </button>
                      <button
                        onClick={() => setChatInput('This is a high-priority financial grievance.')}
                        className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold text-[#E11D48] shrink-0"
                      >
                        ⚡ High Priority
                      </button>
                    </div>

                    {/* Input Bar */}
                    <div className="bg-white p-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer text-slate-400 hover:text-slate-600">
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                          <Paperclip className="h-5 w-5" />
                        </label>
                        <input
                          type="text"
                          placeholder="Describe your concern..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-900 outline-none"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white shadow-xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 text-center text-[10px] text-slate-400">
                        🔒 Strictly Confidential. Submissions are encrypted.
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. NOTIFICATIONS CENTER */}
                {currentScreen === 'notifications' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentScreen('dashboard')}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200"
                      >
                        <ArrowLeft className="h-4 w-4 text-slate-700" />
                      </button>
                      <h2 className="text-sm font-bold text-slate-900">Notifications Center</h2>
                      <div className="flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-slate-700" />
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Inbox</h1>
                        {unreadNotifications > 0 && (
                          <span className="rounded-full bg-[#5B0E1B] px-2 py-0.5 text-xs font-bold text-white">
                            {unreadNotifications} unread
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setUnreadNotifications(0);
                          showToast('All notifications marked as read');
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      >
                        ✓ Mark all read
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button className="rounded-full bg-[#5B0E1B] px-4 py-1.5 text-xs font-bold text-white shadow-xs">
                        All
                      </button>
                      <button className="rounded-full bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700">
                        Unread ({unreadNotifications})
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-2.5">
                      <div
                        onClick={() => showToast('Opening scholarship status')}
                        className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">Scholarship Requirement Approved</h4>
                            {unreadNotifications > 0 && <span className="h-2 w-2 rounded-full bg-[#E11D48]"></span>}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                            Your Grade Slip (2nd Sem) has been approved by the Student Life Office.
                          </p>
                          <div className="mt-1.5 text-[10px] font-bold text-emerald-600">2 hours ago • Verified</div>
                        </div>
                      </div>

                      <div
                        onClick={() => showToast('Opening document status')}
                        className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">Document Request Update</h4>
                            {unreadNotifications > 1 && <span className="h-2 w-2 rounded-full bg-[#E11D48]"></span>}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                            Your Good Moral Certificate request (SL-2026-000121) is now being processed and ready for release.
                          </p>
                          <div className="mt-1.5 text-[10px] font-bold text-[#E11D48]">1 day ago • Processing</div>
                        </div>
                      </div>

                      <div
                        onClick={() => showToast('Opening requirement upload')}
                        className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E11D48]">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">Missing Scholarship Requirement</h4>
                            {unreadNotifications > 2 && <span className="h-2 w-2 rounded-full bg-[#E11D48]"></span>}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                            Please submit your Grade Slip (1st Sem, AY 2025–2026) before August 20, 2026 to maintain active status.
                          </p>
                          <div className="mt-1.5 text-[10px] font-bold text-[#E11D48]">2 days ago • Action required</div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900">Inquiry Response Received</h4>
                          <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                            The Student Life Office has responded to your inquiry regarding scholarship renewal requirements.
                          </p>
                          <div className="mt-1.5 text-[10px] text-slate-400">3 days ago • Helpdesk</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. REQUEST HISTORY */}
                {currentScreen === 'request_history' && (
                  <div className="p-4 text-slate-900 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-[#E11D48] tracking-widest uppercase">PORTAL</div>
                        <div className="text-lg font-bold text-slate-900">Student Life</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentScreen('notifications')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-slate-100">
                          <Bell className="h-4 w-4 text-slate-700" />
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B0E1B] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Request History</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Track all your submitted documents and inquiries.</p>
                      </div>
                      <button
                        onClick={() => showToast('Exporting report (PDF)')}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500">Active</span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-slate-900">2</span>
                          <span className="text-[10px] font-bold text-emerald-600">in flight</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500">Completed</span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-slate-900">3</span>
                          <span className="text-[10px] text-slate-400">verified</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500">Needs Action</span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-[#E11D48]">1</span>
                          <span className="text-[10px] font-bold text-[#E11D48]">review</span>
                        </div>
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="flex h-10 items-center rounded-xl bg-white px-3 shadow-xs border border-slate-200">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by reference number or document..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="ml-2 w-full bg-transparent text-xs text-slate-900 outline-none"
                      />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto text-xs">
                      <button
                        onClick={() => setHistoryFilter('all')}
                        className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors shrink-0 ${
                          historyFilter === 'all'
                            ? 'bg-[#5B0E1B] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHistoryFilter('under_review')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-colors shrink-0 ${
                          historyFilter === 'under_review'
                            ? 'bg-[#5B0E1B] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        Under Review
                      </button>
                      <button
                        onClick={() => setHistoryFilter('processing')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-colors shrink-0 ${
                          historyFilter === 'processing'
                            ? 'bg-[#5B0E1B] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        Processing
                      </button>
                      <button
                        onClick={() => setHistoryFilter('completed')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-colors shrink-0 ${
                          historyFilter === 'completed'
                            ? 'bg-[#5B0E1B] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        Approved / Completed
                      </button>
                    </div>

                    {/* Request Cards List */}
                    <div className="space-y-2.5">
                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#5B0E1B]">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Good Moral Certificate</div>
                              <div className="text-[10px] text-slate-500">Dean of Student Affairs</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            ● Processing
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <div>
                            <div className="text-slate-500">Ref: SL-2026-000121</div>
                            <div className="text-slate-400 text-[10px]">Submitted Aug 10, 2026</div>
                          </div>
                          <button
                            onClick={() => showToast('Details for SL-2026-000121')}
                            className="font-bold text-[#E11D48]"
                          >
                            View Details ›
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Scholarship — Grade Slip</div>
                              <div className="text-[10px] text-slate-500">Academic Registrar</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            ● Under Review
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <div>
                            <div className="text-slate-500">Ref: SL-2026-000115</div>
                            <div className="text-slate-400 text-[10px]">Submitted Aug 8, 2026</div>
                          </div>
                          <button
                            onClick={() => showToast('Details for SL-2026-000115')}
                            className="font-bold text-[#E11D48]"
                          >
                            View Details ›
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                              <FileCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Scholarship — Enrollment Form</div>
                              <div className="text-[10px] text-slate-500">Bursar &amp; Grants Office</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ● Approved
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <div>
                            <div className="text-slate-500">Ref: SL-2026-000098</div>
                            <div className="text-slate-400 text-[10px]">Submitted Aug 5, 2026</div>
                          </div>
                          <button
                            onClick={() => showToast('Details for SL-2026-000098')}
                            className="font-bold text-[#E11D48]"
                          >
                            View Details ›
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#E11D48]">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Lost ID Replacement</div>
                              <div className="text-[10px] text-slate-500">Campus Security &amp; Records</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">
                            ● Rejected
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <div>
                            <div className="text-slate-500">Ref: SL-2026-000042</div>
                            <div className="text-slate-400 text-[10px]">Submitted Jul 10, 2026</div>
                          </div>
                          <button
                            onClick={() => showToast('Details for SL-2026-000042')}
                            className="font-bold text-[#E11D48]"
                          >
                            View Details ›
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Bottom Navigation Bar (matches view_floating_bottom_nav.xml) */}
              {currentScreen !== 'landing' && currentScreen !== 'login' && currentScreen !== 'signup' && (
                <div className="absolute bottom-4 left-4 right-4 z-40">
                  <div className="flex h-14 items-center justify-around rounded-full bg-white/95 px-2 shadow-xl border border-slate-200/80 backdrop-blur-md">
                    <button
                      onClick={() => handleNavClick('home')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                        activeTab === 'home' ? 'text-[#5B0E1B]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${activeTab === 'home' ? 'bg-pink-50' : ''}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Home</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('services')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                        activeTab === 'services' ? 'text-[#5B0E1B]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${activeTab === 'services' ? 'bg-pink-50' : ''}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Services</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('scholarship')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                        activeTab === 'scholarship' ? 'text-[#5B0E1B]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${activeTab === 'scholarship' ? 'bg-pink-50' : ''}`}>
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Scholarship</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('requests')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                        activeTab === 'requests' ? 'text-[#5B0E1B]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${activeTab === 'requests' ? 'bg-pink-50' : ''}`}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Requests</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Toast Notification Notification */}
              {toastMessage && (
                <div className="absolute top-12 left-6 right-6 z-50 rounded-xl bg-slate-900/95 px-3.5 py-2 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-sm border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  {toastMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Android Studio Native Code & Architecture Inspector */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full bg-slate-900 overflow-hidden ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            {/* Inspector Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">
                  Android Studio File Explorer
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                  app/src/main/
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(nativeFiles[selectedCodeFile]?.code || '')}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied XML/Java!' : 'Copy Code'}
              </button>
            </div>

            {/* File Selector Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/60 p-2 text-xs">
              {Object.keys(nativeFiles).map(file => (
                <button
                  key={file}
                  onClick={() => setSelectedCodeFile(file)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-[11px] whitespace-nowrap transition-colors ${
                    selectedCodeFile === file
                      ? 'bg-slate-800 text-rose-300 border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            {/* Code Content Viewer */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950">
              <div className="text-[11px] text-slate-500 mb-2 font-sans">
                Location: <span className="text-slate-400">{nativeFiles[selectedCodeFile]?.path}</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto selection:bg-rose-950">
                <code>{nativeFiles[selectedCodeFile]?.code}</code>
              </pre>

              {/* Architectural notes */}
              <div className="mt-4 rounded-xl bg-slate-900/60 p-4 border border-slate-800/80 font-sans text-xs space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Frontend-First Architectural Compliance
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>
                    <b>Local Static Demo Data:</b> Handled in <code className="text-rose-300">DemoDataProvider.java</code> (Maria Santos, BS Computer Science 3rd Year, 2023-00456, 67%, 4 of 6 verified documents).
                  </li>
                  <li>
                    <b>Future Integration Ready:</b> View IDs and ViewHolders are decoupled. When Retrofit and PostgreSQL are hooked later, models plug in directly.
                  </li>
                  <li>
                    <b>Centralized Tokens:</b> Colors in <code className="text-rose-300">colors.xml</code> (#5B0E1B maroon, #E11D48 ruby, #10B981 emerald), dimensions in <code className="text-rose-300">dimens.xml</code>.
                  </li>
                  <li>
                    <b>Floating Bottom Nav:</b> Custom rounded pill floating 16dp above viewport margin with 100dp bottom scroll padding to prevent content clipping.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backend Status & Configuration Drawer Modal */}
      <BackendStatusModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConnectedChange={setBackendConnected}
      />
    </div>
  );
}
