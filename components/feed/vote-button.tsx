import { ChevronDown, ChevronUp } from "lucide-react";

type VoteTarget = "post" | "comment";



export function VoteButtons({
    target,
    targetId,
    score,
    userVote
}: {
    target: VoteTarget,
    targetId: string,
    score: number,
    userVote: -1 | 0 | 1
}) {
    return (
        <div>
            <button>
                <ChevronUp />
            </button>
            <span>{score}</span>
            <button>
                <ChevronDown />
            </button>
        </div>
    )
}