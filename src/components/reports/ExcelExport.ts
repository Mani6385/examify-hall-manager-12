
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

  // For each arrangement, create a detailed worksheet
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

  // Create a seating layout visualization sheet for each room
  arrangements.forEach(arrangement => {
    // Create a 2D grid for the seating layout
    const rows = arrangement.rows;
    const cols = arrangement.columns;
    const seatingGrid = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(""));
    
    // Add column headers (1, 2, 3...)
    for (let col = 1; col <= cols; col++) {
      seatingGrid[0][col] = col.toString();
    }
    
    // Add row headers (A, B, C...)
    for (let row = 1; row <= rows; row++) {
      seatingGrid[row][0] = String.fromCharCode(64 + row);
    }
    
    // Fill in student data
    arrangement.seating_assignments.forEach(assignment => {
      const seatNo = assignment.seat_no;
      const rowChar = seatNo.charAt(0);
      const rowIndex = rowChar.charCodeAt(0) - 64; // Convert A->1, B->2, etc.
      const colIndex = parseInt(seatNo.substring(1));
      
      if (rowIndex > 0 && rowIndex <= rows && colIndex > 0 && colIndex <= cols) {
        seatingGrid[rowIndex][colIndex] = assignment.reg_no || "X";
      }
    });
    
    // Create worksheet from seating grid
    const layoutWs = XLSX.utils.aoa_to_sheet(seatingGrid);
    
    // Set column widths
    layoutWs['!cols'] = Array(cols + 1).fill(null).map(() => ({ wch: 12 }));
    
    // Add title
    XLSX.utils.sheet_add_aoa(layoutWs, [
      ["EXAMINATION SEATING LAYOUT"],
      [`Room ${arrangement.room_no} (Floor ${arrangement.floor_no})`],
      []
    ], { origin: { r: -3, c: 0 } });
    
    // Add layout worksheet to workbook
    XLSX.utils.book_append_sheet(wb, layoutWs, `Layout R${arrangement.room_no}`);
  });

  // Save the file
  XLSX.writeFile(wb, `seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
};
