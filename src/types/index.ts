export type Role = "SUPER_ADMIN" | "BRANCH_ADMIN" | "ACCOUNTANT" | "TEACHER" | "PARENT";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN";

export type FeeStatus = "PENDING" | "PAID" | "PARTIAL";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export type PaymentMethod = "CASH" | "BANK" | "ONLINE";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  createdAt: string;
  _count?: { students: number };
  studentCount?: number;
}

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: Role;
  branchId: string | null;
  isActive?: boolean;
  createdAt: string;
  branch?: Pick<Branch, "id" | "name" | "code"> | null;
}

export interface Student {
  id: string;
  branchId: string;
  rollNumber: string;
  fullName: string;
  guardianPhone?: string | null;
  classSection: string;
  status: StudentStatus;
}

export interface FeePayment {
  id: string;
  challanId: string;
  amount: string | number;
  method: PaymentMethod;
  note?: string | null;
  recordedById: string;
  createdAt: string;
  recordedBy?: { id: string; email: string };
}

export interface FeeChallan {
  id: string;
  branchId: string;
  studentId: string;
  month: number;
  year: number;
  amount: string | number;
  paidAmount?: string | number;
  remainingBalance?: number;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
  student?: Pick<Student, "id" | "fullName" | "rollNumber" | "classSection">;
  payments?: FeePayment[];
}

export interface StudentProfile extends Student {
  feeChallans?: FeeChallan[];
  attendance?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  branchId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedById: string;
  student?: Pick<Student, "id" | "fullName" | "rollNumber" | "classSection">;
  markedBy?: { id: string; email: string };
}

export interface Expense {
  id: string;
  branchId: string;
  category: string;
  title: string;
  amount: string | number;
  receiptUrl?: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; email: string; role: Role };
}

export interface FeeReportMonth {
  month: number;
  year: number;
  challanCount: number;
  invoicedAmount: number;
  totalCollected: number;
  totalPending?: number;
  outstandingBalance: number;
}

export interface FeeReportBranch {
  branchId: string;
  totalCollected: number;
  totalPending: number;
  outstandingBalance: number;
  invoicedAmount: number;
}

