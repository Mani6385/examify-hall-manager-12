
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Seat } from "@/utils/studentUtils";
import { DepartmentConfig } from "@/utils/departmentUtils";
import { getPrintableId, printElement } from '@/utils/hallUtils';

interface VisualSeatingChartProps {
  seats: Seat[];
  rows: number;
  cols: number;
  departments: DepartmentConfig[];
}

export const VisualSeatingChart = ({
  seats,
  rows,
  cols,
  departments
}: VisualSeatingChartProps) => {
  const printableId = useRef(getPrintableId());

  const handlePrint = () => {
    printElement(printableId.current);
  };

  if (seats.length === 0) {
    return null;
  }

  // Create a grid layout for the seats
  const grid: Seat[][] = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      const index = i * cols + j;
      grid[i][j] = index < seats.length ? seats[index] : null;
    }
  }

  // Get department color
  const getDepartmentColor = (department: string) => {
    if (!department) return 'bg-gray-200';
    const index = departments.findIndex(d => d.department === department);
    if (index === -1) return 'bg-gray-200';
    
    switch (index % 6) {
      case 0: return 'bg-blue-200 border-blue-400';
      case 1: return 'bg-green-200 border-green-400';
      case 2: return 'bg-yellow-200 border-yellow-400';
      case 3: return 'bg-purple-200 border-purple-400';
      case 4: return 'bg-pink-200 border-pink-400';
      case 5: return 'bg-orange-200 border-orange-400';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Visual Seating Arrangement</h3>
        <Button 
          onClick={handlePrint}
          variant="outline"
          className="hover:bg-blue-50 transition-colors"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Seating Chart
        </Button>
      </div>

      <div 
        id={printableId.current}
        className="p-4 bg-white print:m-0 print:p-0"
      >
        <div className="mb-4 print:mb-8">
          <h2 className="text-2xl font-bold text-center">Exam Hall Seating Chart</h2>
          <p className="text-center text-gray-500">Total seats: {seats.length} ({rows} rows × {cols} columns)</p>
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap gap-4 mb-4 print:mb-8">
          {departments.filter(d => d.department).map((dept, i) => (
            <div key={dept.id} className="flex items-center">
              <div className={`w-4 h-4 mr-2 ${getDepartmentColor(dept.department)}`}></div>
              <span className="text-sm">{dept.department}</span>
            </div>
          ))}
        </div>

        {/* Visual grid */}
        <div className="border border-gray-300 inline-block">
          <div className="grid" style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(90px, 1fr))`,
            gap: '1px',
            backgroundColor: '#e5e7eb'
          }}>
            {grid.map((row, rowIndex) => (
              row.map((seat, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`p-3 h-24 ${
                    seat ? getDepartmentColor(seat.department) : 'bg-gray-100'
                  } border border-gray-200 flex flex-col justify-center items-center text-sm relative`}
                >
                  {seat && (
                    <>
                      <div className="font-bold">{seat.seatNo}</div>
                      <div className="truncate max-w-full text-xs">{seat.studentName}</div>
                      <div className="text-xs text-gray-600">{seat.regNo}</div>
                    </>
                  )}
                </div>
              ))
            ))}
          </div>
        </div>
        
        {/* Print-only information (appears at bottom of printed page) */}
        <div className="hidden print:block mt-8 text-sm text-gray-500">
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};
