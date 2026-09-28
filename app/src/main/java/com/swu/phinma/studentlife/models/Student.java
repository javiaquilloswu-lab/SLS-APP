package com.swu.phinma.studentlife.models;

/**
 * Model representing a Southwestern University PHINMA student.
 * Prepared for future Retrofit / PHP / PostgreSQL backend integration.
 */
public class Student {
    private String id;
    private String studentNumber;
    private String firstName;
    private String middleName;
    private String lastName;
    private String email;
    private String course;
    private String yearLevel;
    private String academicStatus;
    private int requirementsProgress;
    private int verifiedDocumentsCount;
    private int totalRequiredDocuments;
    private int pendingActionsCount;

    public Student(String studentNumber, String firstName, String middleName, String lastName,
                   String email, String course, String yearLevel, String academicStatus,
                   int requirementsProgress, int verifiedDocumentsCount, int totalRequiredDocuments,
                   int pendingActionsCount) {
        this.studentNumber = studentNumber;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.email = email;
        this.course = course;
        this.yearLevel = yearLevel;
        this.academicStatus = academicStatus;
        this.requirementsProgress = requirementsProgress;
        this.verifiedDocumentsCount = verifiedDocumentsCount;
        this.totalRequiredDocuments = totalRequiredDocuments;
        this.pendingActionsCount = pendingActionsCount;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getStudentNumber() { return studentNumber; }
    public String getFirstName() { return firstName; }
    public String getMiddleName() { return middleName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getCourse() { return course; }
    public String getYearLevel() { return yearLevel; }
    public String getAcademicStatus() { return academicStatus; }
    public int getRequirementsProgress() { return requirementsProgress; }
    public int getVerifiedDocumentsCount() { return verifiedDocumentsCount; }
    public int getTotalRequiredDocuments() { return totalRequiredDocuments; }
    public int getPendingActionsCount() { return pendingActionsCount; }
}
