import {
  MessageCircle,
  Phone,
  Leaf,
  History,
  Settings,
  Heart,
  LogOutIcon,
  PhoneCall,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "../context/userContext";

const items = [
  {
    title: "Chat",
    url: "/chat/",
    icon: MessageCircle,
  },
  {
    title: "Therapist",
    url: "/therapy/",
    icon: Phone,
  },
  {
    title: "Exercises",
    url: "/exercise/",
    icon: Leaf,
  },
  {
    title: "History",
    url: "/history/",
    icon: History,
  },
  {
    title: "Attended Sessions",
    url: "/attended-sessions/",
    icon: PhoneCall,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div
              className="flex items-center gap-3 mb-8 mt-10 hover: cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">MindfulAI</h1>
                <p className="text-xs text-muted-foreground">Mental Wellness</p>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-10">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
