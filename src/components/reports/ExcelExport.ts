import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears, getDepartmentsWithYears, generateConsolidatedReportData } from '@/utils/reportUtils';
import { toast } from '@/hooks/use-toast';

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
    
    // Create consolidated worksheet in the format shown in the image
    const consolidatedWs = createConsolidatedWorksheet(arrangements, hallName);
    XLSX.utils.book_append_sheet(wb, consolidatedWs, "Seating Plan");
    
    // Create a summary worksheet (keep the existing one)
    const summaryData = arrangements.map((arrangement, index) => {
      // Get formatted departments and years
      const deptYearsFormatted = formatDepartmentsWithYears(arrangement);
      
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
        "Departments & Years": deptYearsFormatted,
        "Department Counts": deptCountStr
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
      { wch: 40 },  // Departments & Years
      { wch: 40 },  // Department Counts
    ];

    // Add title to summary sheet
    XLSX.utils.sheet_add_aoa(summaryWs, [
      ["EXAMINATION SEATING PLAN"],
      [`${hallName} - SUMMARY`],
      []
    ], { origin: "A1" });

    // Add summary worksheet to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    // For each arrangement, create a detailed worksheet with students by department
    arrangements.forEach(arrangement => {
      // Create a worksheet for each room with department-wise organization
      const detailedWs = createDetailedRoomWorksheet(arrangement);
      XLSX.utils.book_append_sheet(wb, detailedWs, `Room ${arrangement.room_no}`);
      
      // Keep the visual seating grid worksheet
      const visualWs = createVisualSeatingGrid(arrangement);
      XLSX.utils.book_append_sheet(wb, visualWs, `Room ${arrangement.room_no} Grid`);
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

// Updated function to create consolidated worksheet with start-to-end reg numbers format
// and improved department/year display
function createConsolidatedWorksheet(arrangements: SeatingArrangement[], hallName: string): XLSX.WorkSheet {
  // Create empty worksheet
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add title and header
  XLSX.utils.sheet_add_aoa(ws, [
    ["Abc ARTS AND SCIENCE COLLEGE"],
    ["DEPARTMENT OF COMPUTER SCIENCE AND BCA"],
    [`SEATING PLAN(${new Date().toLocaleDateString()})`],
    [],
    ["S.NO", "ROOM NO", "CLASS", "YEAR", "SEATS", "TOTAL"]
  ], { origin: "A1" });
  
  // Use the new consolidated report data generator
  const consolidatedData = generateConsolidatedReportData(arrangements);
  
  // Prepare table data for the consolidated view
  const tableData: string[][] = [];
  
  // Process each room's data
  consolidatedData.forEach((roomData, roomIndex) => {
    if (roomData.departmentRows.length === 0) {
      // If no departments for this room, add a single row
      tableData.push([
        (roomIndex + 1).toString(),      // S.No
        roomData.room,                    // Room No
        "Not specified",                  // Class
        "N/A",                           // Year
        "",                               // Seats
        "0"                               // Total
      ]);
    } else {
      // Add rows for each department in this room
      roomData.departmentRows.forEach((deptRow) => {
        tableData.push([
          deptRow.isFirstDeptInRoom ? deptRow.rowIndex.toString() : '',  // S.No
          deptRow.isFirstDeptInRoom ? roomData.room : '',               // Room No
          deptRow.department,                                           // Class
          deptRow.year,                                                 // Year
          deptRow.regNumbers,                                           // Registration Numbers
          deptRow.isFirstDeptInRoom ? roomData.totalStudents.toString() : '' // Total
        ]);
      });
    }
    
    // Add an empty row between rooms for better readability
    if (roomIndex < consolidatedData.length - 1) {
      tableData.push(['', '', '', '', '', '']);
    }
  });
  
  // Add the data rows starting after the header
  XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A6" });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 6 },    // S.No
    { wch: 10 },   // Room No
    { wch: 20 },   // Class (Department)
    { wch: 12 },   // Year
    { wch: 60 },   // Seats (registration numbers)
    { wch: 10 },   // Total
  ];
  
  // Center align the titles
  for (let i = 1; i <= 3; i++) {
    const cell = XLSX.utils.encode_cell({ r: i-1, c: 0 });
    if (!ws[cell]) continue;
    if (!ws[cell].s) ws[cell].s = {};
    ws[cell].s.alignment = { horizontal: 'center' };
  }
  
  // Merge cells for titles
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },  // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },  // Department row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },  // Seating plan row
  ];
  
  return ws;
}

