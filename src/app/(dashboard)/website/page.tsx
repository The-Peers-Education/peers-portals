"use client";

import { GalleryEditor } from "@/components/website/GalleryEditor";
import { NewsEditor } from "@/components/website/NewsEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WebsitePage() {
  return (
    <PageShell>
      <PageHeader
        title="Website"
        description="Write the news and upload the photos that appear on the public site. Sample stories and gallery pictures stay up until you publish your own."
      />
      <Tabs defaultValue="gallery">
        <TabsList>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>
        <TabsContent value="gallery" className="pt-4">
          <GalleryEditor />
        </TabsContent>
        <TabsContent value="news" className="pt-4">
          <NewsEditor />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
