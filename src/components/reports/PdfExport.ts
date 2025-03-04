import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';

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
  
  // Add summary table
  addSummaryTable(doc, arrangements);
  
  // For each arrangement, add a detailed page
  arrangements.forEach((arrangement, index) => {
    if (index > 0 || arrangements.length > 3) {
      doc.addPage();
    }
    
    addRoomDetailPage(doc, arrangement);
    
    // Add visual seating grid layout
    doc.addPage();
    addVisualSeatingGrid(doc, arrangement);
    
    // If there are students, add a student table
    if (arrangement.seating_assignments.length > 0) {
      doc.addPage();
      addStudentListTable(doc, arrangement);
    }
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
      
      // First sort by number
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      
      // Then sort by prefix
      return aPrefix.localeCompare(bPrefix);
    });
  
  const tableData = sortedAssignments.map((assignment, index) => [
    (index + 1).toString(),
    assignment.seat_no,
    assignment.student_name || 'Unassigned',
    assignment.reg_no || 'N/A',
    assignment.department || 'N/A',
  ]);
  
  autoTable(doc, {
    head: [['S.No', 'Seat', 'Student Name', 'Registration No', 'Department']],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 15 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
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
