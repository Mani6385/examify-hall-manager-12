
import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';
import { toast } from '@/components/ui/use-toast';

export const generateExcelReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
  try {
    // Check if we have arrangements data
    if (!arrangements || arrangements.length === 0) {
      console.error("No seating arrangements data available for Excel export");
      toast({
        title: "Error",
        description: "No seating arrangements data available for export",
        variant: "destructive",
      });
      return;
    }

    const wb = XLSX.utils.book_new();
    const hallName = getHallNameById(hallId);
    
    // Create a summary worksheet
    const summaryData = arrangements.map((arrangement, index) => {
      // Count students by department
      const deptCounts: Record<string, number> = {};
      arrangement.seating_assignments.forEach(assignment => {
        const dept = assignment.department || 'Unassigned';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      
      // Format department counts
      const deptCountStr = Object.entries(deptCounts)
        .map(([dept, count]) => `${dept}: ${count}`)
        .join('\n');
      
      return {
        "S.No": index + 1,
        "Room No": arrangement.room_no,
        "Floor": arrangement.floor_no,
        "Capacity": `${arrangement.rows} × ${arrangement.columns}`,
        "Total Seats": arrangement.rows * arrangement.columns,
        "Assigned Seats": arrangement.seating_assignments.length,
        "Occupancy %": Math.round((arrangement.seating_assignments.length / (arrangement.rows * arrangement.columns)) * 100),
        "Departments": deptCountStr
      };
    });

    // Create summary worksheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    
    // Set column widths
    summaryWs['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 9 },   // Room No
      { wch: 6 },   // Floor
      { wch: 10 },  // Capacity
      { wch: 12 },  // Total Seats
      { wch: 14 },  // Assigned Seats
      { wch: 12 },  // Occupancy %
      { wch: 40 },  // Departments
    ];

    // Add title to summary sheet
    XLSX.utils.sheet_add_aoa(summaryWs, [
      ["EXAMINATION SEATING PLAN"],
      [`${hallName} - SUMMARY`],
      []
    ], { origin: "A1" });

    // Add summary worksheet to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    // For each arrangement, create a detailed worksheet with students
    arrangements.forEach(arrangement => {
      // Create data for detailed student list
      const detailedData = arrangement.seating_assignments
        .sort((a, b) => {
          // Extract the prefix and number
          const aPrefix = a.seat_no.charAt(0);
          const bPrefix = b.seat_no.charAt(0);
          
          // Extract numeric part
          const aNum = parseInt(a.seat_no.substring(1));
          const bNum = parseInt(b.seat_no.substring(1));
          
          // First sort by number
          if (aNum !== bNum) {
            return aNum - bNum;
          }
          
          // Then sort by prefix
          return aPrefix.localeCompare(bPrefix);
        })
        .map((assignment, index) => ({
          "S.No": index + 1,
          "Seat No": assignment.seat_no,
          "Student Name": assignment.student_name || 'Unassigned',
          "Registration No": assignment.reg_no || 'N/A',
          "Department": assignment.department || 'N/A'
        }));

      // Skip if no assignments
      if (detailedData.length === 0) return;

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(detailedData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 10 }, // Seat No
        { wch: 30 }, // Student Name
        { wch: 20 }, // Registration No
        { wch: 20 }, // Department
      ];

      // Add title
      XLSX.utils.sheet_add_aoa(ws, [
        ["EXAMINATION SEATING PLAN"],
        [`Room ${arrangement.room_no} (Floor ${arrangement.floor_no}) - Student Assignments`],
        [`Total Capacity: ${arrangement.rows} × ${arrangement.columns} = ${arrangement.rows * arrangement.columns} seats`],
        [`Assigned: ${arrangement.seating_assignments.length} seats (${Math.round((arrangement.seating_assignments.length / (arrangement.rows * arrangement.columns)) * 100)}% occupancy)`],
        []
      ], { origin: "A1" });

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Room ${arrangement.room_no}`);
    });

    // Save the file with a timestamp to avoid caching issues
    const timestamp = new Date().getTime();
    XLSX.writeFile(wb, `seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.xlsx`);
    
    // Show success message
    toast({
      title: "Success",
      description: `Excel report for ${hallName} generated successfully`,
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    toast({
      title: "Error",
      description: "Failed to generate Excel report. Please try again.",
      variant: "destructive",
    });
  }
};
