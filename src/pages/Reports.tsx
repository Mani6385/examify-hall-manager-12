
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface Seat {
  id: number;
  studentName: string | null;
  regNo: string | null;
  department: string | null;
}

const Reports = () => {
  const { toast } = useToast();

  // Mock seating data - in a real app, this would come from your state or API
  const mockSeatingData: Seat[] = [
    {
      id: 1,
      studentName: "Computer Science - A001",
      regNo: "001",
      department: "Computer Science"
    },
    {
      id: 2,
      studentName: "Electronics - A001",
      regNo: "001",
      department: "Electronics"
    },
    // ... Add more mock data as needed
  ];

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Exam Hall Seating Arrangement", 20, 20);
      
      // Add metadata
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add table headers
      const headers = ["Seat No", "Student Name", "Reg No", "Department"];
      let yPos = 40;
      const xPos = 20;
      
      doc.setFontSize(12);
      doc.text(headers.join("    "), xPos, yPos);
      
      // Add table content
      mockSeatingData.forEach((seat, index) => {
        yPos += 10;
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        const row = [
          seat.id,
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
    try {
      // Prepare data for Excel
      const excelData = mockSeatingData.map(seat => ({
        "Seat No": seat.id,
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
          <div className="border rounded-lg overflow-hidden">
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
                {mockSeatingData.map((seat) => (
                  <tr key={seat.id} className="border-t">
                    <td className="px-4 py-2">{seat.id}</td>
                    <td className="px-4 py-2">{seat.studentName || "Empty"}</td>
                    <td className="px-4 py-2">{seat.regNo || "-"}</td>
                    <td className="px-4 py-2">{seat.department || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
