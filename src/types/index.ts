export type Role = "SUPER_ADMIN" | "BRANCH_ADMIN" | "ACCOUNTANT" | "TEACHER" | "PARENT";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";

export type FeeStatus = "PENDING" | "PAID" | "PARTIAL";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

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

export interface FeeChallan {
  id: string;
  branchId: string;
  studentId: string;
  month: number;
  year: number;
  amount: string | number;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
  student?: Pick<Student, "id" | "fullName" | "rollNumber" | "classSection">;
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

export interface CreateFeeChallanInput {
  studentId: string;
  month: number;
  year: number;
  amount: number;
  dueDate: string;
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
