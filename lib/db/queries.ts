import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import { FeedSort, Post } from "../types";

export type FeedPostRow = {
  post: Post;
  score: number;
  userVote: -1 | 0 | 1;
};

export async function listPostsSorted(
  sort: FeedSort,
  tagFilter: string | undefined,
  userId: string | undefined,
) {
  // If a tag filter exists, only return posts that contain that tag.
  // Otherwise return all posts.
  const where = tagFilter
    ? { postTags: { some: { tagSlug: tagFilter.toLowerCase() } } }
    : undefined;
  const postRows = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  
  // Extract all fetched post IDs.
  // These IDs will be used to load related data
  // (tags, votes, comments, etc.).
  const ids = postRows.map((p) => p.id);
  if (ids.length === 0) return [];

  // if their is posts get (whether user voted the post, get the total sum of the posts, get total amount of comments from the post and also tags of the posts)
  const [tagMap] = await Promise.all([tagForPosts(ids)]);

  const mapped = postRows.map((row) => {
    const slugs = tagMap.get(row.id) ?? [];
    return {
      post: mapPostRow(row, slugs, 65),
      voteScore: 2,
      created: row.createdAt.getTime(),
      userVote: 1,
    };
  });

  if (sort === "new") {
    mapped.sort((a, b) => b.created - a.created);
  } else if (sort === "top") {
    mapped.sort(
      (a, b) =>
        b.voteScore - a.voteScore ||
        b.post.commentCount - a.post.commentCount ||
        b.created - a.created,
    );
  } else {
    mapped.sort((a, b) => {
      const hotB = b.voteScore + 2 * b.post.commentCount;
      const hotA = a.voteScore + 2 * a.post.commentCount;
      return hotB - hotA || b.created - a.created;
    });
  }

  return mapped.map((x) => ({
    post: x.post,
    score: x.voteScore,
    userVote: x.userVote
  }))
}

async function tagForPosts(postIds: string[]) {
  // purpose of this function is to load all the tags for given post id's

  //     Key (string)        Value (string[])
  // -------------------------------------
  // "p1"               ->     ["react", "nextjs"]
  // "p2"               ->     ["typescript"]
  // "p3"               ->     []

  // we get list of Id's where tagSlug = "react"
  // Create map for all of these Id's
  const m = new Map<string, string[]>();
  if (postIds.length === 0) return m;

  // get the tagSlugs for the post id's
  const rows = await prisma.postTag.findMany({
    where: { postId: { in: postIds } },
  });

  // here we create empty string[] for all the postids we get
  for (const pid of postIds) m.set(pid, []);

  // traverse the rows and create tag's mapping for each posts
  for (const r of rows) {
    const list = m.get(r.postId) ?? [];
    list.push(r.tagSlug);
    m.set(r.postId, list);
  }
  return m;
}

function mapPostRow(
  row: PostModel,
  tagSlugs: string[],
  commentCount: number,
): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    tagSlugs,
    createdAt: row.createdAt.toISOString(),
    commentCount,
  };
}
