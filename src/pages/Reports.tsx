
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

interface Seat {
  id: number;
  seatNo: string;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
}

interface SeatingArrangement {
  dept1: string;
  dept2: string;
  startRegNo1: string;
  endRegNo1: string;
  startRegNo2: string;
  endRegNo2: string;
  timestamp: string;
  seats: Seat[];
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get seating data from localStorage if available
  const getSeatingData = (): SeatingArrangement | null => {
    const storedData = localStorage.getItem('seatingArrangement');
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  };

  const seatingData = getSeatingData();

  const generatePDF = () => {
    if (!seatingData) return;
    
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Exam Hall Seating Arrangement", 20, 20);
      
      // Add metadata
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Department 1: ${seatingData.dept1}`, 20, 40);
      doc.text(`Department 2: ${seatingData.dept2}`, 20, 50);
      
      // Add table headers
      const headers = ["Seat No", "Student Name", "Reg No", "Department"];
      let yPos = 70;
      const xPos = 20;
      
      doc.setFontSize(12);
      doc.text(headers.join("    "), xPos, yPos);
      
      // Add table content
      seatingData.seats.forEach((seat, index) => {
        yPos += 10;
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        const row = [
          seat.seatNo,
          seat.studentName || "Empty",
          seat.regNo || "-",
          seat.department || "-"
        ];
        
        doc.text(row.join("    "), xPos, yPos);
      });
      
      // Save the PDF
      doc.save("seating-arrangement.pdf");
      
      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const generateExcel = () => {
    if (!seatingData) return;

    try {
      // Prepare data for Excel
      const excelData = seatingData.seats.map(seat => ({
        "Seat No": seat.seatNo,
        "Student Name": seat.studentName || "Empty",
        "Registration No": seat.regNo || "-",
        "Department": seat.department || "-"
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Seating Arrangement");
      
      // Save the file
      XLSX.writeFile(wb, "seating-arrangement.xlsx");
      
      toast({
        title: "Success",
        description: "Excel file generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Generate seating arrangement reports in different formats
          </p>
        </div>

        {!seatingData || !seatingData.seats?.length ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No seating arrangement data available</p>
            <Button onClick={() => navigate('/seating')} variant="outline">
              Go to Seating Management
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              <Button onClick={generatePDF} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export as PDF
              </Button>
              
              <Button onClick={generateExcel} variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel
              </Button>
            </div>

            {/* Preview section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Preview</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Seat No</th>
                      <th className="px-4 py-2 text-left">Student Name</th>
                      <th className="px-4 py-2 text-left">Registration No</th>
                      <th className="px-4 py-2 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatingData.seats.map((seat) => (
                      <tr key={seat.id} className="border-t">
                        <td className="px-4 py-2">{seat.seatNo}</td>
                        <td className="px-4 py-2">{seat.studentName || "Empty"}</td>
                        <td className="px-4 py-2">{seat.regNo || "-"}</td>
                        <td className="px-4 py-2">{seat.department || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

