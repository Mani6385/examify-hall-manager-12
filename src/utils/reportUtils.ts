
import { DEFAULT_HALLS, getHallNameById as getHallNameByIdFromUtils, Hall, removeHall as removeHallFromUtils } from './hallUtils';

// Use the halls from hallUtils - create a deep copy to prevent modifications
export const HALLS = JSON.parse(JSON.stringify(DEFAULT_HALLS));

export interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  student_name?: string | null;
  subject: string | null;
  seating_arrangements?: {
    id: string;
    room_no: string;
    floor_no: string;
  };
}

export interface DepartmentConfig {
  id: string;
  department: string;
  start_reg_no: string;
  end_reg_no: string;
  prefix: string;
  // Make year explicitly optional to match database structure
  year?: string | null;
}

export interface SeatingArrangement {
  id: string;
  room_no: string;
  floor_no: string;
  rows: number;
  columns: number;
  hall_name?: string; // Added this property as optional
  hall_id?: string;   // Added for reference to the hall
  seating_assignments: {
    id: string;
    seat_no: string;
    student_name: string | null;
    reg_no: string | null;
    department: string | null;
  }[];
  department_configs: DepartmentConfig[];
}

// Helper function to filter arrangements by hall
export const filterArrangementsByHall = (
  arrangements: SeatingArrangement[],
  hallId: string
): SeatingArrangement[] => {
  if (!hallId || hallId === "all") return arrangements;
  
  return arrangements.filter(arrangement => {
    // If arrangement already has a hall_id, use that
    if (arrangement.hall_id) {
      return arrangement.hall_id === hallId;
    }
    
    // Otherwise map rooms to halls based on logic
    const roomFirstDigit = arrangement.room_no.charAt(0);
    const mappedHallId = roomFirstDigit === '1' ? '1' : 
                         roomFirstDigit === '2' ? '2' : '3';
    
    // Assign hall_name to the arrangement if it's not already set
    arrangement.hall_id = mappedHallId;
    arrangement.hall_name = getHallNameById(mappedHallId);
    
    return mappedHallId === hallId;
  });
};

// Get hall name by ID - reusing from hallUtils
export const getHallNameById = getHallNameByIdFromUtils;

// Remove hall by ID - reusing from hallUtils
export const removeHall = removeHallFromUtils;

// Helper function to format department and year information consistently
export const formatDepartmentWithYear = (department: string, year?: string | null): string => {
  if (!department) return 'Not specified';
  return year ? `${department} (${year})` : department;
};

// Helper function to extract department and year from seating arrangement
export const getDepartmentsWithYears = (arrangement: SeatingArrangement): {department: string, year: string | null}[] => {
  // Extract unique departments and years from the department configs
  return arrangement.department_configs
    .filter(config => config.department)
    .map(config => ({
      department: config.department,
      year: config.year || null
    }));
};

// Format a list of departments and years for display
export const formatDepartmentsWithYears = (arrangement: SeatingArrangement): string => {
  const departmentsWithYears = getDepartmentsWithYears(arrangement);
  
  if (departmentsWithYears.length === 0) return 'Not specified';
  
  return departmentsWithYears
    .map(item => formatDepartmentWithYear(item.department, item.year))
    .join(', ');
};

// Get registration number range for a department
export const getRegNumberRange = (deptConfig: DepartmentConfig): string => {
  if (!deptConfig.start_reg_no || !deptConfig.end_reg_no) {
    return 'Not specified';
  }
  return `${deptConfig.start_reg_no} - ${deptConfig.end_reg_no}`;
};

// Helper for consolidated report data generation
export const generateConsolidatedReportData = (arrangements: SeatingArrangement[]) => {
  // Create data structure for consolidated report
  const consolidatedData = arrangements.map((arrangement, index) => {
    // Group students by department with year information
    const deptGroups = new Map<string, {students: any[], year: string | null, regRange: string}>();
    
    // First, collect reg number ranges from department_configs
    const deptConfigMap = new Map<string, string>();
    arrangement.department_configs.forEach(config => {
      if (config.department && config.start_reg_no && config.end_reg_no) {
        deptConfigMap.set(config.department, `${config.start_reg_no} - ${config.end_reg_no}`);
      }
    });
    
    arrangement.seating_assignments.forEach(assignment => {
      if (!assignment.department) return;
      
      // Find matching department config
      const deptConfig = arrangement.department_configs.find(
        config => config.department === assignment.department
      );
      
      const key = assignment.department || 'Unassigned';
      const year = deptConfig?.year || null;
      // Get reg number range from the map
      const regRange = deptConfigMap.get(key) || 'Not specified';
      
      if (!deptGroups.has(key)) {
        deptGroups.set(key, {students: [], year, regRange});
      }
      deptGroups.get(key)?.students.push(assignment);
    });
    
    // Convert to array structure for reporting
    const departmentRows = Array.from(deptGroups.entries()).map(([dept, {students, year, regRange}], deptIndex) => {
      // Sort students by reg_no
      students.sort((a, b) => (a.reg_no || '').localeCompare(b.reg_no || ''));
      
      // Group consecutive registration numbers
      const regGroups: {start: string; end: string}[] = [];
      let currentGroup: {start: string; end: string} | null = null;
      
      students.forEach((student, idx) => {
        const currentRegNo = student.reg_no || '';
        
        // For the first student or when starting a new group
        if (currentGroup === null) {
          currentGroup = { start: currentRegNo, end: currentRegNo };
          return;
        }
        
        // Simple check for sequential reg numbers
        const prevNumeric = parseInt(currentGroup.end.replace(/\D/g, ''));
        const currNumeric = parseInt(currentRegNo.replace(/\d/g, ''));
        
        if (currNumeric === prevNumeric + 1 && currentRegNo.replace(/\d/g, '') === currentGroup.end.replace(/\d/g, '')) {
          // Update the end of the current group
          currentGroup.end = currentRegNo;
        } else {
          // Finish the current group and start a new one
          regGroups.push(currentGroup);
          currentGroup = { start: currentRegNo, end: currentRegNo };
        }
        
        // For the last student, add the current group
        if (idx === students.length - 1 && currentGroup) {
          regGroups.push(currentGroup);
        }
      });
      
      // Format the registration number ranges
      const regRanges = regGroups.map(group => {
        if (group.start === group.end) {
          return group.start;
        } else {
          return `${group.start}-${group.end}`;
        }
      }).join(', ');
      
      return {
        rowIndex: index + 1,
        roomNo: arrangement.room_no,
        department: dept,
        year: year || 'N/A',
        regNumbers: regRanges,
        regRange: regRange, // Add the configured reg number range
        studentCount: students.length,
        isFirstDeptInRoom: deptIndex === 0
      };
    });
    
    return {
      room: arrangement.room_no,
      floor: arrangement.floor_no,
      departmentRows: departmentRows,
      totalStudents: arrangement.seating_assignments.length
    };
  });
  
  return consolidatedData;
};
