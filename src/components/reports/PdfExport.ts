
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';

export const generatePdfReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
  const doc = new jsPDF();
  
  // Add title
  const hallName = getHallNameById(hallId);
  
  doc.setFontSize(16);
  doc.text("DEPARTMENT OF COMPUTER SCIENCE AND BCA", doc.internal.pageSize.width / 2, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text(`SEATING PLAN - ${hallName} (EXAM DATE)`, doc.internal.pageSize.width / 2, 25, { align: "center" });

  // Prepare data for the table
  const tableData = arrangements.map(arrangement => {
    const studentsByClass = arrangement.seating_assignments.reduce((acc: any, assignment) => {
      if (assignment.reg_no) {
        const key = `${assignment.department}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(assignment.reg_no);
      }
      return acc;
    }, {});

    const seatsEntries = Object.entries(studentsByClass).map(([className, regNos]) => 
      `${className}: ${(regNos as string[]).join(', ')}`
    );

    return [
      arrangement.id,
      `${arrangement.floor_no}${arrangement.room_no}`,
      Object.keys(studentsByClass).join('\n'),
      seatsEntries.join('\n'),
      arrangement.seating_assignments.length
    ];
  });

  // Add table
  autoTable(doc, {
    head: [['S.NO', 'ROOM NO', 'CLASS', 'SEATS', 'TOTAL']],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 15 },
    },
    didDrawPage: (data) => {
      // Add header to each page
      if (data.pageNumber > 1) {
        doc.setFontSize(16);
        doc.text("DEPARTMENT OF COMPUTER SCIENCE AND BCA", doc.internal.pageSize.width / 2, 15, { align: "center" });
        doc.setFontSize(14);
        doc.text(`SEATING PLAN - ${hallName} (EXAM DATE)`, doc.internal.pageSize.width / 2, 25, { align: "center" });
      }
    },
  });

  doc.save(`seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
