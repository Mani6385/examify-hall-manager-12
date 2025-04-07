
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { SeatingArrangement, getHallNameById, formatDepartmentsWithYears, getDepartmentsWithYears, formatYearDisplay } from '@/utils/reportUtils';

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
  
  // For each arrangement, add a detailed page
  arrangements.forEach((arrangement, index) => {
    // Always start each arrangement on a new page
    doc.addPage();
    
    // Add room-specific detail section with class-wise breakdowns
    addRoomDetailClassWise(doc, arrangement, 30);
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
  
  // Sort arrangements by room number for better readability
  arrangements.sort((a, b) => a.room_no.localeCompare(b.room_no));
  
  arrangements.forEach((arrangement, index) => {
    // Get departments with years directly from the department_configs
    const deptsWithYears = getDepartmentsWithYears(arrangement);
    
    if (deptsWithYears.length === 0) {
      // If no department configs, add a single row with "Not specified"
      const row = [
        (index + 1).toString(),      // S.No
        arrangement.room_no,         // Room No
        "Not specified",             // Class
        "",                          // Year column added but empty for not specified
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
      
      // Sort departments to always have a consistent order
      const sortedDeptEntries = Array.from(deptGroups.entries())
        .sort(([deptA, infoA], [deptB, infoB]) => {
          // First sort by year if available
          if (infoA.year && infoB.year) {
            return infoA.year.localeCompare(infoB.year);
          }
          // Then by department name
          return deptA.localeCompare(deptB);
        });
      
      // Add a row for each department in this room
      let firstDeptInRoom = true;
      sortedDeptEntries.forEach(([deptKey, {students, year}]) => {
        // Skip if no students
        if (students.length === 0) return;
        
        // Sort students by registration number
        students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
        
        // Format registration numbers to show ranges (exactly like in the image)
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
            // For the image format, we'll simplify the check for consecutive numbers
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
          
          // Format the groups to match the image exactly
          regNosFormatted = groups.map(group => {
            if (group.start === group.end) {
              return group.start;
            } else {
              // Use just a dash between start and end numbers, as shown in image
              return `${group.start}--${group.end}`;
            }
          }).join(',');
          
          // Add additional individual numbers separated by comma if needed (like in the image)
          const individualNumbers = students
            .filter(student => {
              const regNo = student.reg_no || '';
              // Add logic here to identify individual numbers that should be listed separately
              return false; // This is a placeholder - implement actual logic based on requirements
            })
            .map(student => student.reg_no);
          
          if (individualNumbers.length > 0) {
            if (regNosFormatted) {
              regNosFormatted += "," + individualNumbers.join(',');
            } else {
              regNosFormatted = individualNumbers.join(',');
            }
          }
        }
        
        // Create a row for this department with formatted year in Roman numerals
        // Format exactly like in the image (I BCA, II CS, etc.)
        const row = [
          firstDeptInRoom ? (index + 1).toString() : '',  // S.No
          firstDeptInRoom ? arrangement.room_no : '',     // Room No
          formatYearDisplay(year) + " " + deptKey,        // Class with year prefix (like "II BCA" in image)
          "",                                            // This column is removed as per image
          regNosFormatted,                               // Registration Numbers (start-end format)
          firstDeptInRoom ? arrangement.seating_assignments.length.toString() : '' // Total for the room
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
  
  // Add the consolidated table with headers matching the image
  autoTable(doc, {
    head: [['S.NO', 'ROOM NO', 'CLASS', 'SEATS', 'TOTAL']], // Headers exactly as in image
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 15, halign: 'center' },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
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
  
  // Add header with room number prominently displayed
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Seating Plan`, doc.internal.pageSize.width / 2, startY - 15, { align: "center" });
  
  // Add header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student Assignments by Department and Year`, 14, startY - 5);
  
  // Add department and year information
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Departments & Years: ${deptYearsFormatted}`, 14, startY);
  
  // Format the data for the table
  const tableData: string[][] = [];
  
  Array.from(deptGroups.entries()).forEach(([dept, {students, year}]) => {
    // Sort students by reg_no
    students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
    
    // Group students into maximum 4 per row to save space
    const chunkSize = 4;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const row = chunk.map(student => `${student.seat_no}: ${student.reg_no}`);
      
      // Add year information for the first row of each department with proper formatting
      tableData.push([
        i === 0 ? dept : '', 
        i === 0 ? formatYearDisplay(year) : '',  // Format year as Roman numeral
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
      
      // First sort by number
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      
      // Then sort by prefix
      return aPrefix.localeCompare(bPrefix);
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
    formatYearDisplay(studentYears.get(assignment.id) || null), // Format year as Roman numeral
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
