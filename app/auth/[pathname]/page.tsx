import { AuthView } from "@neondatabase/auth/react";


export default async function AuthPage({ params }: {
    params: Promise<{pathname: string}>
}) {
    const { pathname } = await params;

    return(
        <div className="flex flex-col justify-center items-center min-h-[100dvh] w-full px-4 py-8">
            <div className="w-full max-w-md">
                <AuthView pathname={pathname}/>
            </div>
        </div>
    )
}