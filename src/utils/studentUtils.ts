
import { DepartmentConfig, Student } from "./departmentUtils";

// Generates a list of students based on department configuration
export const generateStudentList = (
  deptConfig: DepartmentConfig,
  departmentsList: any[]
): Student[] => {
  const students: Student[] = [];
  
  if (!deptConfig.startRegNo || !deptConfig.endRegNo || !deptConfig.department) {
    return students;
  }
  
  const start = parseInt(deptConfig.startRegNo);
  const end = parseInt(deptConfig.endRegNo);
  
  if (isNaN(start) || isNaN(end) || end < start) {
    return students;
  }
  
  const subject = departmentsList.find(d => d.name === deptConfig.department);
  const departmentName = subject?.department || 'Unknown Department';
  const subjectName = subject?.name || deptConfig.department;
  const subjectCode = subject?.code;
  
  // Start from seat 1 for each department series
  for (let i = start, seatNum = 1; i <= end; i++, seatNum++) {
    students.push({
      name: `${departmentName} Student`,
      regNo: i.toString().padStart(3, '0'),
      department: departmentName,
      subjectCode: subjectCode,
      subjectName: subjectName,
      // Format: A1, A2, etc. or B1, B2, etc. (no space between letter and number)
      seatNo: `${deptConfig.prefix}${seatNum}`
    });
  }
  
  return students;
};

export interface Seat {
  id: number;
  seatNo: string;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
}

// Generates the seating arrangement
export const generateSeatingArrangement = (
  departments: DepartmentConfig[],
  rows: number,
  cols: number,
  departmentsList: any[]
): Seat[] => {
  const totalSeats = rows * cols;
  
  // Group departments by series (A, B, C, D, E, F)
  const aSeriesDepts = departments.filter(dept => dept.prefix === 'A');
  const bSeriesDepts = departments.filter(dept => dept.prefix === 'B');
  const cSeriesDepts = departments.filter(dept => dept.prefix === 'C');
  const dSeriesDepts = departments.filter(dept => dept.prefix === 'D');
  const eSeriesDepts = departments.filter(dept => dept.prefix === 'E');
  const fSeriesDepts = departments.filter(dept => dept.prefix === 'F');
  
  // Generate all students from all departments
  const aSeriesStudents: Student[] = [];
  aSeriesDepts.forEach(dept => {
    aSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });
  
  const bSeriesStudents: Student[] = [];
  bSeriesDepts.forEach(dept => {
    bSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });

  const cSeriesStudents: Student[] = [];
  cSeriesDepts.forEach(dept => {
    cSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });
  
  const dSeriesStudents: Student[] = [];
  dSeriesDepts.forEach(dept => {
    dSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });

  const eSeriesStudents: Student[] = [];
  eSeriesDepts.forEach(dept => {
    eSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });
  
  const fSeriesStudents: Student[] = [];
  fSeriesDepts.forEach(dept => {
    fSeriesStudents.push(...generateStudentList(dept, departmentsList));
  });
  
  // Initialize seats with empty values
  const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
    id: index,
    seatNo: '',
    studentName: null,
    regNo: null,
    department: null,
  }));
  
  // Find maximum number of students across all series to determine iteration count
  const maxStudentsPerSeries = Math.max(
    aSeriesStudents.length, 
    bSeriesStudents.length,
    cSeriesStudents.length,
    dSeriesStudents.length,
    eSeriesStudents.length,
    fSeriesStudents.length
  );
  
  const assignedStudents: (Student | null)[] = Array(totalSeats).fill(null);
  
  // Assign students in A1, B1, C1, D1, E1, F1, A2, B2, ... pattern
  let seatIndex = 0;
  for (let i = 0; i < maxStudentsPerSeries; i++) {
    // Add A series student
    if (i < aSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = aSeriesStudents[i];
    }
    
    // Add B series student
    if (i < bSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = bSeriesStudents[i];
    }

    // Add C series student
    if (i < cSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = cSeriesStudents[i];
    }
    
    // Add D series student
    if (i < dSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = dSeriesStudents[i];
    }

    // Add E series student
    if (i < eSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = eSeriesStudents[i];
    }
    
    // Add F series student
    if (i < fSeriesStudents.length && seatIndex < totalSeats) {
      assignedStudents[seatIndex++] = fSeriesStudents[i];
    }
  }
  
  // Convert to the final seats format
  return emptySeats.map((seat, index) => {
    const student = assignedStudents[index];
    if (student) {
      return {
        ...seat,
        seatNo: student.seatNo,
        studentName: student.name,
        regNo: student.regNo,
        department: student.department,
        subjectCode: student.subjectCode,
        subjectName: student.subjectName,
      };
    }
    return seat;
  });
};

// Rotates students in the seating arrangement
export const rotateStudents = (seats: Seat[], direction: 'left' | 'right'): Seat[] => {
  if (seats.length === 0) return seats;

  const newSeats = [...seats];
  if (direction === 'right') {
    const lastSeat = newSeats[newSeats.length - 1];
    for (let i = newSeats.length - 1; i > 0; i--) {
      newSeats[i] = newSeats[i - 1];
    }
    newSeats[0] = lastSeat;
  } else {
    const firstSeat = newSeats[0];
    for (let i = 0; i < newSeats.length - 1; i++) {
      newSeats[i] = newSeats[i + 1];
    }
    newSeats[newSeats.length - 1] = firstSeat;
  }

  return newSeats;
};
