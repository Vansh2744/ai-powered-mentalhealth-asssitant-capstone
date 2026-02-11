import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./sidebar/AppSidebar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger className="absolute" />
      </main>
      <Outlet />
    </SidebarProvider>
  );
}

export default Layout;
