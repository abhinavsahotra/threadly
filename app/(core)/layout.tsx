import LeftSidebar from "@/components/layout/left-sidebar";
import Navbar from "@/components/layout/navbar";

export default async function coreLayout( {children}: { children: React.ReactNode }) {
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