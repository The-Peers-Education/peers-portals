import axios, { AxiosError, type AxiosResponse } from "axios";
import type {
  ApiResponse,
  AttendanceMarkInput,
  AttendanceRecord,
  AuthPayload,
  Branch,
  CreateExpenseInput,
  CreateFeeChallanInput,
  CreateStudentInput,
  Expense,
  FeeChallan,
  FeeStatus,
  LoginPayload,
  Student,
  StudentStatus,
  User,
} from "@/types";
import { useAuthStore } from "@/lib/store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
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
};

export const branchesApi = {
  list: () => api.get<ApiResponse<Branch[]>>("/branches").then(unwrap),
  getById: (id: string) => api.get<ApiResponse<Branch>>(`/branches/${id}`).then(unwrap),
};

export const studentsApi = {
  list: (params?: { classSection?: string; status?: StudentStatus }) =>
    api.get<ApiResponse<Student[]>>("/students", { params }).then(unwrap),
  create: (payload: CreateStudentInput) =>
    api.post<ApiResponse<Student>>("/students", payload).then(unwrap),
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
