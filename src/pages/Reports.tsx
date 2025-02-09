
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
  centerName: string;
  centerCode: string;
  roomNo: string;
  floorNo: string;
  timestamp: string;
  seats: Seat[];
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      // Add header
      doc.setFontSize(16);
      doc.text("Exam Hall Seating Arrangement", doc.internal.pageSize.width/2, 20, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(12);
      const startY = 40;
      const lineHeight = 8;
      
      doc.text(`Center Name: ${seatingData.centerName}`, 20, startY);
      doc.text(`Center Code: ${seatingData.centerCode}`, 20, startY + lineHeight);
      doc.text(`Room No: ${seatingData.roomNo}`, 20, startY + 2 * lineHeight);
      doc.text(`Floor No: ${seatingData.floorNo}`, 20, startY + 3 * lineHeight);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, startY + 4 * lineHeight);

      // Table configuration
      const headers = ["Seat No", "Reg No", "Department"];
      const columnWidths = [40, 50, 70];
      const startTableY = startY + 6 * lineHeight;
      let currentY = startTableY;

      // Draw table header
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 6, doc.internal.pageSize.width - 40, 8, 'F');
      let currentX = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, currentX, currentY);
        currentX += columnWidths[index];
      });
      
      currentY += 10;

      // Draw table content
      seatingData.seats.forEach((seat, index) => {
        // Add new page if needed
        if (currentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 20;
        }

        // Draw row
        currentX = 20;
        const rowData = [
          seat.seatNo,
          seat.regNo || "-",
          seat.department || "-"
        ];

        // Add cell borders and content
        rowData.forEach((text, colIndex) => {
          doc.rect(currentX, currentY - 6, columnWidths[colIndex], 8);
          doc.text(text, currentX + 2, currentY);
          currentX += columnWidths[colIndex];
        });

        currentY += 10;
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
      const ws = XLSX.utils.json_to_sheet([
        {
          "Center Name": seatingData.centerName,
          "Center Code": seatingData.centerCode,
          "Room No": seatingData.roomNo,
          "Floor No": seatingData.floorNo
        },
        ...excelData
      ]);
      
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
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Center Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Center Name:</span>
                  <p>{seatingData.centerName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Center Code:</span>
                  <p>{seatingData.centerCode}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Room No:</span>
                  <p>{seatingData.roomNo}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Floor No:</span>
                  <p>{seatingData.floorNo}</p>
                </div>
              </div>
            </div>

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

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Preview</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Seat No</th>
                      <th className="px-4 py-2 text-left">Registration No</th>
                      <th className="px-4 py-2 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatingData.seats.map((seat) => (
                      <tr key={seat.id} className="border-t">
                        <td className="px-4 py-2">{seat.seatNo}</td>
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
