
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle-improved">
        <AppSidebar />
        <main className="flex-1 p-6 sm:p-8 animate-fadeIn overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <SidebarTrigger className="mr-4 hover:bg-white/80 rounded-lg transition-colors" />
              <div className="h-6 w-[1px] bg-gray-200 mr-4 hidden sm:block" />
              <h1 className="text-xl font-medium text-gradient hidden sm:block">Exam Hall Management</h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 print:p-0 print:bg-white print:shadow-none print:border-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
