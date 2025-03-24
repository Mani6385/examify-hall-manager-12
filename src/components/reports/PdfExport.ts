
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears, getDepartmentsWithYears } from '@/utils/reportUtils';

// Extend the jsPDF type to include the lastAutoTable property
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const generatePdfReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
  // Check if we have arrangements data
  if (!arrangements || arrangements.length === 0) {
    console.error("No seating arrangements data available for PDF export");
    return;
  }

  const doc = new jsPDF();
  const hallName = getHallNameById(hallId);
  
  // Add cover page
  addCoverPage(doc, hallName);
  
  // Add consolidated table in new format
  doc.addPage();
  addConsolidatedTable(doc, arrangements, hallName);
  
  // Sort arrangements by room number for better organization
  const sortedArrangements = [...arrangements].sort((a, b) => 
    a.room_no.localeCompare(b.room_no)
  );
  
  // For each arrangement, add a detailed page
  sortedArrangements.forEach((arrangement, index) => {
    // If there are more than 5 arrangements, put detailed reports on new pages
    if (index > 0 && (index % 2 === 0 || arrangements.length > 5)) {
      doc.addPage();
    }
    
    // Add room-specific detail section with class-wise breakdowns
    addRoomDetailClassWise(doc, arrangement, index === 0 ? 30 : doc.lastAutoTable.finalY + 15);
  });
  
  doc.save(`seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

function addCoverPage(doc: jsPDF, hallName: string) {
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("EXAMINATION SEATING PLAN", centerX, 60, { align: "center" });
  
  doc.setFontSize(18);
  doc.text(hallName.toUpperCase(), centerX, 75, { align: "center" });
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${formattedDate}`, centerX, 100, { align: "center" });
  
  doc.setFontSize(10);
  doc.text("DEPARTMENT OF COMPUTER SCIENCE AND BCA", centerX, 240, { align: "center" });
}

function addConsolidatedTable(doc: jsPDF, arrangements: SeatingArrangement[], hallName: string) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("DEPARTMENT OF COMPUTER SCIENCE AND BCA", pageWidth / 2, 20, { align: "center" });
  
  // Add seating plan info
  doc.setFontSize(12);
  doc.text(`SEATING PLAN (${new Date().toLocaleDateString()})`, pageWidth / 2, 30, { align: "center" });
  
  // Prepare table data in the format shown in the image
  const tableData: string[][] = [];
  
  // Sort arrangements by room number
  const sortedArrangements = [...arrangements].sort((a, b) => 
    a.room_no.localeCompare(b.room_no)
  );
  
  sortedArrangements.forEach((arrangement, index) => {
    // Get departments with years directly from the department_configs
    const deptsWithYears = getDepartmentsWithYears(arrangement);
    
    if (deptsWithYears.length === 0) {
      // If no department configs, add a single row with "Not specified"
      const row = [
        (index + 1).toString(),      // S.No
        arrangement.room_no,         // Room No
        "Not specified",             // Class
        "N/A",                       // Year (added)
        "",                          // Seats (empty when no departments)
        arrangement.seating_assignments.length.toString() // Total
      ];
      tableData.push(row);
    } else {
      // Group students by department and year
      const deptGroups = new Map<string, {students: any[], year: string | null}>();
      
      arrangement.seating_assignments.forEach(assignment => {
        if (!assignment.department) return;
        
        // Find matching department config
        const deptConfig = arrangement.department_configs.find(
          config => config.department === assignment.department
        );
        
        const key = deptConfig ? deptConfig.department : assignment.department;
        const year = deptConfig?.year || null;
        
        if (!deptGroups.has(key)) {
          deptGroups.set(key, {students: [], year});
        }
        deptGroups.get(key)?.students.push(assignment);
      });
      
      // Sort departments alphabetically
      const sortedDeptEntries = Array.from(deptGroups.entries()).sort((a, b) => 
        a[0].localeCompare(b[0])
      );
      
      // Add a row for each department in this room
      let firstDeptInRoom = true;
      sortedDeptEntries.forEach(([deptKey, {students, year}]) => {
        // Skip if no students
        if (students.length === 0) return;
        
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
          deptKey,                                        // Class (Dept)
          year || "N/A",                                  // Year (added)
          regNosFormatted,                                // Registration Numbers (start-end format)
          firstDeptInRoom ? students.length.toString() : '' // Total for the room
        ];
        
        tableData.push(row);
        firstDeptInRoom = false;
      });
    }
    
    // Add an empty row between rooms for better readability
    if (index < arrangements.length - 1) {
      tableData.push(['', '', '', '', '', '']);
    }
  });
  
  // Add the consolidated table
  autoTable(doc, {
    head: [['S.NO', 'ROOM NO', 'CLASS', 'YEAR', 'SEATS', 'TOTAL']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },  // Year column
      4: { cellWidth: 'auto' },
      5: { cellWidth: 15, halign: 'center' },
    },
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    // Don't draw horizontal line for empty rows
    didDrawCell: (data) => {
      const row = data.row.index;
      const isEmptyRow = tableData[row] && tableData[row].every(cell => cell === '');
      if (isEmptyRow && data.column.index === 0) {
        // Remove the border for empty rows
        const x = data.cell.x;
        const y = data.cell.y;
        // Fixed: Use pageWidth from the document instead of data.table.width
        const w = doc.internal.pageSize.width - 2 * data.cell.padding('left');
        doc.setDrawColor(255, 255, 255);
        doc.line(x, y, x + w, y);
      }
    }
  });
}

