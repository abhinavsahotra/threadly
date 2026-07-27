import { FeedSortTabs } from "@/components/feed/feed-sort-tabs";
import { PostCard } from "@/components/feed/post-card";
import { getSessionUser } from "@/lib/auth";
import { batchAuthorIds, listPostsSorted } from "@/lib/db/queries";
import { FeedSort } from "@/lib/types";
import Image from "next/image";

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

  const authorIds = [...new Set(rows.map((r) => r.post.authorId))];
  const authorById = await batchAuthorIds(authorIds);
  if(sessionUser && authorById.has(sessionUser.id)) {
    authorById.set(sessionUser.id, sessionUser);
  }

  const cards = rows.map((row) => {
    const author = authorById.get(row.post.authorId);
    if (!author) return null;
    return <PostCard
               key={row.post.id}
               post={row.post}
               author={author}
               tagSlug={[]}
               score={row.score}
               userVote={row.userVote}
             />
  })

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
