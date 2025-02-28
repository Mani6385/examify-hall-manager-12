
import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById } from '@/utils/reportUtils';

export const generateExcelReport = (
  arrangements: SeatingArrangement[],
  hallId: string
): void => {
  const wb = XLSX.utils.book_new();
  
  // Prepare data for the consolidated view
  const consolidatedData = arrangements.map(arrangement => {
    // Group students by department and class
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

    // Format the seats column
    const seatsEntries = Object.entries(studentsByClass).map(([className, regNos]) => 
      `${className}: ${(regNos as string[]).join(', ')}`
    );

    return {
      "S.NO": arrangement.id,
      "ROOM NO": `${arrangement.floor_no}${arrangement.room_no}`,
      "CLASS": Object.keys(studentsByClass).join('\n'),
      "SEATS": seatsEntries.join('\n'),
      "TOTAL": arrangement.seating_assignments.length
    };
  });

  // Create worksheet and set column widths
  const ws = XLSX.utils.json_to_sheet(consolidatedData);
  ws['!cols'] = [
    { wch: 8 },  // S.NO
    { wch: 10 }, // ROOM NO
    { wch: 15 }, // CLASS
    { wch: 50 }, // SEATS
    { wch: 8 },  // TOTAL
  ];

  // Add title rows
  const hallName = getHallNameById(hallId);
  
  XLSX.utils.sheet_add_aoa(ws, [
    ["DEPARTMENT OF COMPUTER SCIENCE AND BCA"],
    [`SEATING PLAN - ${hallName} (EXAM DATE)`],
    [],
  ], { origin: "A1" });

  XLSX.utils.book_append_sheet(wb, ws, "Seating Plan");

  // Save the file
  XLSX.writeFile(wb, `seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
};
