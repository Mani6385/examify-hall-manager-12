
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';

export const generatePdfReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
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
    
    // If there are students, add a student table
    if (arrangement.seating_assignments.length > 0) {
      doc.addPage();
      addStudentListTable(doc, arrangement);
      
      // Add seating layout visualization if room is not too large
      if (arrangement.rows <= 10 && arrangement.columns <= 10) {
        doc.addPage();
        addSeatingLayout(doc, arrangement);
      }
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
    autoTable(doc, {
      head: [['Department', 'Students', 'Percentage']],
      body: deptData,
      startY: doc.lastAutoTable.finalY + 15,
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
    .sort((a, b) => a.seat_no.localeCompare(b.seat_no));
  
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

function addSeatingLayout(doc: jsPDF, arrangement: SeatingArrangement) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no} - Seating Layout`, doc.internal.pageSize.width / 2, 20, { align: "center" });
  
  const rows = arrangement.rows;
  const cols = arrangement.columns;
  
  // Create a grid representation of seats
  const headerRow = [''].concat(Array.from({ length: cols }, (_, i) => (i + 1).toString()));
  const gridData = [headerRow];
  
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const rowData = [rowLetter];
    
    for (let c = 0; c < cols; c++) {
      const seatNo = `${rowLetter}${c + 1}`;
      const assignment = arrangement.seating_assignments.find(a => a.seat_no === seatNo);
      rowData.push(assignment ? (assignment.reg_no ? assignment.reg_no : 'X') : '');
    }
    
    gridData.push(rowData);
  }
  
  // Add seating grid
  autoTable(doc, {
    head: [gridData[0]],
    body: gridData.slice(1),
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 5,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold',
    },
  });
  
  // Add legend
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Legend:", 14, doc.lastAutoTable.finalY + 15);
  doc.text("• Blank = Unoccupied seat", 20, doc.lastAutoTable.finalY + 25);
  doc.text("• X = Occupied seat (no registration number)", 20, doc.lastAutoTable.finalY + 35);
  doc.text("• Registration Number = Occupied seat with student information", 20, doc.lastAutoTable.finalY + 45);
}
