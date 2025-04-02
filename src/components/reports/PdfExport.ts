
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SeatingArrangement, getHallNameById, formatDepartmentWithYear, getDepartmentsWithYears } from '@/utils/reportUtils';

export const generatePdfReport = (arrangements: SeatingArrangement[], hallId: string) => {
  try {
    const doc = new jsPDF();
    const hallName = getHallNameById(hallId);
    
    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = hallId === 'all' ? 'Consolidated Seating Plan' : `${hallName} Seating Plan`;
    doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    // Add summary table
    addSummaryTable(doc, arrangements);
    
    // Add detailed seating arrangements for each room
    arrangements.forEach((arrangement, index) => {
      // Add page break after the first page
      if (index > 0) {
        doc.addPage();
      }
      
      // Add detailed arrangement
      addDetailedArrangement(doc, arrangement);
    });
    
    // Save the PDF
    const filename = `seating-plan-${hallName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
    
    return filename;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

function addSummaryTable(doc: jsPDF, arrangements: SeatingArrangement[]) {
  const totalStudents = arrangements.reduce(
    (total, arr) => total + arr.seating_assignments.length, 
    0
  );
  
  // Add summary info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Rooms: ${arrangements.length}`, 14, 25);
  doc.text(`Total Students: ${totalStudents}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
  
  // Create summary table
  const tableHeaders = [
    { header: 'Room', dataKey: 'room' },
    { header: 'Floor', dataKey: 'floor' },
    { header: 'Departments & Years', dataKey: 'departments' },
    { header: 'Students', dataKey: 'students' },
    { header: 'Dimensions', dataKey: 'dimensions' }
  ];
  
  const tableData = arrangements.map(arr => {
    // Get department info with years
    const departmentsWithYears = getDepartmentsWithYears(arr);
    const departmentText = departmentsWithYears
      .map(item => formatDepartmentWithYear(item.department, item.year))
      .join(', ');
    
    return {
      room: arr.room_no,
      floor: arr.floor_no,
      departments: departmentText,
      students: arr.seating_assignments.length,
      dimensions: `${arr.rows} × ${arr.columns}`
    };
  });
  
  // @ts-ignore (jspdf-autotable extension)
  doc.autoTable({
    startY: 40,
    head: [tableHeaders.map(h => h.header)],
    body: tableData.map(d => [
      d.room,
      d.floor,
      d.departments,
      d.students,
      d.dimensions
    ]),
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 240, 255] },
    margin: { top: 40 },
    styles: { fontSize: 8, cellPadding: 2 }
  });
}

function addDetailedArrangement(doc: jsPDF, arrangement: SeatingArrangement) {
  // Room title
  const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 50;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Room ${arrangement.room_no}, Floor ${arrangement.floor_no}`, 14, startY);
  
  // Room info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dimensions: ${arrangement.rows} rows × ${arrangement.columns} columns`, 14, startY + 7);
  doc.text(`Total Students: ${arrangement.seating_assignments.length}`, 14, startY + 14);
  
  // Department info with years
  const departmentsWithYears = getDepartmentsWithYears(arrangement);
  if (departmentsWithYears.length > 0) {
    let departmentY = startY + 21;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Departments:", 14, departmentY);
    
    departmentsWithYears.forEach((item, index) => {
      const deptText = formatDepartmentWithYear(item.department, item.year);
      doc.setFont('helvetica', 'normal');
      doc.text(`- ${deptText}`, 24, departmentY + ((index + 1) * 7));
    });
  }
  
  // Group students by seat prefix
  const studentGroups = arrangement.seating_assignments.reduce((groups: any, student) => {
    const prefix = student.seat_no?.charAt(0) || 'Unknown';
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(student);
    return groups;
  }, {});
  
  // Sort seat prefixes alphabetically
  const sortedPrefixes = Object.keys(studentGroups).sort();
  
  // Create tables for each prefix group
  sortedPrefixes.forEach((prefix, prefixIndex) => {
    const students = studentGroups[prefix];
    
    // Skip empty groups
    if (!students || students.length === 0) return;
    
    // Sort students by seat number
    students.sort((a: any, b: any) => {
      if (!a.seat_no || !b.seat_no) return 0;
      return a.seat_no.localeCompare(b.seat_no);
    });
    
    // Create student table header
    const tableStartY = prefixIndex === 0 ? startY + 40 : doc.lastAutoTable.finalY + 15;
    
    // Add title for the group
    const departmentConfig = arrangement.department_configs.find(
      config => config.prefix === prefix
    );
    
    const departmentName = departmentConfig?.department || 'Unknown';
    const yearInfo = departmentConfig?.year ? ` (${departmentConfig.year})` : '';
    const groupTitle = `${departmentName}${yearInfo} - Seat Series ${prefix}`;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(groupTitle, 14, tableStartY - 5);
    
    // Create student table
    // @ts-ignore (jspdf-autotable extension)
    doc.autoTable({
      startY: tableStartY,
      head: [['Seat No', 'Registration No', 'Department & Year', 'Student Name']],
      body: students.map((student: any) => {
        // Find the department config for this student to get year info
        const deptConfig = arrangement.department_configs.find(
          config => config.department === student.department
        );
        const formattedDept = deptConfig && student.department ? 
          formatDepartmentWithYear(student.department, deptConfig.year) : 
          (student.department || 'Unknown');
          
        return [
          student.seat_no || '',
          student.reg_no || '',
          formattedDept,
          student.student_name || ''
        ];
      }),
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { top: 40, left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 }
      }
    });
  });
}
