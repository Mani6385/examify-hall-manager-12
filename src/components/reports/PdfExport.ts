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
  
  // Add consolidated table
  doc.addPage();
  addConsolidatedTable(doc, arrangements, hallName);
  
  // Add hall-wise tables (one per room)
  arrangements.forEach((arrangement, index) => {
    doc.addPage();
    addHallWiseTable(doc, arrangement);
  });
  
  // Save the file with "hall-wise" in the filename
  doc.save(`hall-wise-seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
  
  arrangements.forEach((arrangement, index) => {
    // Get departments with years directly from the department_configs
    const deptsWithYears = getDepartmentsWithYears(arrangement);
    
    if (deptsWithYears.length === 0) {
      // If no department configs, add a single row with "Not specified"
      const row = [
        (index + 1).toString(),      // S.No
        arrangement.room_no,         // Room No
        "Not specified",             // Department
        "N/A",                       // Year
        "",                          // Seats (empty when no departments)
        "0",                         // Dept Total 
        arrangement.seating_assignments.length.toString() // Room Total
      ];
      tableData.push(row);
    } else {
      // Group students by department and year
      const deptGroups = new Map<string, {students: any[], year: string | null}>();
      
      // First, collect year information from department_configs
      arrangement.department_configs.forEach(config => {
        if (config.department) {
          const key = config.department;
          
          if (!deptGroups.has(key)) {
            deptGroups.set(key, {
              students: [], 
              year: config.year || null
            });
          } else {
            // If the department already exists, update the year
            const existing = deptGroups.get(key)!;
            existing.year = config.year || existing.year;
          }
        }
      });
      
      // Now gather students for each department
      arrangement.seating_assignments.forEach(assignment => {
        if (!assignment.department) return;
        
        // Create key with department
        const key = assignment.department;
        
        if (!deptGroups.has(key)) {
          // If we don't have this department from configs, create it
          deptGroups.set(key, {
            students: [], 
            year: null
          });
        }
        
        // Add student to the department group
        deptGroups.get(key)?.students.push(assignment);
      });
      
      // Add a row for each department in this room
      let firstDeptInRoom = true;
      Array.from(deptGroups.entries()).forEach(([deptKey, {students, year}]) => {
        // Skip if no students
        if (students.length === 0) return;
        
        // Sort students by registration number
        students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
        
        // Format registration numbers in start-to-end format
        let regNosFormatted = "";
        if (students.length > 0) {
          // Get only the first and last registration numbers
          const firstRegNo = students[0].reg_no || '';
          const lastRegNo = students[students.length - 1].reg_no || '';
          
          if (firstRegNo === lastRegNo) {
            regNosFormatted = firstRegNo;
          } else if (firstRegNo && lastRegNo) {
            regNosFormatted = `${firstRegNo} - ${lastRegNo}`;
          }
        }
        
        // Create a row for this department
        const row = [
          firstDeptInRoom ? (index + 1).toString() : '',  // S.No
          firstDeptInRoom ? arrangement.room_no : '',     // Room No
          deptKey,                                        // Department
          year || "N/A",                                  // Year
          regNosFormatted,                                // Registration Numbers (simplified to start-end)
          students.length.toString(),                     // Department Total
          firstDeptInRoom ? students.length.toString() : '' // Room Total (only for first dept)
        ];
        
        tableData.push(row);
        firstDeptInRoom = false;
      });
    }
    
    // Add an empty row between rooms for better readability
    if (index < arrangements.length - 1) {
      tableData.push(['', '', '', '', '', '', '']);
    }
  });
  
  // Add the consolidated table
  autoTable(doc, {
    head: [['S.NO', 'ROOM NO', 'DEPARTMENT', 'YEAR', 'SEATS', 'DEPT TOTAL', 'ROOM TOTAL']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },  // Year column
      4: { cellWidth: 'auto' },
      5: { cellWidth: 20, halign: 'right' },  // Department total
      6: { cellWidth: 20, halign: 'right' },  // Room total
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

function addHallWiseTable(doc: jsPDF, arrangement: SeatingArrangement) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Student Assignments by Department`, pageWidth / 2, 20, { align: "center" });
  
  // Group students by department
  const deptGroups = new Map<string, any[]>();
  
  arrangement.seating_assignments.forEach(assignment => {
    const dept = assignment.department || 'Unassigned';
    
    if (!deptGroups.has(dept)) {
      deptGroups.set(dept, []);
    }
    
    deptGroups.get(dept)?.push(assignment);
  });
  
  let startY = 30;
  const maxColumns = 4; // Number of columns from the image
  
  // Process each department
  Array.from(deptGroups.entries()).forEach(([dept, students]) => {
    // Sort students by seat_no for consistency
    students.sort((a, b) => a.seat_no.localeCompare(b.seat_no));
    
    // Build table data for this department
    const tableData: string[][] = [];
    
    // Create chunks of students for rows
    for (let i = 0; i < students.length; i += maxColumns) {
      const rowStudents = students.slice(i, i + maxColumns);
      const row: string[] = [];
      
      // Add each student's data
      rowStudents.forEach(student => {
        row.push(`${student.seat_no}: ${student.reg_no || 'N/A'}`);
      });
      
      // Fill with empty cells if needed
      while (row.length < maxColumns) {
        row.push('');
      }
      
      tableData.push(row);
    }
    
    // Create the table for this department
    autoTable(doc, {
      head: [[dept, 'Student 1', 'Student 2', 'Student 3', 'Student 4']],
      body: tableData,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' }, // Department column
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        // If the table flows to a new page, add the title again
        if (data.pageNumber > 1) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`Room ${arrangement.room_no} - Student Assignments by Department (cont.)`, pageWidth / 2, 20, { align: "center" });
        }
      }
    });
    
    // Update the starting position for the next table
    startY = doc.lastAutoTable.finalY + 10;
    
    // If too close to the bottom, start a new page
    if (startY > doc.internal.pageSize.height - 40) {
      doc.addPage();
      startY = 30;
    }
  });
}
