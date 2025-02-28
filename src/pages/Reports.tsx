
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useState } from "react";
import { File, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface SeatingAssignment {
  id: string;
  seat_no: string;
  reg_no: string | null;
  department: string | null;
  subject: string | null;
  seating_arrangements: {
    id: string;
    room_no: string;
    floor_no: string;
  };
}

// Define hall data since we don't have a halls table in the database
const HALLS = [
  { id: '1', name: 'Hall A', capacity: 30 },
  { id: '2', name: 'Hall B', capacity: 40 },
  { id: '3', name: 'Hall C', capacity: 50 }
];

const Reports = () => {
  const { toast } = useToast();
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [selectedHall, setSelectedHall] = useState<string>("");

  const { data: allSeatingArrangements = [], isLoading } = useQuery({
    queryKey: ['all-seating-arrangements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select(`
          id,
          room_no,
          floor_no,
          rows,
          columns,
          seating_assignments (
            id,
            seat_no,
            reg_no,
            department,
            student_name
          )
        `)
        .order('room_no');

      if (error) throw error;
      return data;
    },
  });

  // Filter the data based on the selected hall
  const filteredArrangements = selectedHall 
    ? allSeatingArrangements.filter(arrangement => {
        // Map rooms to halls (just for demonstration)
        // In a real app, this mapping would come from the database
        const roomFirstDigit = arrangement.room_no.charAt(0);
        const hallId = roomFirstDigit === '1' ? '1' : 
                       roomFirstDigit === '2' ? '2' : '3';
        return hallId === selectedHall;
      })
    : allSeatingArrangements;

  const generateConsolidatedExcel = async () => {
    try {
      setIsLoadingExcel(true);
      
      const wb = XLSX.utils.book_new();
      
      // Prepare data for the consolidated view
      const consolidatedData = filteredArrangements.map(arrangement => {
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
      const hallName = selectedHall ? HALLS.find(h => h.id === selectedHall)?.name || 'Selected Hall' : 'All Halls';
      
      XLSX.utils.sheet_add_aoa(ws, [
        ["DEPARTMENT OF COMPUTER SCIENCE AND BCA"],
        [`SEATING PLAN - ${hallName} (EXAM DATE)`],
        [],
      ], { origin: "A1" });

      XLSX.utils.book_append_sheet(wb, ws, "Seating Plan");

      // Save the file
      XLSX.writeFile(wb, `seating-plan-${hallName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
      
      toast({
        title: "Success",
        description: `${hallName} seating plan Excel file generated successfully`,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate seating plan Excel file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const generateConsolidatedPDF = async () => {
    try {
      setIsLoadingPdf(true);

      const doc = new jsPDF();
      
      // Add title
      const hallName = selectedHall ? HALLS.find(h => h.id === selectedHall)?.name || 'Selected Hall' : 'All Halls';
      
      doc.setFontSize(16);
      doc.text("DEPARTMENT OF COMPUTER SCIENCE AND BCA", doc.internal.pageSize.width / 2, 15, { align: "center" });
      doc.setFontSize(14);
      doc.text(`SEATING PLAN - ${hallName} (EXAM DATE)`, doc.internal.pageSize.width / 2, 25, { align: "center" });

      // Prepare data for the table
      const tableData = filteredArrangements.map(arrangement => {
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
      
      toast({
        title: "Success",
        description: `${hallName} seating plan PDF file generated successfully`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate seating plan PDF file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seating Plan Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate consolidated seating arrangements reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hall-wise Reports</CardTitle>
            <CardDescription>
              Filter and generate reports by hall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Select value={selectedHall} onValueChange={setSelectedHall}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select Hall" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Halls</SelectItem>
                    {HALLS.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={generateConsolidatedPDF}
                    disabled={isLoading || isLoadingPdf}
                  >
                    {isLoadingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateConsolidatedExcel}
                    disabled={isLoading || isLoadingExcel}
                  >
                    {isLoadingExcel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <File className="mr-2 h-4 w-4" />
                        Download Excel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredArrangements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArrangements.map((arrangement) => (
                          <TableRow key={arrangement.id}>
                            <TableCell className="font-medium">{arrangement.room_no}</TableCell>
                            <TableCell>{arrangement.floor_no}</TableCell>
                            <TableCell>{arrangement.rows} × {arrangement.columns}</TableCell>
                            <TableCell>{arrangement.seating_assignments.length}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No seating arrangements found {selectedHall && "for this hall"}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consolidated Reports</CardTitle>
              <CardDescription>
                Download a consolidated view of all seating arrangements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={generateConsolidatedPDF}
                  disabled={isLoading || isLoadingPdf}
                >
                  {isLoadingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateConsolidatedExcel}
                  disabled={isLoading || isLoadingExcel}
                >
                  {isLoadingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <File className="mr-2 h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
