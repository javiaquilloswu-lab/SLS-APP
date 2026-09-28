package com.swu.phinma.studentlife.data;

import com.swu.phinma.studentlife.models.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Provides static / local demo data for the FRONTEND-FIRST phase.
 * Later, this class or repository will be hooked to Retrofit and PostgreSQL PHP endpoints
 * without requiring any layout or UI redesign.
 */
public class DemoDataProvider {

    public static Student getDemoStudent() {
        return new Student(
                "2023-00456",
                "Maria",
                "Clara",
                "Santos",
                "student@swu.edu.ph",
                "BS Computer Science",
                "3rd Year",
                "Active",
                67,
                4,
                6,
                2
        );
    }

    public static List<PendingAction> getPendingActions() {
        List<PendingAction> list = new ArrayList<>();
        list.add(new PendingAction("1", "Grade Slip (2nd Sem)", "📅 Due Aug 20, 2026", "Bursar Review", "high"));
        list.add(new PendingAction("2", "Enrollment Form", "🕒 Due Aug 25, 2026", "Registrar Signoff", "medium"));
        return list;
    }

    public static List<RecentRequest> getRecentRequests() {
        List<RecentRequest> list = new ArrayList<>();
        list.add(new RecentRequest("1", "Good Moral Certificate", "SL-2026-000121", "📅 Aug 10, 2026", "Processing", "Ready for pick-up in 2 days"));
        list.add(new RecentRequest("2", "Student Concern", "SL-2026-000072", "📅 Jul 28, 2026", "Completed", "Resolved by Dean's Office"));
        return list;
    }

    public static List<ScholarshipRequirement> getScholarshipRequirements() {
        List<ScholarshipRequirement> list = new ArrayList<>();
        list.add(new ScholarshipRequirement("1", "Certificate of Grades (COG)", "2nd Sem • 1.35 GWA verified", "VERIFIED"));
        list.add(new ScholarshipRequirement("2", "Certificate of Good Moral", "Issued by Office of Student Affairs", "VERIFIED"));
        list.add(new ScholarshipRequirement("3", "Enrollment Assessment Form", "Validated 21 Academic Units", "VERIFIED"));
        list.add(new ScholarshipRequirement("4", "Income Tax Return / Affidavit", "Submitted July 18 • Bursar queue", "REVIEWING"));
        list.add(new ScholarshipRequirement("5", "Barangay Indigency Certificate", "Submitted July 19 • Office validation", "REVIEWING"));
        list.add(new ScholarshipRequirement("6", "Scholarship Agreement", "Missing student signature", "UPLOAD"));
        return list;
    }

    public static List<NotificationItem> getNotifications() {
        List<NotificationItem> list = new ArrayList<>();
        list.add(new NotificationItem("1", "Scholarship Requirement Approved", "Your Grade Slip (2nd Sem) has been approved by the Student Life Office.", "2 hours ago", "Scholarship", "Verified", true));
        list.add(new NotificationItem("2", "Document Request Update", "Your Good Moral Certificate request (SL-2026-000121) is now being processed and ready for release.", "1 day ago", "Documents", "Processing", true));
        list.add(new NotificationItem("3", "Missing Scholarship Requirement", "Please submit your Grade Slip (1st Sem, AY 2025–2026) before August 20, 2026 to maintain active status.", "2 days ago", "Scholarship", "Action required", true));
        list.add(new NotificationItem("4", "Inquiry Response Received", "The Student Life Office has responded to your inquiry regarding scholarship renewal requirements.", "3 days ago", "Inquiry", "Helpdesk", false));
        list.add(new NotificationItem("5", "Student Life Announcement", "Scholarship renewal period is now open for 1st Semester. Submit requirements by August 25, 2026.", "1 week ago", "Announcement", "Official Notice", false));
        return list;
    }

    public static List<RequestHistoryItem> getRequestHistory() {
        List<RequestHistoryItem> list = new ArrayList<>();
        list.add(new RequestHistoryItem("1", "Good Moral Certificate", "Dean of Student Affairs", "SL-2026-000121", "Aug 10, 2026", "Processing"));
        list.add(new RequestHistoryItem("2", "Scholarship — Grade Slip", "Academic Registrar", "SL-2026-000115", "Aug 8, 2026", "Under Review"));
        list.add(new RequestHistoryItem("3", "Scholarship — Enrollment Form", "Bursar & Grants Office", "SL-2026-000098", "Aug 5, 2026", "Approved"));
        list.add(new RequestHistoryItem("4", "Academic Advising Consultation", "Guidance & Counseling", "SL-2026-000087", "Jul 30, 2026", "Completed"));
        list.add(new RequestHistoryItem("5", "Certificate of Completion (COC)", "University Registrar", "SL-2026-000065", "Jul 20, 2026", "Completed"));
        list.add(new RequestHistoryItem("6", "Lost ID Replacement", "Campus Security & Records", "SL-2026-000042", "Jul 10, 2026", "Rejected"));
        return list;
    }
}
