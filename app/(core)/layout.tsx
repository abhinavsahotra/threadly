import LeftSidebar from "@/components/layout/left-sidebar";
import Navbar from "@/components/layout/navbar";
import { getSessionUser } from "@/lib/auth";

export default async function coreLayout( {children}: { children: React.ReactNode }) {
    const user = await getSessionUser();
    
    return (
        <>
          <Navbar />
          <div className="">
          <LeftSidebar />
          <div>{children}</div>
          </div>
        </>
    )
}