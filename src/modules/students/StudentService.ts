
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import type { Database } from "@/integrations/supabase/types";

type Student = Database['public']['Tables']['students']['Row'];

// Function to fetch all students
export async function fetchStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

// Function to fetch all teachers
export async function fetchTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

// Function to add a new student
export async function addStudent(newStudent: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('students')
    .insert([newStudent])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Function to update a student
export async function updateStudent({ id, ...updateData }: Partial<Student> & { id: string }) {
  const { data, error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Function to delete a student
export async function deleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Function to import students from Excel file
export function parseExcelFile(event: React.ChangeEvent<HTMLInputElement>) {
  return new Promise<{
    formattedData: Omit<Student, 'id' | 'created_at' | 'updated_at'>[];
    duplicatesInFile: string[];
  }>((resolve, reject) => {
    const file = event.target.files?.[0];
    if (!file) {
      reject(new Error("No file selected"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
          roll_number: string;
          name: string;
          department: string;
          signature?: string;
        }>;

        const formattedData = data.map(row => ({
          roll_number: String(row.roll_number).trim(),
          name: String(row.name).trim(),
          department: String(row.department).trim(),
          signature: row.signature ? String(row.signature) : null,
        }));

        // Check for duplicates within the imported data
        const rollNumbers = formattedData.map(s => s.roll_number);
        const duplicatesInFile = rollNumbers.filter((item, index) => rollNumbers.indexOf(item) !== index);
        
        resolve({ formattedData, duplicatesInFile });
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
}

// Function to bulk import students
export async function bulkImportStudents(students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('students')
    .insert(students)
    .select();
  
  if (error) throw error;
  return data;
}

// Function to bulk update students
export async function bulkUpdateStudents(students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) {
  // For each student that already exists, update them
  const promises = students.map(async (student) => {
    const { error } = await supabase
      .from('students')
      .update({
        name: student.name,
        department: student.department,
        signature: student.signature
      })
      .eq('roll_number', student.roll_number);
    
    if (error) throw error;
  });
  
  await Promise.all(promises);
  return students;
}
