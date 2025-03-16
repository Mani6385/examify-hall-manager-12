
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  ClipboardList,
  Table,
  UserCheck,
  ChevronRight,
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
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Students", icon: Users, path: "/students" },
  { title: "Teachers", icon: UserCog, path: "/teachers" },
  { title: "Classes", icon: BookOpen, path: "/classes" },
  { title: "Subjects", icon: GraduationCap, path: "/subjects" },
  { title: "Exams", icon: CalendarDays, path: "/exams" },
  { title: "Exam Attendance", icon: UserCheck, path: "/exam-attendance" },
  { title: "Seating", icon: Table, path: "/seating" },
  { title: "Reports", icon: ClipboardList, path: "/reports" },
];

export function AppSidebar() {
  const location = useLocation();
  
  return (
    <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-sm">
      <SidebarContent>
        <div className="py-4 px-6 mb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ExamSeats
              </h2>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 px-6">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`${
                        isActive
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border-r-2 border-indigo-600"
                          : "text-gray-600 hover:bg-gray-50"
                      } transition-all duration-200 group`}
                    >
                      <Link to={item.path} className="flex items-center gap-3 py-2 px-6">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-900"}`} />
                        <span className="font-medium text-sm">{item.title}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="px-6 py-4 mt-auto">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 border border-indigo-100">
            <p className="text-xs text-gray-600 mb-2 font-medium">Upcoming Exams</p>
            <div className="text-xs text-gray-500">
              <p className="mb-1">• Final Exams: June 15</p>
              <p className="mb-1">• Midterms: April 10</p>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