export interface FeeReport {
  branchId: string;
  month: number | null;
  year: number | null;
  invoicedAmount: number;
  totalCollected: number;
  totalPending?: number;
  outstandingBalance: number;
  counts: { total: number; pending: number; partial: number; paid: number };
  branches?: FeeReportBranch[];
  monthly: FeeReportMonth[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface CreateStudentInput {
  rollNumber: string;
  fullName: string;
  classSection: string;
  guardianPhone?: string;
  status?: StudentStatus;
}

export interface UpdateStudentInput {
  fullName?: string;
  classSection?: string;
  guardianPhone?: string;
  status?: StudentStatus;
}

export interface CreateFeeChallanInput {
  studentId: string;
  month: number;
  year: number;
  amount: number;
  dueDate: string;
}

export interface RecordFeePaymentInput {
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface CreateExpenseInput {
  category: string;
  title: string;
  amount: number;
  receiptUrl?: string;
}

export interface AttendanceMarkInput {
  date: string;
  records: Array<{ studentId: string; status: AttendanceStatus }>;
}

export interface RegisterStaffInput {
  email: string;
  password: string;
  role: Role;
  branchId?: string | null;
}

export interface UpdateStaffInput {
  role?: Role;
  isActive?: boolean;
}

export interface UpdateStaffProfileInput {
  fullName?: string | null;
  email?: string;
  designation?: string;
}

export interface AcademicSection {
  id: string;
  name: string;
  capacity: number;
  classId: string;
}

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  classId: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  branchId: string;
  createdAt: string;
  sections: AcademicSection[];
  subjects: AcademicSubject[];
}

export interface ExamTerm {
  id: string;
  name: string;
  title?: string;
  startDate: string;
  endDate: string;
  branchId: string;
  createdAt: string;
}

export interface GradebookRow {
  studentId: string;
  fullName: string;
  rollNumber: string;
  classSection: string;
  marksObtained: number | null;
  totalMarks: number;
  remarks: string;
  percentage: number | null;
  letter: string | null;
  gpa: number | null;
}

export interface Gradebook {
  examTerm: ExamTerm;
  subject: AcademicSubject & { className: string };
  rows: GradebookRow[];
}

export interface ReportCardSubject {
  subjectId: string;
  name: string;
  code: string;
  marksObtained: number;
  totalMarks: number;
  remarks?: string | null;
  percentage: number;
  letter: string;
  gpa: number;
}

export interface ReportCard {
  student: Pick<Student, "id" | "fullName" | "rollNumber" | "classSection" | "status">;
  campus: Pick<Branch, "id" | "name" | "code">;
  examTerm: ExamTerm;
  subjects: ReportCardSubject[];
  obtainedTotal: number;
  totalMarks: number;
  cumulativePercentage: number;
  letter: string;
  gpa: number;
  termStatus: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  resultStatus: "PASS" | "FAIL";
  rank: number | null;
  cohortSize: number;
}

export interface CreateClassInput {
  name: string;
  code: string;
  sections?: Array<{ name: string; capacity?: number }>;
  subjects?: Array<{ name: string; code: string }>;
}

export interface CreateExamTermInput {
  name?: string;
  title?: string;
  startDate: string;
  endDate: string;
}

export interface GradeBatchInput {
  subjectId: string;
  examTermId: string;
  entries: Array<{
    studentId: string;
    marksObtained: number;
    totalMarks: number;
    remarks?: string;
  }>;
}

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type LeaveType = "CASUAL" | "SICK" | "UNPAID";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PayrollStatus = "PENDING" | "PAID";

export interface Classroom {
  id: string;
  roomNumber: string;
  capacity: number;
  branchId: string;
}

export interface TimetableTeacher {
  id: string;
  email: string;
  role: Role;
}

export interface TimetableSlot {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  branchId: string;
  section: {
    id: string;
    name: string;
    class: { id: string; name: string; code: string };
  };
  subject: { id: string; name: string; code: string; classId: string };
  classroom: { id: string; roomNumber: string; capacity: number };
  teacher: TimetableTeacher;
}

export interface UpsertTimetableSlotInput {
  id?: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface StaffSalaryProfile {
  userId: string;
  email: string;
  role: Role;
  isActive: boolean;
  baseSalary: number | null;
  designation: string | null;
  joinedDate: string | null;
  profileId: string | null;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string;
  createdAt: string;
  user?: Pick<User, "id" | "email" | "role">;
}

export interface PayrollSlip {
  id: string;
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string | null;
  createdAt: string;
  user?: Pick<User, "id" | "email" | "role">;
}

export type ParentRelationship = "FATHER" | "MOTHER" | "GUARDIAN";

export type HomeworkSubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED";

export type AdmissionsLeadStatus =
  | "NEW_INQUIRY"
  | "CONTACTED"
  | "INTERVIEW_SCHEDULED"
  | "ADMITTED"
  | "REJECTED";

export interface ParentChild {
  id: string;
  fullName: string;
  rollNumber: string;
  classSection: string;
  status: StudentStatus;
  relationship: ParentRelationship;
  attendancePercent: number | null;
  unpaidBalance: number;
  openHomework: number;
  recentGrades: Array<{
    subject: string;
    marksObtained: number;
    totalMarks: number;
    letter: string | null;
  }>;
}

export interface ParentHomeworkItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  submission: {
    id: string;
    submissionUrl: string;
    status: HomeworkSubmissionStatus;
    grade: string | null;
  } | null;
}

export interface ParentAcademicSummary {
  student: Pick<Student, "id" | "fullName" | "rollNumber" | "classSection" | "status">;
  attendancePercent: number | null;
  attendance: AttendanceRecord[];
  unpaidBalance: number;
  fees: Array<{
    id: string;
    month: number;
    year: number;
    amount: number;
    paidAmount: number;
    remainingBalance: number;
    status: FeeStatus;
  }>;
  grades: Array<{
    subject: string;
    examTerm: string;
    marksObtained: number;
    totalMarks: number;
    letter: string;
  }>;
  homework: ParentHomeworkItem[];
}

export interface HomeworkAssignment {
  id: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  createdAt: string;
  subject: { id: string; name: string; code: string };
  teacher?: { id: string; email: string };
  section?: { id: string; name: string; class: { id: string; name: string } };
  submissions: Array<{
    id: string;
    homeworkId: string;
    studentId: string;
    submissionUrl: string;
    status: HomeworkSubmissionStatus;
    grade: string | null;
    student?: Pick<Student, "id" | "fullName" | "rollNumber">;
  }>;
}

export interface CreateHomeworkInput {
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface AdmissionsLead {
  id: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  targetClassId: string | null;
  status: AdmissionsLeadStatus;
  branchId: string;
  notes: string | null;
  inquiryId: string | null;
  createdAt: string;
  updatedAt: string;
  enrolledStudentId?: string;
  targetClass?: { id: string; name: string; code: string } | null;
  inquiry?: { id: string; type: string; message: string; createdAt: string } | null;
}

export interface StaffProfile {
  id: string;
  email: string;
  fullName?: string | null;
  role: Role;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  branch?: Pick<Branch, "id" | "name" | "code"> | null;
  staffProfile: {
    designation: string;
    joinedDate: string;
    baseSalary: number;
  } | null;
  assignedClasses: Array<{
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    subject: { id: string; name: string; code: string };
    section: { id: string; name: string; class: { id: string; name: string; code: string } };
  }>;
  payroll: Array<{
    id: string;
    month: number;
    year: number;
    baseSalary: number;
    deductions: number;
    netSalary: number;
    status: PayrollStatus;
    paidAt?: string | null;
  }>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DashboardAnalytics {
  campusName: string;
  studentCount: number;
  collectedThisMonth: number;
  collectedLastMonth: number;
  collectedChangePct: number;
  pendingFees: number;
  expensesThisMonth: number;
  expensesLastMonth: number;
  expensesChangePct: number;
  monthlyRevenueVsExpenses: Array<{
    month: string;
    year: number;
    collectedFees: number;
    expenses: number;
  }>;
  attendanceOverview: {
    presentPercentage: number;
    absentPercentage: number;
    leavePercentage: number;
    markedCount: number;
    studentCount: number;
  };
  feeStatusBreakdown: {
    paidCount: number;
    partialCount: number;
    pendingCount: number;
  };
  recentActivity: Array<{
    id: string;
    type: "PAYMENT" | "EXPENSE";
    message: string;
    createdAt: string;
  }>;
  canSeeFinance: boolean;
}
