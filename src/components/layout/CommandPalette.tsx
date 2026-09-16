"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { studentsApi } from "@/lib/api";
import { NAV_ITEMS } from "@/lib/nav";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import type { Student } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommandPaletteContextValue {
  openPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  openPalette: () => undefined,
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ openPalette }}>
      {children}
      <CommandPaletteDialog open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

function CommandPaletteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  const pages = useMemo(
    () =>
      NAV_ITEMS.filter((item) => user?.role && item.roles.includes(user.role)).map((item) => ({
        ...item,
        label: item.path === "/profile" ? "Profile" : item.label,
      })),
    [user?.role],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setStudents([]);
    }
  }, [open]);

  useEffect(() => {
    const search = query.trim();
    if (!open || search.length < 2) {
      setStudents([]);
      return;
    }

    const handle = window.setTimeout(() => {
      void studentsApi
        .list({ search })
        .then((rows) => setStudents(rows.slice(0, 8)))
        .catch(() => setStudents([]));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  function go(path: string) {
    if (!user?.role) return;
    onOpenChange(false);
    router.push(portalPath(user.role, path));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4 pr-12">
          <DialogTitle>Jump to</DialogTitle>
          <DialogDescription>Open a module or a student record.</DialogDescription>
        </DialogHeader>
        <Command className="flex flex-col" shouldFilter label="Command palette">
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Jump to a page or student"
            className="mx-4 mb-2 h-12 rounded-[10px] border border-deep-navy/15 bg-white px-4 text-base text-ink outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto px-2 pb-3">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching page or student.
            </Command.Empty>
            <Command.Group heading="Pages" className="px-1 text-xs font-medium text-muted-foreground">
              {pages.map((item) => (
                <Command.Item
                  key={item.path}
                  value={`${item.label} ${item.path}`}
                  onSelect={() => go(item.path)}
                  className="flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-deep-navy data-[selected=true]:bg-cloud"
                >
                  <item.icon className="size-5 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
            {students.length > 0 ? (
              <Command.Group
                heading="Students"
                className="px-1 text-xs font-medium text-muted-foreground"
              >
                {students.map((student) => (
                  <Command.Item
                    key={student.id}
                    value={`${student.fullName} ${student.rollNumber} ${student.classSection}`}
                    onSelect={() => go(`/students/${student.id}`)}
                    className="flex cursor-pointer flex-col items-start rounded-[10px] px-3 py-2 text-sm text-deep-navy data-[selected=true]:bg-cloud"
                  >
                    <span className="font-medium">{student.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {student.rollNumber} · {student.classSection}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
