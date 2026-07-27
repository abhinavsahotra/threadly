import { FeedSortTabs } from "@/components/feed/feed-sort-tabs";
import { getSessionUser } from "@/lib/auth";
import { listPostsSorted } from "@/lib/db/queries";
import { FeedSort } from "@/lib/types";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ sort?: string, tag?: string }>;
}) {
  const sp = await searchParams;
  const sortRow = sp.sort;
  const sort: FeedSort = 
    sortRow === "new" || sortRow === "top" ? sortRow : "hot"
  
  const tagFilter = sp.tag?.toLowerCase();
  const sessionUser = await getSessionUser();
  const rows = await listPostsSorted(sort, tagFilter, sessionUser?.id);

  return (
    <div>
      <div>
        <FeedSortTabs />
        <div>
          {rows.length === 0 && (
            <p className="rounded-xl border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No posts match this filter
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
