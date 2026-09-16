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
