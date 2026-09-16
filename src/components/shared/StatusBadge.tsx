"use client";

import {
  ArrowRightLeft,
  CalendarOff,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Clock,
  GraduationCap,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, BookLoanStatus, FeeStatus, HomeworkSubmissionStatus, LeaveStatus, PayrollStatus, StudentStatus, AdmissionsLeadStatus } from "@/types";

const TONE = {
  navy: "border-transparent bg-deep-navy text-white",
  gold: "border-transparent bg-marigold text-deep-navy",
  cloud: "border-deep-navy/25 bg-cloud text-deep-navy",
  leaf: "border-transparent bg-leaf text-white",
} as const;

function StatusChip({
  icon: Icon,
  label,
  tone,
  className,
}: {
  icon: LucideIcon;
  label: string;
  tone: keyof typeof TONE;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("h-7 gap-1 rounded-full px-2 text-[13px] font-semibold", TONE[tone], className)}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}

const FEE_STATUS: Record<FeeStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  PAID: { icon: CircleCheck, label: "Paid", tone: "navy" },
  PENDING: { icon: CircleAlert, label: "Pending", tone: "gold" },
  PARTIAL: { icon: Clock, label: "Partial", tone: "cloud" },
};

const STUDENT_STATUS: Record<StudentStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  ACTIVE: { icon: CircleCheck, label: "Active", tone: "navy" },
  INACTIVE: { icon: CircleMinus, label: "Inactive", tone: "cloud" },
  GRADUATED: { icon: GraduationCap, label: "Graduated", tone: "leaf" },
  TRANSFERRED: { icon: ArrowRightLeft, label: "Transferred", tone: "gold" },
  WITHDRAWN: { icon: CircleMinus, label: "Withdrawn", tone: "cloud" },
};

export function FeeStatusBadge({ status }: { status: FeeStatus }) {
  const item = FEE_STATUS[status];
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const item = STUDENT_STATUS[status];
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

const LEAVE_STATUS: Record<LeaveStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  PENDING: { icon: CircleAlert, label: "Pending", tone: "gold" },
  APPROVED: { icon: CircleCheck, label: "Approved", tone: "navy" },
  REJECTED: { icon: CircleX, label: "Rejected", tone: "cloud" },
};

const PAYROLL_STATUS: Record<PayrollStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  PAID: { icon: CircleCheck, label: "Paid", tone: "navy" },
  PENDING: { icon: CircleAlert, label: "Pending", tone: "gold" },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const item = LEAVE_STATUS[status];
  if (!item) return null;
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const item = PAYROLL_STATUS[status];
  if (!item) return null;
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

const HOMEWORK_STATUS: Record<HomeworkSubmissionStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  PENDING: { icon: CircleAlert, label: "Pending", tone: "gold" },
  SUBMITTED: { icon: Clock, label: "Submitted", tone: "cloud" },
  GRADED: { icon: CircleCheck, label: "Graded", tone: "navy" },
};

const ADMISSIONS_STATUS: Record<AdmissionsLeadStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  NEW_INQUIRY: { icon: CircleAlert, label: "New inquiry", tone: "gold" },
  CONTACTED: { icon: Clock, label: "Contacted", tone: "cloud" },
  INTERVIEW_SCHEDULED: { icon: GraduationCap, label: "Interview", tone: "leaf" },
  ADMITTED: { icon: CircleCheck, label: "Admitted", tone: "navy" },
  REJECTED: { icon: CircleX, label: "Rejected", tone: "cloud" },
};

export function HomeworkStatusBadge({ status }: { status: HomeworkSubmissionStatus }) {
  const item = HOMEWORK_STATUS[status];
  if (!item) return null;
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

export function AdmissionsStatusBadge({ status }: { status: AdmissionsLeadStatus }) {
  const item = ADMISSIONS_STATUS[status];
  if (!item) return null;
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

const LOAN_STATUS: Record<BookLoanStatus, { icon: LucideIcon; label: string; tone: keyof typeof TONE }> = {
  ISSUED: { icon: Clock, label: "Issued", tone: "cloud" },
  OVERDUE: { icon: CircleAlert, label: "Overdue", tone: "gold" },
  RETURNED: { icon: CircleCheck, label: "Returned", tone: "navy" },
};

export function LoanStatusBadge({ status }: { status: BookLoanStatus }) {
  const item = LOAN_STATUS[status];
  if (!item) return null;
  return <StatusChip icon={item.icon} label={item.label} tone={item.tone} />;
}

export const ATTENDANCE_OPTIONS: Record<
  AttendanceStatus,
  { icon: LucideIcon; label: string; activeClass: string }
> = {
  PRESENT: {
    icon: CircleCheck,
    label: "Present",
    activeClass: "border-deep-navy bg-deep-navy text-white",
  },
  ABSENT: {
    icon: CircleX,
    label: "Absent",
    activeClass: "border-deep-navy bg-white text-deep-navy ring-1 ring-deep-navy",
  },
  LATE: {
    icon: Clock,
    label: "Late",
    activeClass: "border-marigold bg-marigold text-deep-navy",
  },
  LEAVE: {
    icon: CalendarOff,
    label: "Leave",
    activeClass: "border-deep-navy/30 bg-cloud text-deep-navy",
  },
};