function addRoomDetailClassWise(doc: jsPDF, arrangement: SeatingArrangement, startY: number) {
  // Get formatted departments and years
  const deptYearsFormatted = formatDepartmentsWithYears(arrangement);
  
  // Group students by department with year information
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
  
  // Add header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Student Assignments by Department and Year`, 14, startY - 5);
  
  // Add department and year information
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Departments & Years: ${deptYearsFormatted}`, 14, startY);
  
  // Format the data for the table
  const tableData: string[][] = [];
  
  // Sort departments alphabetically
  const sortedDeptEntries = Array.from(deptGroups.entries()).sort((a, b) => 
    a[0].localeCompare(b[0])
  );
  
  sortedDeptEntries.forEach(([dept, {students, year}]) => {
    // Sort students by seat number prefix first (A, B, C) and then by number
    students.sort((a, b) => {
      const seatA = a.seat_no || '';
      const seatB = b.seat_no || '';
      
      // Extract prefix (first character) and numeric parts
      const prefixA = seatA.charAt(0);
      const prefixB = seatB.charAt(0);
      
      // First sort by prefix
      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB);
      }
      
      // Then sort by numeric part
      const numA = parseInt(seatA.substring(1)) || 0;
      const numB = parseInt(seatB.substring(1)) || 0;
      return numA - numB;
    });
    
    // Group students into maximum 4 per row to save space
    const chunkSize = 4;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const row = chunk.map(student => `${student.seat_no}: ${student.reg_no || 'N/A'}`);
      
      // Add year information for the first row of each department
      tableData.push([
        i === 0 ? dept : '', 
        i === 0 ? (year || 'N/A') : '',
        ...row
      ]);
    }
    
    // Add an empty row between departments
    tableData.push(['', '', '', '', '', '']);
  });
  
  // Add the table
  autoTable(doc, {
    body: tableData,
    startY: startY + 5,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },  // Department
      1: { cellWidth: 15 },                     // Year
      2: { cellWidth: 'auto' },                 // Student 1
      3: { cellWidth: 'auto' },                 // Student 2
      4: { cellWidth: 'auto' },                 // Student 3
      5: { cellWidth: 'auto' },                 // Student 4
    },
    // Remove borders for empty rows
    didDrawCell: (data) => {
      const row = data.row.index;
      const isEmptyRow = tableData[row] && tableData[row].every(cell => cell === '');
      if (isEmptyRow && data.column.index === 0) {
        // Remove the border for empty rows
        const x = data.cell.x;
        const y = data.cell.y;
        // Fixed: Use pageWidth from the document instead of data.table.width
        const w = doc.internal.pageSize.width - 2 * data.cell.padding('left');
        doc.setDrawColor(255, 255, 255);
        doc.line(x, y, x + w, y);
      }
    }
  });
}

function addSummaryTable(doc: jsPDF, arrangements: SeatingArrangement[]) {
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary of Seating Arrangements", doc.internal.pageSize.width / 2, 20, { align: "center" });
  
  const tableData = arrangements.map((arrangement, index) => {
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
    
    const capacity = arrangement.rows * arrangement.columns;
    const assigned = arrangement.seating_assignments.length;
    const occupancy = Math.round((assigned / capacity) * 100);
    
    return [
      (index + 1).toString(),
      arrangement.room_no,
      arrangement.floor_no,
      `${arrangement.rows} × ${arrangement.columns}`,
      capacity.toString(),
      assigned.toString(),
      `${occupancy}%`,
      deptCountStr
    ];
  });
  
  autoTable(doc, {
    head: [['S.No', 'Room', 'Floor', 'Dimensions', 'Capacity', 'Assigned', 'Occupancy', 'Departments']],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 'auto' },
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
}

function addRoomDetailPage(doc: jsPDF, arrangement: SeatingArrangement) {
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} (Floor ${arrangement.floor_no})`, centerX, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const capacity = arrangement.rows * arrangement.columns;
  const assigned = arrangement.seating_assignments.length;
  const occupancy = Math.round((assigned / capacity) * 100);
  
  // Count students by department
  const deptCounts: Record<string, number> = {};
  arrangement.seating_assignments.forEach(assignment => {
    const dept = assignment.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  
  // Create department statistics table
  const deptData = Object.entries(deptCounts).map(([dept, count]) => [
    dept,
    count.toString(),
    `${Math.round((count / assigned) * 100)}%`
  ]);
  
  // Room statistics
  autoTable(doc, {
    head: [['Property', 'Value']],
    body: [
      ['Dimensions', `${arrangement.rows} × ${arrangement.columns}`],
      ['Total Capacity', capacity.toString()],
      ['Assigned Seats', assigned.toString()],
      ['Occupancy', `${occupancy}%`],
      ['Departments', Object.keys(deptCounts).join(', ')],
    ],
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  });
  
  // Department breakdown
  if (deptData.length > 0) {
    const tableEnd = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;
    autoTable(doc, {
      head: [['Department', 'Students', 'Percentage']],
      body: deptData,
      startY: tableEnd + 15,
      theme: 'grid',
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [66, 66, 66],
      },
    });
  }
}

function addVisualSeatingGrid(doc: jsPDF, arrangement: SeatingArrangement) {
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Visual Seating Plan`, centerX, 20, { align: "center" });
  
  const rows = arrangement.rows;
  const columns = arrangement.columns;
  
  // Calculate grid dimensions
  const margin = 20;
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = doc.internal.pageSize.height - 60;
  
  const cellWidth = Math.min(availableWidth / columns, 70);
  const cellHeight = Math.min(availableHeight / rows, 50);
  
  const gridWidth = cellWidth * columns;
  const startX = (pageWidth - gridWidth) / 2;
  let startY = 40;
  
  // Find all assignments
  const assignmentMap = new Map();
  arrangement.seating_assignments.forEach(assignment => {
    if (assignment.seat_no && assignment.seat_no.trim() !== '') {
      assignmentMap.set(assignment.seat_no, assignment);
    }
  });
  
  // Draw the seating grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = startX + (col * cellWidth);
      const y = startY + (row * cellHeight);
      
      // Draw cell border
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(x, y, cellWidth, cellHeight);
      
      // Calculate seat number (based on common patterns)
      const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
      const colLabel = col + 1;
      const seatNo = `${rowLabel}${colLabel}`;
      
      // Get assignment details for this seat
      const assignment = assignmentMap.get(seatNo);
      
      if (assignment) {
        // Find department config to get year
        let yearInfo = '';
        if (assignment.department) {
          const deptConfig = arrangement.department_configs.find(
            config => config.department === assignment.department
          );
          yearInfo = deptConfig?.year || '';
        }
        
        // Seat number
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(seatNo, x + 5, y + 10);
        
        // Department
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(assignment.department || 'N/A', x + 5, y + 20);
        
        // Registration number
        doc.setFontSize(8);
        doc.text(assignment.reg_no || 'N/A', x + 5, y + 30);
        
        // Year information (added)
        if (yearInfo) {
          doc.setFontSize(7);
          doc.text(`Year: ${yearInfo}`, x + 5, y + 38);
        }
      } else {
        // Empty seat
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(seatNo, x + 5, y + 10);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Empty", x + 5, y + 20);
      }
    }
  }
}

function addStudentListTable(doc: jsPDF, arrangement: SeatingArrangement) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Student Assignments`, doc.internal.pageSize.width / 2, 20, { align: "center" });
  
  const sortedAssignments = [...arrangement.seating_assignments]
    .sort((a, b) => {
      // Extract the prefix and number
      const aPrefix = a.seat_no.charAt(0);
      const bPrefix = b.seat_no.charAt(0);
      
      // Extract numeric part
      const aNum = parseInt(a.seat_no.substring(1));
      const bNum = parseInt(b.seat_no.substring(1));
      
      // First sort by prefix
      if (aPrefix !== bPrefix) {
        return aPrefix.localeCompare(bPrefix);
      }
      
      // Then sort by number
      return aNum - bNum;
    });
  
  // Get years for each student
  const studentYears = new Map<string, string>();
  sortedAssignments.forEach(assignment => {
    if (assignment.department) {
      const deptConfig = arrangement.department_configs.find(
        config => config.department === assignment.department
      );
      if (deptConfig?.year) {
        studentYears.set(assignment.id, deptConfig.year);
      }
    }
  });
  
  const tableData = sortedAssignments.map((assignment, index) => [
    (index + 1).toString(),
    assignment.seat_no,
    assignment.student_name || 'Unassigned',
    assignment.reg_no || 'N/A',
    assignment.department || 'N/A',
    studentYears.get(assignment.id) || 'N/A', // Added year column
  ]);
  
  autoTable(doc, {
    head: [['S.No', 'Seat', 'Student Name', 'Registration No', 'Department', 'Year']], // Added Year
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 15 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 15 }, // Year column
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (data) => {
      // Add header to each page
      if (data.pageNumber > 1) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Room ${arrangement.room_no} - Student Assignments (continued)`, doc.internal.pageSize.width / 2, 20, { align: "center" });
      }
    },
  });
}
