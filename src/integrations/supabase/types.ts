export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          capacity: string
          created_at: string
          department: string | null
          id: string
          name: string
          section: string
          updated_at: string
        }
        Insert: {
          capacity: string
          created_at?: string
          department?: string | null
          id?: string
          name: string
          section: string
          updated_at?: string
        }
        Update: {
          capacity?: string
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      department_configs: {
        Row: {
          arrangement_id: string | null
          created_at: string
          department: string
          end_reg_no: string
          id: string
          prefix: string
          start_reg_no: string
          updated_at: string
          year: string | null
        }
        Insert: {
          arrangement_id?: string | null
          created_at?: string
          department: string
          end_reg_no: string
          id?: string
          prefix: string
          start_reg_no: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          arrangement_id?: string | null
          created_at?: string
          department?: string
          end_reg_no?: string
          id?: string
          prefix?: string
          start_reg_no?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_configs_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "seating_arrangements"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attendance: {
        Row: {
          created_at: string
          exam_id: string | null
          id: string
          seat_number: string
          student_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id?: string | null
          id?: string
          seat_number: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string | null
          id?: string
          seat_number?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attendance_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_attendance_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_attendance_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_attendance_history"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exam_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exam_attendance_exam"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_attendance_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "fk_exam_attendance_exam"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exam_attendance_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_attendance_history"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_exam_attendance_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exam_attendance_teacher"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_centers: {
        Row: {
          code: string
          created_at: string
          department: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          center_id: string | null
          created_at: string
          date: string
          duration: string
          id: string
          start_time: string
          subject: string
          updated_at: string
          venue: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          date: string
          duration: string
          id?: string
          start_time: string
          subject: string
          updated_at?: string
          venue: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          date?: string
          duration?: string
          id?: string
          start_time?: string
          subject?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "exam_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_arrangements: {
        Row: {
          columns: number
          created_at: string
          exam_id: string | null
          floor_no: string
          id: string
          room_no: string
          rows: number
          updated_at: string
        }
        Insert: {
          columns: number
          created_at?: string
          exam_id?: string | null
          floor_no: string
          id?: string
          room_no: string
          rows: number
          updated_at?: string
        }
        Update: {
          columns?: number
          created_at?: string
          exam_id?: string | null
          floor_no?: string
          id?: string
          room_no?: string
          rows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_seating_arrangements_exam"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_attendance_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "fk_seating_arrangements_exam"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_arrangements_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_attendance_summary"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "seating_arrangements_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_assignments: {
        Row: {
          arrangement_id: string | null
          created_at: string
          department: string | null
          id: string
          position: number
          reg_no: string | null
          seat_no: string
          student_name: string | null
          updated_at: string
        }
        Insert: {
          arrangement_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          position: number
          reg_no?: string | null
          seat_no: string
          student_name?: string | null
          updated_at?: string
        }
        Update: {
          arrangement_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          position?: number
          reg_no?: string | null
          seat_no?: string
          student_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_seating_assignments_arrangement"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "seating_arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_assignments_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "seating_arrangements"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          department: string | null
          id: string
          name: string
          roll_number: string
          signature: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          name: string
          roll_number: string
          signature?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          roll_number?: string
          signature?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          credits: string
          department: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits: string
          department?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: string
          department?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string
          department: string | null
          employee_id: string
          id: string
          name: string
          signature: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id: string
          id?: string
          name: string
          signature?: string | null
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id?: string
          id?: string
          name?: string
          signature?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      exam_attendance_summary: {
        Row: {
          center_name: string | null
          date: string | null
          exam_id: string | null
          start_time: string | null
          subject: string | null
          total_attendance: number | null
          total_students: number | null
          venue: string | null
        }
        Relationships: []
      }
      student_attendance_history: {
        Row: {
          attended: boolean | null
          exam_date: string | null
          roll_number: string | null
          start_time: string | null
          student_id: string | null
          student_name: string | null
          subject: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
