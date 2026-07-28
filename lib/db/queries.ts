import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import { FeedSort, Post, Tag, User } from "../types";

export async function listTags(): Promise<Tag[]> {
  const rows = await prisma.tag.findMany({
    orderBy: {
      slug: "asc"
    }
  })
  return rows.map((t) => ({
    slug: t.slug,
    label: t.label,
    hashColor: t.hashColor
  }))
}
export async function batchAuthorIds(
  authorIds: string[],
): Promise<Map<string, User>> {
  const unique = [...new Set(authorIds)];
  if(unique.length === 0) return new Map();

  const rows = await prisma.userProfile.findMany({
    where: { id: {in: unique} }
  })

  const result = new Map<string, User>();

  for (const row of rows) {
    result.set(row.id, { id: row.id, username: row.username })
  }

  for (const id of unique) {
    if(!result.has(id)) {
      result.set(id, { id, username: `user_${id.slice(0,6)}` })
    }
  }

  return result;
}

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
  const [tagMap, ccMap, vsMap, uvMap] = await Promise.all([
    tagForPosts(ids),
    commentsCountsForPosts(ids),
    voteSumsForPosts(ids),
    userVotesForPosts(userId, ids)
  ]);

  const mapped = postRows.map((row) => {
    const slugs = tagMap.get(row.id) ?? [];
    const cc = ccMap.get(row.id) ?? 0;
    const vs = vsMap.get(row.id) ?? 0;
    return {
      post: mapPostRow(row, slugs, cc),
      voteScore: vs,
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

async function commentsCountsForPosts(
  postIds: string[]
): Promise<Map<string, number>> {
  if(postIds.length === 0) return new Map();

  const rows = await prisma.comment.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds }},
    _count: { _all: true }
  })

  const m = new Map<string, number>();
  for(const r of rows) {
    m.set(r.postId, r._count._all)
  }

  return m;
}

async function voteSumsForPosts(
  postIds: string[]
): Promise<Map<string, number>>{
  if(postIds.length === 0) return new Map();

  const rows = await prisma.vote.groupBy({
    by: ["targetId"],
    where: {
      targetType: "post",
      targetId: { in: postIds }
    },
    _sum: { value: true }
  })

  const m = new Map<string,number>();
  for(const r of rows){
    m.set(r.targetId, Number(r._sum.value ?? 0));
  }

  return m;
}

async function userVotesForPosts(
  userId: string | undefined,
  postIds: string[]
) {
  const m = new Map<string, -1 | 0 | 1>();
  if(!userId || postIds.length === 0) return m;

  const rows = await prisma.vote.findMany({
    where: {
      userId,
      targetType: "post",
      targetId: { in: postIds }
    },
  });

  for(const r of rows){
    const v = r.value;
    m.set(r.targetId, v === -1 || v === 1 ? v : 0);
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
