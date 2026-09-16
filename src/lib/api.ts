import axios, { AxiosError, type AxiosResponse } from "axios";
import type {
  ApiResponse,
  AttendanceMarkInput,
  AttendanceRecord,
  AuthPayload,
  Branch,
  CreateExpenseInput,
  CreateFeeChallanInput,
  BulkStaffImportInput,
  BulkStaffImportResult,
  BulkStudentImportInput,
  BulkStudentImportResult,
  CreateStudentInput,
  CsvExportPayload,
  Expense,
  FeeChallan,
  FeeReport,
  FeeStatus,
  LoginPayload,
  RecordFeePaymentInput,
  RegisterStaffInput,
  Student,
  StudentProfile,
  StudentStatus,
  UpdateStaffInput,
  UpdateStaffProfileInput,
  UpdateStudentInput,
  User,
  AcademicClass,
  AcademicSubject,
  CreateClassInput,
  CreateExamTermInput,
  ExamTerm,
  GradeBatchInput,
  Gradebook,
  ReportCard,
  Classroom,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PayrollSlip,
  StaffSalaryProfile,
  TimetableSlot,
  TimetableTeacher,
  UpsertTimetableSlotInput,
  ParentChild,
  ParentAcademicSummary,
  HomeworkAssignment,
  CreateHomeworkInput,
  AdmissionsLead,
  AdmissionsLeadStatus,
  StaffProfile,
  ChangePasswordInput,
  DashboardAnalytics,
  BookLoan,
  BookLoanStatus,
  LibraryBook,
} from "@/types";
import { useAuthStore } from "@/lib/store";

function resolveApiBaseUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://peers-api-h801.onrender.com/api/v1"
      : "http://localhost:8080/api/v1")
  )
    .trim()
    .replace(/\/+$/, "");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data as T;
}

function shouldAttachBranch(url = "") {
  return !url.includes("/auth/") && !url.startsWith("/branches") && url !== "/branches";
}

