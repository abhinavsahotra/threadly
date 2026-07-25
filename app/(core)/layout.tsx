import LeftSidebar from "@/components/layout/left-sidebar";
import Navbar from "@/components/layout/navbar";
import { getSessionUser } from "@/lib/auth";

export default async function coreLayout( {children}: { children: React.ReactNode }) {
    const user = await getSessionUser();

    return (
        <>
          <Navbar />
          <div className="mx-auto flex max-w-[1200px] gap-8 px-4 pb-16 pt-2">
          <LeftSidebar showCta={!user} />
          <div>{children}</div>
          </div>
        </>
    )
}