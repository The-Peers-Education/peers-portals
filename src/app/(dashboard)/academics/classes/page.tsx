"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { AcademicsNav } from "@/components/academics/AcademicsNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { academicsApi, staffApi, studentsApi } from "@/lib/api";
import { canManageAcademics } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { displayUserName, getErrorMessage } from "@/lib/utils";
import type { AcademicClass, AcademicSection, Student } from "@/types";

export default function AcademicClassesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canManageAcademics(user?.role);
  const [open, setOpen] = useState(false);
  const [assign, setAssign] = useState<{ schoolClass: AcademicClass; section: AcademicSection } | null>(null);
  const [roster, setRoster] = useState<AcademicSection | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    section: "A",
    capacity: "40",
    subjectName: "",
    subjectCode: "",
  });

  const classesQuery = useQuery({
    queryKey: ["classes", branchId],
    queryFn: academicsApi.listClasses,
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: academicsApi.createClass,
    onSuccess: async () => {
      toast.success("Class created");
      setOpen(false);
      setForm({
        name: "",
        code: "",
        section: "A",
        capacity: "40",
        subjectName: "",
        subjectCode: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to create class")),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      name: form.name,
      code: form.code,
      sections: form.section
        ? [{ name: form.section, capacity: Number(form.capacity) || 40 }]
        : undefined,
      subjects:
        form.subjectName && form.subjectCode
          ? [{ name: form.subjectName, code: form.subjectCode }]
          : undefined,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to manage classes, sections, and staff assignments."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Classes & assignments"
        description="Build the class catalog, assign form teachers, and enroll students into sections."
        action={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <CirclePlus className="size-5" strokeWidth={1.75} />
              Add class
            </Button>
          ) : null
        }
      />
      <AcademicsNav />

      {classesQuery.isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (classesQuery.data ?? []).length === 0 ? (
        <EmptyHint
          icon={GraduationCap}
          title="No classes yet"
          description="Create a class with at least one section and subject before assigning teachers."
        />
      ) : (
        <div className="grid gap-4">
          {(classesQuery.data ?? []).map((schoolClass) => (
            <ClassCard
              key={schoolClass.id}
              schoolClass={schoolClass}
              canEdit={canEdit}
              onAssign={(section) => setAssign({ schoolClass, section })}
              onRoster={(section) =>
                setRoster({
                  ...section,
                  label: `${schoolClass.name}-${section.name}`,
                  class: { id: schoolClass.id, name: schoolClass.name, code: schoolClass.code },
                })
              }
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>Code must be unique within the selected campus.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              id="class-name"
              label="Class name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              id="class-code"
              label="Class code"
              required
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            />
            <Input
              id="section-name"
              label="First section"
              value={form.section}
              onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
            />
            <Input
              id="section-capacity"
              label="Section capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
            />
            <Input
              id="subject-name"
              label="First subject name"
              value={form.subjectName}
              onChange={(event) =>
                setForm((current) => ({ ...current, subjectName: event.target.value }))
              }
            />
            <Input
              id="subject-code"
              label="First subject code"
              value={form.subjectCode}
              onChange={(event) =>
                setForm((current) => ({ ...current, subjectCode: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assign ? (
        <AssignStaffDialog
          schoolClass={assign.schoolClass}
          section={assign.section}
          onClose={() => setAssign(null)}
        />
      ) : null}
      {roster ? <RosterDrawer section={roster} onClose={() => setRoster(null)} /> : null}
    </PageShell>
  );
}

function ClassCard({
  schoolClass,
  canEdit,
  onAssign,
  onRoster,
}: {
  schoolClass: AcademicClass;
  canEdit: boolean;
  onAssign: (section: AcademicSection) => void;
  onRoster: (section: AcademicSection) => void;
}) {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [sectionName, setSectionName] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [roomNumber, setRoomNumber] = useState("");
  const [subject, setSubject] = useState({ name: "", code: "" });

  const sectionMutation = useMutation({
    mutationFn: () =>
      academicsApi.addSection(schoolClass.id, {
        name: sectionName,
        capacity: Number(capacity) || 40,
        roomNumber: roomNumber || undefined,
      }),
    onSuccess: async () => {
      toast.success("Section added");
      setSectionName("");
      setRoomNumber("");
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add section")),
  });

  const subjectMutation = useMutation({
    mutationFn: () => academicsApi.addSubject(schoolClass.id, subject),
    onSuccess: async () => {
      toast.success("Subject added");
      setSubject({ name: "", code: "" });
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add subject")),
  });

  return (
    <section className="rounded-[10px] border border-cloud bg-card p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-deep-navy">{schoolClass.name}</h2>
        <p className="text-sm text-muted-foreground">Code {schoolClass.code}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {schoolClass.sections.map((section) => {
          const enrolled = section._count?.students ?? 0;
          const full = enrolled >= section.capacity;
          return (
            <Card key={section.id} size="sm">
              <CardHeader>
                <CardTitle>
                  {schoolClass.name}-{section.name}
                </CardTitle>
                <CardDescription>
                  Incharge: {section.classTeacher?.fullName?.trim() || "Unassigned"}
                  {section.roomNumber ? ` · Room ${section.roomNumber}` : ""}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={full ? "secondary" : "default"}>
                    {enrolled}/{section.capacity} enrolled
                  </Badge>
                  {(section.subjectAssignments ?? []).map((assignment) => (
                    <Badge key={assignment.id} variant="secondary">
                      {assignment.subject.name}: {assignment.teacher.fullName?.trim() || "Unassigned"}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onRoster(section)}>
                  <Users className="size-4" strokeWidth={1.75} />
                  Roster
                </Button>
                {canEdit ? (
                  <Button size="sm" variant="outline" onClick={() => onAssign(section)}>
                    Assign staff
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {canEdit ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <form
            className="grid grid-cols-[1fr_5rem_5rem_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (sectionName) sectionMutation.mutate();
            }}
          >
            <Input
              id={`${schoolClass.id}-section`}
              placeholder="Section"
              aria-label="Section name"
              className="h-10 min-h-10"
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
            />
            <Input
              id={`${schoolClass.id}-capacity`}
              placeholder="Cap"
              aria-label="Capacity"
              type="number"
              min={1}
              className="h-10 min-h-10"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
            <Input
              id={`${schoolClass.id}-room`}
              placeholder="Room"
              aria-label="Room number"
              className="h-10 min-h-10"
              value={roomNumber}
              onChange={(event) => setRoomNumber(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={sectionMutation.isPending}>
              Add
            </Button>
          </form>
          <form
            className="grid grid-cols-[1fr_1fr_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (subject.name && subject.code) subjectMutation.mutate();
            }}
          >
            <Input
              id={`${schoolClass.id}-subject-name`}
              placeholder="Subject"
              aria-label="Subject name"
              className="h-10 min-h-10"
              value={subject.name}
              onChange={(event) => setSubject((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              id={`${schoolClass.id}-subject-code`}
              placeholder="Code"
              aria-label="Subject code"
              className="h-10 min-h-10"
              value={subject.code}
              onChange={(event) => setSubject((current) => ({ ...current, code: event.target.value }))}
            />
            <Button type="submit" size="sm" disabled={subjectMutation.isPending}>
              Add
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function AssignStaffDialog({
  schoolClass,
  section,
  onClose,
}: {
  schoolClass: AcademicClass;
  section: AcademicSection;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [inchargeId, setInchargeId] = useState(section.classTeacherId ?? "");
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const assignment of section.subjectAssignments ?? []) {
      next[assignment.subject.id] = assignment.teacher.id;
    }
    return next;
  });

  const staffQuery = useQuery({
    queryKey: ["staff", branchId],
    queryFn: staffApi.list,
    enabled: Boolean(branchId),
  });
  const teachers = (staffQuery.data ?? []).filter(
    (member) => member.role === "TEACHER" || member.role === "BRANCH_ADMIN",
  );

  const inchargeMutation = useMutation({
    mutationFn: (teacherId: string) => academicsApi.assignClassTeacher(section.id, teacherId),
    onSuccess: async () => {
      toast.success("Class incharge updated");
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to assign incharge")),
  });

  const subjectMutation = useMutation({
    mutationFn: ({ subjectId, teacherId }: { subjectId: string; teacherId: string }) =>
      academicsApi.assignSubjectTeacher({ sectionId: section.id, subjectId, teacherId }),
    onSuccess: async () => {
      toast.success("Subject teacher updated");
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to assign subject teacher")),
  });

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign staff</DialogTitle>
          <DialogDescription>
            {schoolClass.name}-{section.name}: form teacher and subject mapping.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field id="incharge" label="Class incharge / form teacher">
            <Select
              value={inchargeId || undefined}
              onValueChange={(value) => {
                setInchargeId(value);
                inchargeMutation.mutate(value);
              }}
            >
              <SelectTrigger id="incharge" className="w-full">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {displayUserName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {schoolClass.subjects.map((subject) => (
            <Field key={subject.id} id={`subject-${subject.id}`} label={subject.name}>
              <Select
                value={subjectMap[subject.id] || undefined}
                onValueChange={(value) => {
                  setSubjectMap((current) => ({ ...current, [subject.id]: value }));
                  subjectMutation.mutate({ subjectId: subject.id, teacherId: value });
                }}
              >
                <SelectTrigger id={`subject-${subject.id}`} className="w-full">
                  <SelectValue placeholder="Subject teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {displayUserName(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RosterDrawer({ section, onClose }: { section: AcademicSection; onClose: () => void }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canManageAcademics(user?.role);
  const [enrollId, setEnrollId] = useState("");

  const rosterQuery = useQuery({
    queryKey: ["section-roster", section.id],
    queryFn: () => academicsApi.sectionRoster(section.id),
  });
  const unassignedQuery = useQuery({
    queryKey: ["unassigned-students", branchId],
    queryFn: academicsApi.unassignedStudents,
    enabled: canEdit && Boolean(branchId),
  });
  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: canEdit && Boolean(branchId),
  });

  const enrollMutation = useMutation({
    mutationFn: (studentIds: string[]) => academicsApi.enrollStudents(section.id, studentIds),
    onSuccess: async () => {
      toast.success("Student enrolled");
      setEnrollId("");
      await queryClient.invalidateQueries({ queryKey: ["section-roster", section.id] });
      await queryClient.invalidateQueries({ queryKey: ["unassigned-students", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["students", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to enroll student")),
  });

  const enrolled = rosterQuery.data?.students ?? [];
  const enrolledIds = new Set(enrolled.map((student) => student.id));
  const unassigned = unassignedQuery.data ?? [];
  const label = section.label ?? `${section.class?.name ?? ""}-${section.name}`;
  const candidates = (studentsQuery.data ?? []).filter(
    (student) => student.status === "ACTIVE" && !enrolledIds.has(student.id),
  );
  const enrollPool = candidates.length > 0 ? candidates : unassigned.filter((student) => !enrolledIds.has(student.id));

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="top-0 right-0 left-auto h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label} roster</DialogTitle>
          <DialogDescription>
            {enrolled.length}/{section.capacity} seats filled
            {section.roomNumber ? ` · Room ${section.roomNumber}` : ""}.
          </DialogDescription>
        </DialogHeader>
        {rosterQuery.isLoading ? (
          <TableSkeleton rows={6} cols={2} />
        ) : enrolled.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled in this section yet.</p>
        ) : (
          <ul className="grid max-h-[50vh] gap-2 overflow-y-auto">
            {enrolled.map((student: Student) => (
              <li key={student.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-cloud px-3 py-2">
                <span>
                  <span className="block font-medium">{student.fullName}</span>
                  <span className="text-xs text-muted-foreground">Roll {student.rollNumber}</span>
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link href={portalPath(user?.role, `/students/${student.id}`)}>Profile</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <div className="grid gap-2">
            <Field id="enroll-student" label="Enroll or transfer student">
              <Select value={enrollId || undefined} onValueChange={setEnrollId}>
                <SelectTrigger id="enroll-student" className="w-full">
                  <SelectValue placeholder="Unassigned or other sections" />
                </SelectTrigger>
                <SelectContent>
                  {enrollPool.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} · {student.rollNumber}
                      {student.classSection ? ` · ${student.classSection}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button
              type="button"
              disabled={!enrollId || enrollMutation.isPending}
              onClick={() => enrollMutation.mutate([enrollId])}
            >
              {enrollMutation.isPending ? "Enrolling…" : "Move into section"}
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
