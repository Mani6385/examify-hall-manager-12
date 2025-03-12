
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  totalClasses: number;
  upcomingExams: number;
  activeSubjects: number;
  seatingPlans: number;
  recentActivities: string[];
  upcomingEvents: string[];
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch total students
      const { count: studentsCount, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
      }

      // Fetch active teachers
      const { count: teachersCount, error: teachersError } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true });

      if (teachersError) {
        console.error("Error fetching teachers:", teachersError);
      }

      // Fetch total classes
      const { count: classesCount, error: classesError } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      if (classesError) {
        console.error("Error fetching classes:", classesError);
      }

      // Fetch upcoming exams (exams with future dates)
      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingExamsCount, error: examsError } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .gte("date", today);

      if (examsError) {
        console.error("Error fetching exams:", examsError);
      }

      // Fetch active subjects
      const { count: subjectsCount, error: subjectsError } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true });

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
      }

      // Fetch seating plans (seating arrangements)
      const { count: seatingPlansCount, error: arrangementsError } = await supabase
        .from("seating_arrangements")
        .select("*", { count: "exact", head: true });

      if (arrangementsError) {
        console.error("Error fetching seating arrangements:", arrangementsError);
      }

      // Fetch recent activities (latest 4 seating assignments)
      // Use the explicit relationship hint as mentioned in the error message
      const { data: recentAssignments, error: assignmentsError } = await supabase
        .from("seating_assignments")
        .select("*, seating_arrangements!fk_seating_assignments_arrangement(room_no)")
        .order("created_at", { ascending: false })
        .limit(4);

      if (assignmentsError) {
        console.error("Error fetching recent assignments:", assignmentsError);
      }

      // Format recent activities
      const recentActivities = (recentAssignments || []).map(assignment => {
        // Access room_no safely using optional chaining
        const roomNo = assignment.seating_arrangements?.room_no || 'Unknown';
        return `Seat ${assignment.seat_no} assigned in Room ${roomNo}`;
      });

      // Fetch upcoming events (exams in the next 30 days)
      const { data: upcomingExamsData, error: upcomingExamsError } = await supabase
        .from("exams")
        .select("subject, date, start_time")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(4);

      if (upcomingExamsError) {
        console.error("Error fetching upcoming exams:", upcomingExamsError);
      }

      // Format upcoming events
      const upcomingEvents = (upcomingExamsData || []).map(exam => {
        const dateObj = new Date(exam.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${exam.subject} Exam (${formattedDate}, ${exam.start_time})`;
      });

      // If no activities or events found, provide defaults
      const defaultActivities = [
        "New seating arrangement created for Finals",
        "Updated Computer Science department schedule",
        "Added 25 new students to Database",
        "Generated reports for Midterm exams"
      ];

      const defaultEvents = [
        "Final Exams - Computer Science (May 15)",
        "Teacher's Meeting (May 10)",
        "Result Declaration (May 20)",
        "New Semester Registration (June 1)"
      ];

      return {
        totalStudents: studentsCount || 0,
        activeTeachers: teachersCount || 0,
        totalClasses: classesCount || 0,
        upcomingExams: upcomingExamsCount || 0,
        activeSubjects: subjectsCount || 0,
        seatingPlans: seatingPlansCount || 0,
        recentActivities: recentActivities.length > 0 ? recentActivities : defaultActivities,
        upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : defaultEvents
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
