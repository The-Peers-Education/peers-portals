// @ts-nocheck
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Building2, CirclePlus, Search } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { LoanStatusBadge } from "@/components/shared/StatusBadge";
import { libraryApi, studentsApi } from "@/lib/api";
import { canManageLibrary } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatPkr, getErrorMessage, todayKey } from "@/lib/utils";
import type { BookLoan, LibraryBook } from "@/types";

function plusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canManageLibrary(user?.role);
  const [tab, setTab] = useState<"catalog" | "loans">("catalog");
  const [search, setSearch] = useState("");
  const [bookOpen, setBookOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    isbn: "",
    title: "",
    author: "",
    category: "",
    totalCopies: "1",
  });
  const [issueForm, setIssueForm] = useState({
    studentId: "",
    bookId: "",
    dueDate: plusDays(14),
  });

  const booksQuery = useQuery({
    queryKey: ["library-books", branchId, search],
    queryFn: () => libraryApi.listBooks(search.trim() || undefined),
    enabled: Boolean(branchId),
  });
  const loansQuery = useQuery({
    queryKey: ["library-loans", branchId],
    queryFn: () => libraryApi.listLoans(),
    enabled: Boolean(branchId),
  });
  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });

  const activeLoans = useMemo(
    () => (loansQuery.data ?? []).filter((loan) => loan.status !== "RETURNED"),
    [loansQuery.data],
  );
  const availableBooks = (booksQuery.data ?? []).filter((book) => book.availableCopies > 0);

  const upsertMutation = useMutation({
    mutationFn: libraryApi.upsertBook,
    onSuccess: async () => {
      toast.success("Catalog updated");
      setBookOpen(false);
      setBookForm({ isbn: "", title: "", author: "", category: "", totalCopies: "1" });
      await queryClient.invalidateQueries({ queryKey: ["library-books", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to save book")),
  });

  const issueMutation = useMutation({
    mutationFn: libraryApi.issue,
    onSuccess: async () => {
      toast.success("Book issued");
      setIssueOpen(false);
      setIssueForm({ studentId: "", bookId: "", dueDate: plusDays(14) });
      await queryClient.invalidateQueries({ queryKey: ["library-books", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["library-loans", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to issue book")),
  });

  const returnMutation = useMutation({
    mutationFn: libraryApi.returnLoan,
    onSuccess: async (loan) => {
      if (loan.overdueDays > 0) {
        toast.success(`Returned with a ${formatPkr(loan.fineAmount)} overdue fine posted to fees`);
      } else {
        toast.success("Book marked returned");
      }
      await queryClient.invalidateQueries({ queryKey: ["library-books", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["library-loans", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["fees", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to return book")),
  });

  const bookColumns: DataTableColumn<LibraryBook>[] = [
    { key: "title", header: "Title", cell: (row) => row.title },
    { key: "author", header: "Author", cell: (row) => row.author },
    { key: "isbn", header: "ISBN", cell: (row) => row.isbn },
    { key: "category", header: "Category", cell: (row) => row.category },
    {
      key: "stock",
      header: "Stock",
      cell: (row) => (
        <span className={row.availableCopies === 0 ? "font-medium text-deep-navy" : undefined}>
          {row.availableCopies} / {row.totalCopies}
        </span>
      ),
    },
  ];

  const loanColumns: DataTableColumn<BookLoan>[] = [
    { key: "student", header: "Student", cell: (row) => row.student?.fullName ?? "—" },
    { key: "book", header: "Title", cell: (row) => row.book?.title ?? "—" },
    { key: "due", header: "Due", cell: (row) => formatDate(row.dueDate) },
    {
      key: "status",
      header: "Status",
      cell: (row) => <LoanStatusBadge status={row.status} />,
    },
    {
      key: "fine",
      header: "Fine alert",
      cell: (row) =>
        row.status === "OVERDUE" ? (
          <span className="text-sm font-medium text-deep-navy">Overdue — fine will post on return</span>
        ) : (
          "—"
        ),
    },
    {
      key: "action",
      header: "",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          disabled={returnMutation.isPending}
          onClick={() => returnMutation.mutate(row.id)}
        >
          Mark returned
        </Button>
      ),
    },
  ];

  function onSaveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    upsertMutation.mutate({
      isbn: bookForm.isbn,
      title: bookForm.title,
      author: bookForm.author,
      category: bookForm.category,
      totalCopies: Number(bookForm.totalCopies),
    });
  }

  function onIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    issueMutation.mutate({
      bookId: issueForm.bookId,
      studentId: issueForm.studentId,
      dueDate: `${issueForm.dueDate}T16:00:00.000Z`,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose an active campus from the header to manage the library."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Library"
        description="Catalog copies, check out titles, and post overdue fines to student fees."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIssueOpen(true)}>
              Check out
            </Button>
            {canEdit ? (
              <Button onClick={() => setBookOpen(true)}>
                <CirclePlus className="size-5" strokeWidth={1.75} />
                Add book
              </Button>
            ) : null}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="bg-cloud/60">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="loans">Active loans</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "catalog" ? (
        <>
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden
            />
            <Input
              id="library-search"
              type="search"
              placeholder="ISBN, title, author, or category"
              aria-label="Search books"
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {booksQuery.isLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <DataTable
              columns={bookColumns}
              data={booksQuery.data ?? []}
              rowKey={(row) => row.id}
              empty="No books match this search."
            />
          )}
        </>
      ) : loansQuery.isLoading ? (
        <TableSkeleton rows={6} />
      ) : activeLoans.length === 0 ? (
        <EmptyHint
          icon={BookOpen}
          title="No active loans"
          description="Issue a title from catalog check-out to start tracking returns."
        />
      ) : (
        <DataTable columns={loanColumns} data={activeLoans} rowKey={(row) => row.id} />
      )}

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <form onSubmit={onSaveBook} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Add or update book</DialogTitle>
              <DialogDescription>Use the same ISBN to update copies for this campus.</DialogDescription>
            </DialogHeader>
            <Input
              id="book-isbn"
              label="ISBN"
              required
              value={bookForm.isbn}
              onChange={(event) => setBookForm((current) => ({ ...current, isbn: event.target.value }))}
            />
            <Input
              id="book-title"
              label="Title"
              required
              value={bookForm.title}
              onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))}
            />
            <Input
              id="book-author"
              label="Author"
              required
              value={bookForm.author}
              onChange={(event) => setBookForm((current) => ({ ...current, author: event.target.value }))}
            />
            <Input
              id="book-category"
              label="Category"
              required
              value={bookForm.category}
              onChange={(event) => setBookForm((current) => ({ ...current, category: event.target.value }))}
            />
            <Input
              id="book-copies"
              label="Total copies"
              required
              type="number"
              min={1}
              value={bookForm.totalCopies}
              onChange={(event) =>
                setBookForm((current) => ({ ...current, totalCopies: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving…" : "Save book"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <form onSubmit={onIssue} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Check out</DialogTitle>
              <DialogDescription>Issue a copy to a student with a return due date.</DialogDescription>
            </DialogHeader>
            <Field id="issue-student" label="Student">
            <Select
              value={issueForm.studentId || undefined}
              onValueChange={(value) => setIssueForm((current) => ({ ...current, studentId: value }))}
            >
              <SelectTrigger id="issue-student" className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {(studentsQuery.data ?? []).map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName} · {student.rollNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Field id="issue-book" label="Book">
            <Select
              value={issueForm.bookId || undefined}
              onValueChange={(value) => setIssueForm((current) => ({ ...current, bookId: value }))}
            >
              <SelectTrigger id="issue-book" className="w-full">
                <SelectValue placeholder="Select book" />
              </SelectTrigger>
              <SelectContent>
                {availableBooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} · {book.availableCopies} left
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </Field>
            <Input
              id="issue-due"
              label="Due date"
              required
              type="date"
              min={todayKey()}
              value={issueForm.dueDate}
              onChange={(event) => setIssueForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={issueMutation.isPending || !issueForm.studentId || !issueForm.bookId}
              >
                {issueMutation.isPending ? "Issuing…" : "Issue book"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
