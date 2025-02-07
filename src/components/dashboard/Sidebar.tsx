
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  ClipboardList,
  Table,
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
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Students", icon: Users, path: "/students" },
  { title: "Teachers", icon: UserCog, path: "/teachers" },
  { title: "Classes", icon: BookOpen, path: "/classes" },
  { title: "Subjects", icon: GraduationCap, path: "/subjects" },
  { title: "Exams", icon: CalendarDays, path: "/exams" },
  { title: "Seating", icon: Table, path: "/seating" },
  { title: "Reports", icon: ClipboardList, path: "/reports" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
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
