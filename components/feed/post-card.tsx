import { Post, Tag, User } from "@/lib/types"

export function PostCard ({
    post,
    author,
    tagsBySlug,
    score,
    userVote,
}: {
    post: Post,
    author: User,
    tagsBySlug: Map<string, Tag>
    score: number,
    userVote: -1 | 0 | 1
}) {
    return(
        <div>
            PostCard
        </div>
    )
}