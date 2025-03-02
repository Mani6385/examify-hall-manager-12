
import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';

export const generateExcelReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
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
      .sort((a, b) => a.seat_no.localeCompare(b.seat_no))
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

  // Save the file
  XLSX.writeFile(wb, `seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
};
