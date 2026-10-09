"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { apiAssetUrl, cmsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { GalleryCategoryName, HomepageAlbum } from "@/types";
import { readImageFile } from "@/components/website/read-image";

const CATEGORIES: Array<{ id: GalleryCategoryName; label: string; hint: string }> = [
  { id: "RESULTS", label: "Results", hint: "Shown on the homepage while Results is selected." },
  { id: "CAMPUS", label: "Campus", hint: "Gallery. Also the homepage when Campus life is selected." },
  { id: "EVENTS", label: "Events", hint: "Gallery page." },
  { id: "SPORTS", label: "Sports", hint: "Gallery page." },
  { id: "ACADEMICS", label: "Academics", hint: "Gallery page." },
];

export function GalleryEditor() {
  const queryClient = useQueryClient();
  const [alt, setAlt] = useState("");
  const [category, setCategory] = useState<GalleryCategoryName>("RESULTS");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const photosQuery = useQuery({ queryKey: ["cms-gallery"], queryFn: cmsApi.gallery });
  const settingsQuery = useQuery({ queryKey: ["cms-settings"], queryFn: cmsApi.settings });
  const album = settingsQuery.data?.homepageAlbum ?? "RESULTS";

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cms-gallery"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a photo");
      const dataBase64 = await readImageFile(file);
      return cmsApi.addPhoto({ alt, category, dataBase64 });
    },
    onSuccess: async () => {
      toast.success("Photo added");
      setAlt("");
      setFile(null);
      setFileKey((value) => value + 1);
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not add that photo")),
  });

  const albumMutation = useMutation({
    mutationFn: (homepageAlbum: HomepageAlbum) => cmsApi.saveSettings(homepageAlbum),
    onSuccess: async (settings) => {
      toast.success(settings.homepageAlbum === "CAMPUS" ? "Homepage now shows campus photos" : "Homepage now shows results");
      await queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update the homepage")),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      cmsApi.movePhoto(id, direction),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error, "Could not reorder that photo")),
  });

  const deleteMutation = useMutation({
    mutationFn: cmsApi.removePhoto,
    onSuccess: async () => {
      toast.success("Photo removed");
      await refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not remove that photo")),
  });

  const photos = photosQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[12px] border border-deep-navy/10 bg-white p-5">
        <Field id="homepage-album" label="Homepage photo grid" hint="Results for now. Switch to Campus life when those photos are ready.">
          <Select
            value={album}
            onValueChange={(value) => albumMutation.mutate(value as HomepageAlbum)}
            disabled={albumMutation.isPending || settingsQuery.isLoading}
          >
            <SelectTrigger id="homepage-album">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESULTS">Results</SelectItem>
              <SelectItem value="CAMPUS">Campus life</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </section>

      <form
        className="grid gap-4 rounded-[12px] border border-deep-navy/10 bg-white p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          addMutation.mutate();
        }}
      >
        <Field id="photo-alt" label="Description" hint="Shown if the photo cannot load, and as the caption.">
          <Input id="photo-alt" value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Matric result, 2026" />
        </Field>
        <Field id="photo-category" label="Album" hint={CATEGORIES.find((item) => item.id === category)?.hint}>
          <Select value={category} onValueChange={(value) => setCategory(value as GalleryCategoryName)}>
            <SelectTrigger id="photo-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="photo-file" label="Photo" hint="JPG, PNG, or WebP. 4 MB maximum." className="sm:col-span-2">
          <Input
            key={fileKey}
            id="photo-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={addMutation.isPending}>
            <ImagePlus />
            {addMutation.isPending ? "Uploading…" : "Add photo"}
          </Button>
        </div>
      </form>

      {photosQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet. The first ones you add replace the sample pictures on the site.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {CATEGORIES.map((group) => {
            const items = photos.filter((photo) => photo.category === group.id);
            if (items.length === 0) return null;
            return (
              <section key={group.id}>
                <h2 className="font-display text-xl font-semibold text-deep-navy">{group.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{group.hint}</p>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((photo, index) => (
                    <li key={photo.id} className="overflow-hidden rounded-[12px] border border-deep-navy/10 bg-white">
                      <img
                        src={apiAssetUrl(photo.imagePath)}
                        alt={photo.alt}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="flex flex-col gap-3 p-4">
                        <p className="text-sm text-deep-navy">{photo.alt}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === 0 || moveMutation.isPending}
                            onClick={() => moveMutation.mutate({ id: photo.id, direction: "up" })}
                          >
                            <ArrowUp />
                            Earlier
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === items.length - 1 || moveMutation.isPending}
                            onClick={() => moveMutation.mutate({ id: photo.id, direction: "down" })}
                          >
                            <ArrowDown />
                            Later
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm("Remove this photo from the website?")) {
                                deleteMutation.mutate(photo.id);
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
