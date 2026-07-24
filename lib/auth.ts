import { createNeonAuth } from "@neondatabase/auth/next/server";
import { cache } from "react";


export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!
    }
})

export const getCurretUserId = cache(async(): Promise<string | undefined> => {
    const { data: session } = await auth.getSession();
    return session?.user.id
})