"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { apiAssetUrl, cmsApi } from "@/lib/api";
import { controlField, focusField } from "@/lib/styles";
import { cn, getErrorMessage } from "@/lib/utils";
import type { CmsNewsArticle } from "@/types";
import { readImageFile } from "@/components/website/read-image";

type Draft = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  publishedOn: string;
  published: boolean;
  file: File | null;
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): Draft {
  return {
    title: "",
    excerpt: "",
    body: "",
    category: "Events",
    publishedOn: todayIso(),
    published: true,
    file: null,
  };
}

export function NewsEditor() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<CmsNewsArticle | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const newsQuery = useQuery({ queryKey: ["cms-news"], queryFn: cmsApi.news });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditing(null);
    setDraft(emptyDraft());
    setFileKey((value) => value + 1);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: draft.title,
        excerpt: draft.excerpt,
        body: draft.body,
        category: draft.category,
        publishedOn: draft.publishedOn,
        published: draft.published,
      };
      if (editing) {
        const dataBase64 = draft.file ? await readImageFile(draft.file) : undefined;
        return cmsApi.updateNews(editing.id, { ...payload, dataBase64 });
      }
      if (!draft.file) throw new Error("Add a photo for this story");
      return cmsApi.createNews({ ...payload, dataBase64: await readImageFile(draft.file) });
    },
    onSuccess: async () => {
      toast.success(editing ? "Story saved" : "Story published");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["cms-news"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save that story")),
  });

  const deleteMutation = useMutation({
    mutationFn: cmsApi.removeNews,
    onSuccess: async (_result, id) => {
      toast.success("Story removed");
      if (editing?.id === id) resetForm();
      await queryClient.invalidateQueries({ queryKey: ["cms-news"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not remove that story")),
  });

  const stories = newsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <form
        className="grid gap-4 rounded-[12px] border border-deep-navy/10 bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-deep-navy">
            {editing ? "Edit story" : "New story"}
          </h2>
          {editing ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="news-title" label="Title">
            <Input id="news-title" value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Independence Day Assembly" />
          </Field>
          <Field id="news-date" label="Date">
            <Input id="news-date" type="date" value={draft.publishedOn} onChange={(event) => update("publishedOn", event.target.value)} />
          </Field>
          <Field id="news-category" label="Category" hint="Events, Academics, Sports, Admissions, or School life.">
            <Input id="news-category" value={draft.category} onChange={(event) => update("category", event.target.value)} list="news-categories" />
            <datalist id="news-categories">
              <option value="Events" />
              <option value="Academics" />
              <option value="Sports" />
              <option value="Admissions" />
              <option value="School life" />
            </datalist>
          </Field>
          <Field id="news-photo" label="Photo" hint={editing ? "Leave empty to keep the current photo." : "JPG, PNG, or WebP. 4 MB maximum."}>
            <Input
              key={fileKey}
              id="news-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => update("file", event.target.files?.[0] ?? null)}
            />
          </Field>
        </div>
        <Field id="news-excerpt" label="Summary" hint="The short text on the card.">
          <textarea
            id="news-excerpt"
            value={draft.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
            className={cn(controlField, focusField, "!h-auto min-h-24 py-3")}
          />
        </Field>
        <Field id="news-body" label="Full story" hint="Shown when a visitor chooses Read more. Blank lines start a new paragraph.">
          <textarea
            id="news-body"
            value={draft.body}
            onChange={(event) => update("body", event.target.value)}
            className={cn(controlField, focusField, "!h-auto min-h-40 py-3")}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-deep-navy">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) => update("published", event.target.checked)}
          />
          Published on the website
        </label>
        <div>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : editing ? "Save story" : "Publish story"}
          </Button>
        </div>
      </form>

      {newsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stories…</p>
      ) : stories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No stories yet. The website keeps its sample news until you publish the first one.
        </p>
      ) : (
        <ul className="grid gap-4">
          {stories.map((story) => (
            <li key={story.id} className="grid gap-4 rounded-[12px] border border-deep-navy/10 bg-white p-4 sm:grid-cols-[180px_1fr] sm:p-5">
              <img
                src={apiAssetUrl(story.imagePath)}
                alt=""
                className="aspect-[16/10] w-full rounded-[10px] object-cover"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
                  {story.category} · {story.date}
                  {story.published ? "" : " · Draft"}
                </p>
                <h3 className="font-display text-xl font-semibold text-deep-navy">{story.title}</h3>
                <p className="text-sm text-muted-foreground">{story.excerpt}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(story);
                      setDraft({
                        title: story.title,
                        excerpt: story.excerpt,
                        body: story.body,
                        category: story.category,
                        publishedOn: story.publishedOn,
                        published: story.published,
                        file: null,
                      });
                      setFileKey((value) => value + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove “${story.title}” from the website?`)) {
                        deleteMutation.mutate(story.id);
                      }
                    }}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
