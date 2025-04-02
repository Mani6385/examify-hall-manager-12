
import * as XLSX from 'xlsx';
import { SeatingArrangement, getHallNameById, formatDepartmentWithYear, getDepartmentsWithYears } from '@/utils/reportUtils';

export const generateExcelReport = (arrangements: SeatingArrangement[], hallId: string) => {
  try {
    const hallName = getHallNameById(hallId);
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    addSummarySheet(workbook, arrangements, hallName);
    
    // Create individual room sheets
    arrangements.forEach(arrangement => {
      addRoomSheet(workbook, arrangement);
    });
    
    // Save the workbook
    const filename = `seating-plan-${hallName.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    return filename;
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
};

function addSummarySheet(workbook: XLSX.WorkBook, arrangements: SeatingArrangement[], hallName: string) {
  const totalStudents = arrangements.reduce(
    (total, arr) => total + arr.seating_assignments.length, 
    0
  );
  
  // Create summary data
  const summaryData = [
    [hallName === 'All Halls' ? 'Consolidated Seating Plan' : `${hallName} Seating Plan`],
    [],
    ['Total Rooms:', arrangements.length],
    ['Total Students:', totalStudents],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Room', 'Floor', 'Departments & Years', 'Students', 'Dimensions']
  ];
  
  // Add room summary rows
  arrangements.forEach(arr => {
    // Get department info with years
    const departmentsWithYears = getDepartmentsWithYears(arr);
    const departmentText = departmentsWithYears
      .map(item => formatDepartmentWithYear(item.department, item.year))
      .join(', ');
    
    summaryData.push([
      arr.room_no,
      arr.floor_no,
      departmentText,
      arr.seating_assignments.length,
      `${arr.rows} × ${arr.columns}`
    ]);
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  const wscols = [
    { wch: 10 }, // Room column width
    { wch: 10 }, // Floor column width
    { wch: 50 }, // Departments column width
    { wch: 10 }, // Students column width
    { wch: 15 }  // Dimensions column width
  ];
  worksheet['!cols'] = wscols;
  
  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
}

function addRoomSheet(workbook: XLSX.WorkBook, arrangement: SeatingArrangement) {
  const sheetName = `Room ${arrangement.room_no}`;
  
  // Create room data
  const roomData = [
    [`Room ${arrangement.room_no}, Floor ${arrangement.floor_no} - Seating Plan`],
    [],
    ['Dimensions:', `${arrangement.rows} rows × ${arrangement.columns} columns`],
    ['Total Students:', arrangement.seating_assignments.length],
    []
  ];
  
  // Add department info with years
  const departmentsWithYears = getDepartmentsWithYears(arrangement);
  if (departmentsWithYears.length > 0) {
    roomData.push(['Departments:']);
    departmentsWithYears.forEach(item => {
      const deptText = formatDepartmentWithYear(item.department, item.year);
      roomData.push(['', deptText]);
    });
    roomData.push([]);
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
  
  // Add student tables for each prefix group
  sortedPrefixes.forEach(prefix => {
    const students = studentGroups[prefix];
    
    // Skip empty groups
    if (!students || students.length === 0) return;
    
    // Sort students by seat number
    students.sort((a: any, b: any) => {
      if (!a.seat_no || !b.seat_no) return 0;
      return a.seat_no.localeCompare(b.seat_no);
    });
    
    // Get department name for this group
    const departmentConfig = arrangement.department_configs.find(
      config => config.prefix === prefix
    );
    
    const departmentName = departmentConfig?.department || 'Unknown';
    const yearInfo = departmentConfig?.year ? ` (${departmentConfig.year})` : '';
    const groupTitle = `${departmentName}${yearInfo} - Seat Series ${prefix}`;
    
    roomData.push([groupTitle]);
    roomData.push(['Seat No', 'Registration No', 'Department & Year', 'Student Name']);
    
    students.forEach((student: any) => {
      // Find the department config for this student to get year info
      const deptConfig = arrangement.department_configs.find(
        config => config.department === student.department
      );
      const formattedDept = deptConfig && student.department ? 
        formatDepartmentWithYear(student.department, deptConfig.year) : 
        (student.department || 'Unknown');
        
      roomData.push([
        student.seat_no || '',
        student.reg_no || '',
        formattedDept,
        student.student_name || ''
      ]);
    });
    
    roomData.push([]);
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(roomData);
  
  // Set column widths
  const wscols = [
    { wch: 10 }, // First column width
    { wch: 15 }, // Second column width
    { wch: 30 }, // Third column width
    { wch: 30 }  // Fourth column width
  ];
  worksheet['!cols'] = wscols;
  
  // Add to workbook
  let finalSheetName = sheetName;
  // Excel has a 31 character limit for sheet names
  if (finalSheetName.length > 31) {
    finalSheetName = finalSheetName.substring(0, 31);
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);
}