api.interceptors.request.use((config) => {
  const { token, activeBranchId, user } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const branchId = activeBranchId ?? user?.branchId ?? undefined;
  const url = config.url ?? "";

  if (branchId && shouldAttachBranch(url)) {
    config.params = { branchId, ...config.params };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isLoginRequest = url.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<AuthPayload>>("/auth/login", payload).then(unwrap),
  me: () => api.get<ApiResponse<User>>("/auth/me").then(unwrap),
  register: (payload: RegisterStaffInput) =>
    api.post<ApiResponse<AuthPayload>>("/auth/register", payload).then(unwrap),
  changePassword: (payload: ChangePasswordInput) =>
    api.patch<ApiResponse<{ updated: boolean }>>("/auth/change-password", payload).then(unwrap),
};

export const branchesApi = {
  list: () => api.get<ApiResponse<Branch[]>>("/branches").then(unwrap),
  getById: (id: string) => api.get<ApiResponse<Branch>>(`/branches/${id}`).then(unwrap),
};

export const studentsApi = {
  list: (params?: { classSection?: string; status?: StudentStatus; search?: string }) =>
    api.get<ApiResponse<Student[]>>("/students", { params }).then(unwrap),
  getById: (id: string) => api.get<ApiResponse<StudentProfile>>(`/students/${id}`).then(unwrap),
  create: (payload: CreateStudentInput) =>
    api.post<ApiResponse<Student>>("/students", payload).then(unwrap),
  update: (id: string, payload: UpdateStudentInput) =>
    api.patch<ApiResponse<Student>>(`/students/${id}`, payload).then(unwrap),
  remove: (id: string) => api.delete<ApiResponse<Student>>(`/students/${id}`).then(unwrap),
  bulkImport: (records: BulkStudentImportInput[]) =>
    api.post<ApiResponse<BulkStudentImportResult>>("/students/bulk-import", records).then(unwrap),
  exportCsv: () => api.get<ApiResponse<CsvExportPayload>>("/students/export").then(unwrap),
};

export const staffApi = {
  list: () => api.get<ApiResponse<User[]>>("/staff").then(unwrap),
  me: () => api.get<ApiResponse<StaffProfile>>("/staff/me").then(unwrap),
  getById: (id: string) => api.get<ApiResponse<StaffProfile>>(`/staff/${id}`).then(unwrap),
  update: (id: string, payload: UpdateStaffInput) =>
    api.patch<ApiResponse<User>>(`/staff/${id}/role`, payload).then(unwrap),
  updateProfile: (id: string, payload: UpdateStaffProfileInput) =>
    api
      .patch<ApiResponse<StaffProfile>>(id === "me" ? "/staff/me" : `/staff/${id}/profile`, payload)
      .then(unwrap),
  bulkImport: (records: BulkStaffImportInput[]) =>
    api.post<ApiResponse<BulkStaffImportResult>>("/staff/bulk-import", records).then(unwrap),
};

export const feesApi = {
  list: (status?: FeeStatus) =>
    api
      .get<ApiResponse<FeeChallan[]>>("/fees/challans", {
        params: status ? { status } : undefined,
      })
      .then(unwrap),
  create: (payload: CreateFeeChallanInput) =>
    api.post<ApiResponse<FeeChallan>>("/fees/challans", payload).then(unwrap),
  updateStatus: (id: string, status: FeeStatus) =>
    api
      .patch<ApiResponse<FeeChallan>>(`/fees/challans/${id}/status`, { status })
      .then(unwrap),
  recordPayment: (id: string, payload: RecordFeePaymentInput) =>
    api.post<ApiResponse<FeeChallan>>(`/fees/challans/${id}/payments`, payload).then(unwrap),
  reports: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<FeeReport>>("/fees/reports", { params }).then(unwrap),
  exportCsv: () => api.get<ApiResponse<CsvExportPayload>>("/fees/export").then(unwrap),
};

export const attendanceApi = {
  list: (params?: { date?: string; studentId?: string }) =>
    api.get<ApiResponse<AttendanceRecord[]>>("/attendance", { params }).then(unwrap),
  mark: (payload: AttendanceMarkInput) =>
    api.post<ApiResponse<AttendanceRecord[]>>("/attendance", payload).then(unwrap),
};

export const expensesApi = {
  list: () => api.get<ApiResponse<Expense[]>>("/expenses").then(unwrap),
  create: (payload: CreateExpenseInput) =>
    api.post<ApiResponse<Expense>>("/expenses", payload).then(unwrap),
};

export const academicsApi = {
  listClasses: () => api.get<ApiResponse<AcademicClass[]>>("/academics/classes").then(unwrap),
  createClass: (payload: CreateClassInput) =>
    api.post<ApiResponse<AcademicClass>>("/academics/classes", payload).then(unwrap),
  addSection: (classId: string, payload: { name: string; capacity?: number }) =>
    api.post<ApiResponse<{ id: string; name: string; capacity: number }>>(
      `/academics/classes/${classId}/sections`,
      payload,
    ).then(unwrap),
  listSubjects: (classId?: string) =>
    api
      .get<ApiResponse<AcademicSubject[]>>("/academics/subjects", {
        params: classId ? { classId } : undefined,
      })
      .then(unwrap),
  addSubject: (classId: string, payload: { name: string; code: string }) =>
    api.post<ApiResponse<{ id: string; name: string; code: string }>>("/academics/subjects", {
      classId,
      ...payload,
    }).then(unwrap),
  listExams: () => api.get<ApiResponse<ExamTerm[]>>("/academics/exams").then(unwrap),
  createExam: (payload: CreateExamTermInput) =>
    api.post<ApiResponse<ExamTerm>>("/academics/exams", payload).then(unwrap),
  gradebook: (params: { subjectId: string; examTermId: string; sectionId?: string }) =>
    api.get<ApiResponse<Gradebook>>("/academics/grades", { params }).then(unwrap),
  saveGrades: (payload: GradeBatchInput) =>
    api.post<ApiResponse<unknown>>("/academics/grades/batch", payload).then(unwrap),
  reportCard: (studentId: string, examTermId?: string) =>
    api
      .get<ApiResponse<ReportCard>>(`/academics/students/${studentId}/report-card`, {
        params: examTermId ? { examTermId } : undefined,
      })
      .then(unwrap),
};

export const timetableApi = {
  listRooms: () => api.get<ApiResponse<Classroom[]>>("/timetable/rooms").then(unwrap),
  createRoom: (payload: { roomNumber: string; capacity?: number }) =>
    api.post<ApiResponse<Classroom>>("/timetable/rooms", payload).then(unwrap),
  listTeachers: () => api.get<ApiResponse<TimetableTeacher[]>>("/timetable/teachers").then(unwrap),
  sectionSchedule: (sectionId: string) =>
    api.get<ApiResponse<TimetableSlot[]>>(`/timetable/section/${sectionId}`).then(unwrap),
  teacherSchedule: (teacherId: string) =>
    api.get<ApiResponse<TimetableSlot[]>>(`/timetable/teacher/${teacherId}`).then(unwrap),
  upsertSlot: (payload: UpsertTimetableSlotInput) =>
    api.post<ApiResponse<TimetableSlot>>("/timetable/slots", payload).then(unwrap),
};

export const payrollApi = {
  list: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<PayrollSlip[]>>("/payroll", { params }).then(unwrap),
  generate: (payload: { month: number; year: number }) =>
    api.post<ApiResponse<PayrollSlip[]>>("/payroll/generate", payload).then(unwrap),
  markPaid: (id: string) => api.patch<ApiResponse<PayrollSlip>>(`/payroll/${id}/pay`).then(unwrap),
  listProfiles: () => api.get<ApiResponse<StaffSalaryProfile[]>>("/payroll/profiles").then(unwrap),
  upsertProfile: (payload: {
    userId: string;
    baseSalary: number;
    designation: string;
    joinedDate: string;
  }) => api.post<ApiResponse<StaffSalaryProfile>>("/payroll/profiles", payload).then(unwrap),
  listLeaves: () => api.get<ApiResponse<LeaveRequest[]>>("/staff/leave").then(unwrap),
  submitLeave: (payload: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }) => api.post<ApiResponse<LeaveRequest>>("/staff/leave", payload).then(unwrap),
  reviewLeave: (id: string, status: Extract<LeaveStatus, "APPROVED" | "REJECTED">) =>
    api.patch<ApiResponse<LeaveRequest>>(`/staff/leave/${id}`, { status }).then(unwrap),
};

export const parentApi = {
  children: () => api.get<ApiResponse<ParentChild[]>>("/parent/children").then(unwrap),
  academicSummary: (studentId: string) =>
    api.get<ApiResponse<ParentAcademicSummary>>(`/parent/child/${studentId}/academic-summary`).then(unwrap),
};

export const homeworkApi = {
  create: (payload: CreateHomeworkInput) =>
    api.post<ApiResponse<HomeworkAssignment>>("/homework", payload).then(unwrap),
  listBySection: (sectionId: string) =>
    api.get<ApiResponse<HomeworkAssignment[]>>(`/homework/section/${sectionId}`).then(unwrap),
  submit: (id: string, payload: { studentId: string; submissionUrl: string }) =>
    api.post<ApiResponse<{ id: string; status: string }>>(`/homework/${id}/submit`, payload).then(unwrap),
};

export const admissionsApi = {
  listLeads: () => api.get<ApiResponse<AdmissionsLead[]>>("/admissions/leads").then(unwrap),
  updateStatus: (id: string, payload: { status: AdmissionsLeadStatus; notes?: string }) =>
    api.patch<ApiResponse<AdmissionsLead>>(`/admissions/leads/${id}/status`, payload).then(unwrap),
};

export const dashboardApi = {
  analytics: () => api.get<ApiResponse<DashboardAnalytics>>("/dashboard/analytics").then(unwrap),
};

export const libraryApi = {
  listBooks: (q?: string) =>
    api.get<ApiResponse<LibraryBook[]>>("/library/books", { params: q ? { q } : undefined }).then(unwrap),
  upsertBook: (payload: {
    isbn: string;
    title: string;
    author: string;
    category: string;
    totalCopies: number;
  }) => api.post<ApiResponse<LibraryBook>>("/library/books", payload).then(unwrap),
  listLoans: (status?: BookLoanStatus) =>
    api
      .get<ApiResponse<BookLoan[]>>("/library/loans", { params: status ? { status } : undefined })
      .then(unwrap),
  issue: (payload: { bookId: string; studentId: string; dueDate: string }) =>
    api.post<ApiResponse<BookLoan>>("/library/loans/issue", payload).then(unwrap),
  returnLoan: (id: string) =>
    api.post<ApiResponse<BookLoan & { overdueDays: number; fineAmount: number }>>(
      `/library/loans/${id}/return`,
    ).then(unwrap),
};
