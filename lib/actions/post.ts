'use server'
import { revalidatePath } from "next/cache";
import { getCurretUserId } from "../auth";
import { getUserVote } from "../db/queries";
import { prisma } from "../prisma";

export async function votePostAction( postId: string, value: -1 | 1) {
    const userId = await getCurretUserId();

    if (!userId) {
        return { error: "Sign in to vote." };
    }

    await votePost(userId, postId, value);
    revalidatePath("/");
    revalidatePath(`/post/${postId}`);
}

export async function votePost(
    userId: string,
    postId: string,
    value: -1 | 1,
): Promise<void> {
    const current = await getUserVote(userId, "post", postId);
    // its the value we want to vote for
    let next: -1 | 0 | 1 = value;
    
    // if we voted before and we press again for vote then it checks
    // 1. The user upvotes for the first time
    // 2. The user clicks upvote again
    // 3. The user changes their mind 
    if (current === value) next = 0;

    await prisma.vote.deleteMany({
        where: {
            userId,
            targetType: "post",
            targetId: postId,
        },
    });

    if (next !== 0) {
        await prisma.vote.create({
            data: {
                userId,
                targetType: "post",
                targetId: postId,
                value: next,
            },
        });
    }
}