// Updated function to create detailed room worksheet with improved department and year display
function createDetailedRoomWorksheet(arrangement: SeatingArrangement): XLSX.WorkSheet {
  // Get formatted departments and years
  const deptYearsFormatted = formatDepartmentsWithYears(arrangement);
  
  // Group students by department
  const deptGroups = new Map<string, {students: any[], year: string | null}>();
  arrangement.seating_assignments.forEach(assignment => {
    const dept = assignment.department || 'Unassigned';
    
    // Find matching department config to get year information
    const deptConfig = arrangement.department_configs.find(
      config => config.department === dept
    );
    
    // Create key with department
    const key = dept;
    const year = deptConfig?.year || null;
    
    if (!deptGroups.has(key)) {
      deptGroups.set(key, {students: [], year});
    }
    deptGroups.get(key)?.students.push(assignment);
  });
  
  // Create empty worksheet
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add title
  XLSX.utils.sheet_add_aoa(ws, [
    ["EXAMINATION SEATING PLAN"],
    [`Room ${arrangement.room_no} - Department-wise Student Assignments`],
    [`Total Capacity: ${arrangement.rows} × ${arrangement.columns} = ${arrangement.rows * arrangement.columns} seats`],
    [`Assigned: ${arrangement.seating_assignments.length} seats (${Math.round((arrangement.seating_assignments.length / (arrangement.rows * arrangement.columns)) * 100)}% occupancy)`],
    [`Departments & Years: ${deptYearsFormatted}`],
    []
  ], { origin: "A1" });
  
  // Current row to add data
  let currentRow = 7;
  
  // Add each department section
  Array.from(deptGroups.entries()).forEach(([dept, {students, year}]) => {
    // Sort students by reg_no
    students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
    
    // Add department header with year
    const yearDisplay = year ? ` (${year})` : '';
    XLSX.utils.sheet_add_aoa(ws, [
      [`${dept}${yearDisplay}`]
    ], { origin: { r: currentRow, c: 0 } });
    currentRow++;
    
    // Add headers for student table
    XLSX.utils.sheet_add_aoa(ws, [
      ["S.No", "Seat No", "Registration No", "Student Name", "Year"]
    ], { origin: { r: currentRow, c: 0 } });
    currentRow++;
    
    // Add students
    students.forEach((student, index) => {
      XLSX.utils.sheet_add_aoa(ws, [
        [index + 1, student.seat_no, student.reg_no || 'N/A', student.student_name || 'Unassigned', year || 'N/A']
      ], { origin: { r: currentRow, c: 0 } });
      currentRow++;
    });
    
    // Add a blank row after each department
    XLSX.utils.sheet_add_aoa(ws, [
      ['']
    ], { origin: { r: currentRow, c: 0 } });
    currentRow++;
  });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 10 },  // Seat No
    { wch: 20 },  // Registration No
    { wch: 30 },  // Student Name
    { wch: 12 },  // Year
  ];
  
  return ws;
}

// Function to create a visual seating grid worksheet
function createVisualSeatingGrid(arrangement: SeatingArrangement): XLSX.WorkSheet {
  const rows = arrangement.rows;
  const columns = arrangement.columns;
  
  // Create empty worksheet
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add title
  XLSX.utils.sheet_add_aoa(ws, [
    ["EXAMINATION SEATING PLAN"],
    [`Room ${arrangement.room_no} (Floor ${arrangement.floor_no}) - Visual Seating Grid`],
    []
  ], { origin: "A1" });
  
  // Find all assignments for quick lookup
  const assignmentMap = new Map();
  arrangement.seating_assignments.forEach(assignment => {
    if (assignment.seat_no && assignment.seat_no.trim() !== '') {
      assignmentMap.set(assignment.seat_no, assignment);
    }
  });
  
  // Create the seating grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Calculate seat number
      const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
      const colLabel = col + 1;
      const seatNo = `${rowLabel}${colLabel}`;
      
      // Calculate cell position (add offset for title rows and to alternate cells)
      const cellRow = 4 + (row * 3); // 3 rows per grid cell
      const cellCol = col * 2; // 2 columns per grid cell
      
      // Get assignment for this seat
      const assignment = assignmentMap.get(seatNo);
      
      // Find department config to get year
      let yearInfo = '';
      if (assignment && assignment.department) {
        const deptConfig = arrangement.department_configs.find(
          config => config.department === assignment.department
        );
        yearInfo = deptConfig?.year || 'N/A';
      }
      
      // Add cell content
      const cellData = [
        [seatNo],
        [assignment ? (assignment.department || 'N/A') : 'Empty'],
        [assignment ? (assignment.reg_no || 'N/A') : ''],
        [assignment ? yearInfo : '']
      ];
      
      XLSX.utils.sheet_add_aoa(ws, cellData, {
        origin: { r: cellRow, c: cellCol }
      });
    }
  }
  
  // Set column widths
  const colWidths = [];
  for (let i = 0; i < columns * 2; i++) {
    colWidths.push({ wch: 15 });
  }
  ws['!cols'] = colWidths;
  
  return ws;
}
