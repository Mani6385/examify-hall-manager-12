import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';
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
function createConsolidatedWorksheet(arrangements: SeatingArrangement[], hallName: string): XLSX.WorkSheet {
  // Create empty worksheet
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add title and header
  XLSX.utils.sheet_add_aoa(ws, [
    ["Abc ARTS AND SCIENCE COLLEGE"],
    ["DEPARTMENT OF COMPUTER SCIENCE AND BCA"],
    [`SEATING PLAN(${new Date().toLocaleDateString()})`],
    [],
    ["S.NO", "ROOM NO", "CLASS", "SEATS", "TOTAL"]
  ], { origin: "A1" });
  
  // Create department mapping for quick lookup
  const deptAbbreviations: Record<string, string> = {
    "Computer Science": "CS",
    "Information Technology": "IT",
    "Electronics": "EC",
    "Electrical Engineering": "EE",
    "Mechanical Engineering": "ME",
    "Civil Engineering": "CE",
    "Bachelor of Computer Applications": "BCA"
  };
  
  // Prepare data for the consolidated format
  const tableData: string[][] = [];
  
  arrangements.forEach((arrangement, index) => {
    // Group students by department and year
    const deptGroups = new Map<string, any[]>();
    arrangement.seating_assignments.forEach(assignment => {
      // Get department and year
      const deptParts = assignment.department?.split(' ') || ['Unassigned'];
      const lastPart = deptParts[deptParts.length - 1];
      const year = lastPart.match(/^[IVX]+$/) ? lastPart : 'I'; // Roman numerals for year
      
      // Get department abbreviation
      let deptKey = assignment.department || 'Unassigned';
      if (lastPart.match(/^[IVX]+$/)) {
        deptKey = deptParts.slice(0, -1).join(' ');
      }
      
      const deptAbbr = deptAbbreviations[deptKey] || deptKey;
      const key = `${year} ${deptAbbr}`;
      
      if (!deptGroups.has(key)) {
        deptGroups.set(key, []);
      }
      deptGroups.get(key)?.push(assignment);
    });
    
    // Add a row for each department in this room
    let firstDeptInRoom = true;
    Array.from(deptGroups.entries()).forEach(([deptKey, students]) => {
      // Sort students by registration number
      students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
      
      // Format registration numbers in start-to-end format
      let regNosFormatted = "";
      if (students.length > 0) {
        // Group consecutive registration numbers
        const groups: {start: string; end: string}[] = [];
        let currentGroup: {start: string; end: string} | null = null;
        
        students.forEach((student, idx) => {
          const currentRegNo = student.reg_no || '';
          
          // For the first student or when starting a new group
          if (currentGroup === null) {
            currentGroup = { start: currentRegNo, end: currentRegNo };
            return;
          }
          
          // Check if this reg_no is consecutive with the previous one
          // Simple check: see if the numbers are sequential
          const prevNumeric = parseInt(currentGroup.end.replace(/\D/g, ''));
          const currNumeric = parseInt(currentRegNo.replace(/\D/g, ''));
          
          if (currNumeric === prevNumeric + 1 && currentRegNo.replace(/\d/g, '') === currentGroup.end.replace(/\d/g, '')) {
            // Update the end of the current group
            currentGroup.end = currentRegNo;
          } else {
            // Finish the current group and start a new one
            groups.push(currentGroup);
            currentGroup = { start: currentRegNo, end: currentRegNo };
          }
          
          // For the last student, add the current group
          if (idx === students.length - 1 && currentGroup) {
            groups.push(currentGroup);
          }
        });
        
        // Format the groups
        regNosFormatted = groups.map(group => {
          if (group.start === group.end) {
            return group.start;
          } else {
            return `${group.start}-${group.end}`;
          }
        }).join(', ');
      }
      
      // Create a row for this department
      const row = [
        firstDeptInRoom ? (index + 1).toString() : '',  // S.No
        firstDeptInRoom ? arrangement.room_no : '',     // Room No
        deptKey,                                        // Class (Dept + Year)
        regNosFormatted,                                // Registration Numbers (start-end format)
        firstDeptInRoom ? students.length.toString() : '' // Total for the room
      ];
      
      tableData.push(row);
      firstDeptInRoom = false;
    });
    
    // Add an empty row between rooms for better readability
    if (index < arrangements.length - 1) {
      tableData.push(['', '', '', '', '']);
    }
  });
  
  // Add the data rows starting after the header
  XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A6" });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 6 },    // S.No
    { wch: 10 },   // Room No
    { wch: 15 },   // Class
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },  // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },  // Department row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },  // Seating plan row
  ];
  
  return ws;
}

// New function to create detailed room worksheet with department organization
function createDetailedRoomWorksheet(arrangement: SeatingArrangement): XLSX.WorkSheet {
  // Group students by department
  const deptGroups = new Map<string, any[]>();
  arrangement.seating_assignments.forEach(assignment => {
    const dept = assignment.department || 'Unassigned';
    if (!deptGroups.has(dept)) {
      deptGroups.set(dept, []);
    }
    deptGroups.get(dept)?.push(assignment);
  });
  
  // Create empty worksheet
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Add title
  XLSX.utils.sheet_add_aoa(ws, [
    ["EXAMINATION SEATING PLAN"],
    [`Room ${arrangement.room_no} - Department-wise Student Assignments`],
    [`Total Capacity: ${arrangement.rows} × ${arrangement.columns} = ${arrangement.rows * arrangement.columns} seats`],
    [`Assigned: ${arrangement.seating_assignments.length} seats (${Math.round((arrangement.seating_assignments.length / (arrangement.rows * arrangement.columns)) * 100)}% occupancy)`],
    []
  ], { origin: "A1" });
  
  // Current row to add data
  let currentRow = 6;
  
  // Add each department section
  Array.from(deptGroups.entries()).forEach(([dept, students]) => {
    // Sort students by reg_no
    students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
    
    // Add department header
    XLSX.utils.sheet_add_aoa(ws, [
      [dept]
    ], { origin: { r: currentRow, c: 0 } });
    currentRow++;
    
    // Add headers for student table
    XLSX.utils.sheet_add_aoa(ws, [
      ["S.No", "Seat No", "Registration No", "Student Name"]
    ], { origin: { r: currentRow, c: 0 } });
    currentRow++;
    
    // Add students
    students.forEach((student, index) => {
      XLSX.utils.sheet_add_aoa(ws, [
        [index + 1, student.seat_no, student.reg_no || 'N/A', student.student_name || 'Unassigned']
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
      
      // Add cell content
      const cellData = [
        [seatNo],
        [assignment ? (assignment.department || 'N/A') : 'Empty'],
        [assignment ? (assignment.reg_no || 'N/A') : '']
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
