"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { academicsApi, payrollApi, timetableApi } from "@/lib/api";
import { canManageTimetable } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { displayUserName, formatTimeRange, getErrorMessage, todayKey } from "@/lib/utils";
import type { DayOfWeek, LeaveType, TimetableSlot } from "@/types";

const DAYS: Array<{ id: DayOfWeek; label: string }> = [
  { id: "MON", label: "Mon" },
  { id: "TUE", label: "Tue" },
  { id: "WED", label: "Wed" },
  { id: "THU", label: "Thu" },
  { id: "FRI", label: "Fri" },
  { id: "SAT", label: "Sat" },
];

const PERIODS = [
  { startTime: "08:00", endTime: "09:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:00" },
];

const LEAVE_TYPES: LeaveType[] = ["CASUAL", "SICK", "UNPAID"];

const EMPTY_SLOT = {
  sectionId: "",
  subjectId: "",
  teacherId: "",
  classroomId: "",
  dayOfWeek: "MON" as DayOfWeek,
  startTime: "08:00",
  endTime: "09:00",
};

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canManageTimetable(user?.role);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [view, setView] = useState<"section" | "teacher">("section");
  const [slotOpen, setSlotOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);
  const [roomForm, setRoomForm] = useState({ roomNumber: "", capacity: "40" });
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL" as LeaveType,
    startDate: todayKey(),
    endDate: todayKey(),
    reason: "",
  });

  const classesQuery = useQuery({
    queryKey: ["classes", branchId],
    queryFn: academicsApi.listClasses,
    enabled: Boolean(branchId),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", branchId],
    queryFn: timetableApi.listRooms,
    enabled: Boolean(branchId),
  });
  const teachersQuery = useQuery({
    queryKey: ["timetable-teachers", branchId],
    queryFn: timetableApi.listTeachers,
    enabled: Boolean(branchId),
  });

  const selectedClass = (classesQuery.data ?? []).find((item) => item.id === classId);
  const sections = selectedClass?.sections ?? [];
  const subjects = selectedClass?.subjects ?? [];
  const activeSectionId = view === "section" ? sectionId : "";
  const activeTeacherId = view === "teacher" ? teacherId : "";

  const sectionQuery = useQuery({
    queryKey: ["timetable-section", activeSectionId],
    queryFn: () => timetableApi.sectionSchedule(activeSectionId),
    enabled: Boolean(activeSectionId),
  });
  const teacherQuery = useQuery({
    queryKey: ["timetable-teacher", activeTeacherId],
    queryFn: () => timetableApi.teacherSchedule(activeTeacherId),
    enabled: Boolean(activeTeacherId),
  });

  const slots = view === "section" ? (sectionQuery.data ?? []) : (teacherQuery.data ?? []);
  const loading = view === "section" ? sectionQuery.isLoading : teacherQuery.isLoading;
  const ready = view === "section" ? Boolean(activeSectionId) : Boolean(activeTeacherId);

  const slotMutation = useMutation({
    mutationFn: timetableApi.upsertSlot,
    onSuccess: async () => {
      toast.success("Timetable slot saved");
      setSlotOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["timetable-section"] });
      await queryClient.invalidateQueries({ queryKey: ["timetable-teacher"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to save this slot")),
  });
  const roomMutation = useMutation({
    mutationFn: timetableApi.createRoom,
    onSuccess: async () => {
      toast.success("Classroom added");
      setRoomOpen(false);
      setRoomForm({ roomNumber: "", capacity: "40" });
      await queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add classroom")),
  });
  const leaveMutation = useMutation({
    mutationFn: payrollApi.submitLeave,
    onSuccess: () => {
      toast.success("Leave request submitted");
      setLeaveOpen(false);
      setLeaveForm({ leaveType: "CASUAL", startDate: todayKey(), endDate: todayKey(), reason: "" });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to submit leave")),
  });

  const grid = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    for (const slot of slots) {
      map.set(`${slot.dayOfWeek}-${slot.startTime}`, slot);
    }
    return map;
  }, [slots]);

  function openCell(dayOfWeek: DayOfWeek, startTime: string, endTime: string, existing?: TimetableSlot) {
    if (!canEdit) return;
    setSlotForm({
      sectionId: existing?.sectionId || sectionId,
      subjectId: existing?.subjectId || "",
      teacherId: existing?.teacherId || teacherId,
      classroomId: existing?.classroomId || "",
      dayOfWeek,
      startTime,
      endTime,
    });
    setSlotOpen(true);
  }

  function onSaveSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    slotMutation.mutate(slotForm);
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to view the weekly timetable."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Timetable"
        description="Conflict-free weekly schedule by class section or teacher."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLeaveOpen(true)}>
              Request leave
            </Button>
            {canEdit ? (
              <Button onClick={() => setRoomOpen(true)}>
                <CirclePlus className="size-5" strokeWidth={1.75} />
                Add room
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-4">
        <Field id="timetable-view" label="View">
        <Select
          value={view}
          onValueChange={(value) => {
            setView(value as "section" | "teacher");
          }}
        >
          <SelectTrigger id="timetable-view" className="w-full bg-white">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="section">By class / section</SelectItem>
            <SelectItem value="teacher">By teacher</SelectItem>
          </SelectContent>
        </Select>
        </Field>
        {view === "section" ? (
          <>
            <Field id="timetable-class" label="Class">
            <Select
              value={classId}
              onValueChange={(value) => {
                setClassId(value);
                setSectionId("");
              }}
            >
              <SelectTrigger id="timetable-class" className="w-full bg-white">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {(classesQuery.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Field id="timetable-section" label="Section">
            <Select
              value={sectionId}
              onValueChange={setSectionId}
              disabled={!classId}
            >
              <SelectTrigger id="timetable-section" className="w-full bg-white">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
          </>
        ) : (
          <Field id="timetable-teacher" label="Teacher">
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger id="timetable-teacher" className="w-full bg-white">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {(teachersQuery.data ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {displayUserName(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </Field>
        )}
      </div>

      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Choose a class and section, or a teacher, to load the weekly grid.
        </p>
      ) : loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-cloud bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-cloud bg-paper text-left">
                <th className="px-3 py-2 font-medium">Period</th>
                {DAYS.map((day) => (
                  <th key={day.id} className="px-3 py-2 font-medium">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period.startTime} className="border-b border-cloud">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {formatTimeRange(period.startTime, period.endTime)}
                  </td>
                  {DAYS.map((day) => {
                    const slot = grid.get(`${day.id}-${period.startTime}`);
                    return (
                      <td key={day.id} className="p-1.5 align-top">
                        {slot ? (
                          <button
                            type="button"
                            className="w-full rounded-[10px] bg-cloud px-2 py-2 text-left"
                            onClick={() =>
                              openCell(day.id, period.startTime, period.endTime, slot)
                            }
                          >
                            <p className="font-medium">{slot.subject.name}</p>
                            <p className="text-xs text-muted-foreground">{slot.classroom.roomNumber}</p>
                            <p className="text-xs text-muted-foreground">{displayUserName(slot.teacher)}</p>
                          </button>
                        ) : canEdit ? (
                          <button
                            type="button"
                            className="flex h-16 w-full items-center justify-center rounded-[10px] border border-dashed border-cloud text-muted-foreground"
                            onClick={() => openCell(day.id, period.startTime, period.endTime)}
                          >
                            Assign
                          </button>
                        ) : (
                          <div className="h-16" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={slotOpen} onOpenChange={setSlotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign period</DialogTitle>
            <DialogDescription>
              The API rejects overlapping teacher or room bookings with HTTP 409.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSaveSlot}>
            <Field id="slot-section" label="Section">
            <Select
              value={slotForm.sectionId}
              onValueChange={(value) => setSlotForm((current) => ({ ...current, sectionId: value, subjectId: "" }))}
            >
              <SelectTrigger id="slot-section" className="w-full bg-white">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {(classesQuery.data ?? []).flatMap((item) =>
                  item.sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {item.name} {section.name}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
            </Field>
            <Field id="slot-subject" label="Subject">
            <Select
              value={slotForm.subjectId}
              onValueChange={(value) => setSlotForm((current) => ({ ...current, subjectId: value }))}
            >
              <SelectTrigger id="slot-subject" className="w-full bg-white">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {(
                  (classesQuery.data ?? []).find((item) =>
                    item.sections.some((section) => section.id === slotForm.sectionId),
                  )?.subjects ?? subjects
                ).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Field id="slot-teacher" label="Teacher">
            <Select
              value={slotForm.teacherId}
              onValueChange={(value) => setSlotForm((current) => ({ ...current, teacherId: value }))}
            >
              <SelectTrigger id="slot-teacher" className="w-full bg-white">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {(teachersQuery.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {displayUserName(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Field id="slot-room" label="Room">
            <Select
              value={slotForm.classroomId}
              onValueChange={(value) => setSlotForm((current) => ({ ...current, classroomId: value }))}
            >
              <SelectTrigger id="slot-room" className="w-full bg-white">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {(roomsQuery.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="slot-start"
                label="Start"
                type="time"
                required
                value={slotForm.startTime}
                onChange={(event) =>
                  setSlotForm((current) => ({ ...current, startTime: event.target.value }))
                }
              />
              <Input
                id="slot-end"
                label="End"
                type="time"
                required
                value={slotForm.endTime}
                onChange={(event) =>
                  setSlotForm((current) => ({ ...current, endTime: event.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSlotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={slotMutation.isPending}>
                {slotMutation.isPending ? "Saving…" : "Save slot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add classroom</DialogTitle>
            <DialogDescription>Rooms are branch-scoped and used for conflict checks.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              roomMutation.mutate({
                roomNumber: roomForm.roomNumber,
                capacity: Number(roomForm.capacity || 40),
              });
            }}
          >
            <Input
              id="room-number"
              label="Room number"
              required
              value={roomForm.roomNumber}
              onChange={(event) =>
                setRoomForm((current) => ({ ...current, roomNumber: event.target.value }))
              }
            />
            <Input
              id="room-capacity"
              label="Capacity"
              type="number"
              min={1}
              value={roomForm.capacity}
              onChange={(event) =>
                setRoomForm((current) => ({ ...current, capacity: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoomOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={roomMutation.isPending}>
                {roomMutation.isPending ? "Saving…" : "Save room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>Unpaid leave days reduce the next generated payslip.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              leaveMutation.mutate(leaveForm);
            }}
          >
            <Field id="leave-type" label="Leave type">
            <Select
              value={leaveForm.leaveType}
              onValueChange={(value) =>
                setLeaveForm((current) => ({ ...current, leaveType: value as LeaveType }))
              }
            >
              <SelectTrigger id="leave-type" className="w-full bg-white">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Input
              id="leave-start"
              label="Start date"
              type="date"
              required
              value={leaveForm.startDate}
              onChange={(event) =>
                setLeaveForm((current) => ({ ...current, startDate: event.target.value }))
              }
            />
            <Input
              id="leave-end"
              label="End date"
              type="date"
              required
              value={leaveForm.endDate}
              onChange={(event) =>
                setLeaveForm((current) => ({ ...current, endDate: event.target.value }))
              }
            />
            <Input
              id="leave-reason"
              label="Reason"
              required
              value={leaveForm.reason}
              onChange={(event) =>
                setLeaveForm((current) => ({ ...current, reason: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLeaveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={leaveMutation.isPending}>
                {leaveMutation.isPending ? "Sending…" : "Submit request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
