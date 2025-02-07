
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Grid3X3, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Seat {
  id: number;
  studentName: string | null;
}

const Seating = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [rows, setRows] = useState(5);
  const [cols, setColumns] = useState(6);
  const [seats, setSeats] = useState<Seat[]>([]);
  const { toast } = useToast();

  // Mock data - replace with actual data from your Classes component
  const classes = [
    { id: "1", name: "Class A" },
    { id: "2", name: "Class B" },
    { id: "3", name: "Class C" },
  ];

  // Mock student data - replace with actual data from your Students component
  const students = [
    "John Doe",
    "Jane Smith",
    "Alice Johnson",
    "Bob Wilson",
    "Carol Brown",
    "David Miller",
    "Emma Davis",
    "Frank Thomas",
    "Grace Lee",
    "Henry White",
  ];

  const generateSeating = () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    // Create an array of all seats
    const totalSeats = rows * cols;
    const emptySeats: Seat[] = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      studentName: null,
    }));

    // Shuffle students and assign them to seats
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    const assignedSeats = emptySeats.map((seat, index) => ({
      ...seat,
      studentName: index < shuffledStudents.length ? shuffledStudents[index] : null,
    }));

    setSeats(assignedSeats);
    toast({
      title: "Success",
      description: "Seating arrangement generated successfully",
    });
  };

  const rotateStudents = (direction: 'left' | 'right') => {
    if (seats.length === 0) return;

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

    setSeats(newSeats);
    toast({
      title: "Success",
      description: `Students rotated ${direction}`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seating Arrangement</h2>
          <p className="text-muted-foreground mt-2">
            Generate and manage classroom seating arrangements
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={generateSeating}>
            <Grid3X3 className="mr-2 h-4 w-4" />
            Generate Seating
          </Button>

          <Button
            variant="outline"
            onClick={() => rotateStudents('left')}
            disabled={seats.length === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Rotate Left
          </Button>

          <Button
            variant="outline"
            onClick={() => rotateStudents('right')}
            disabled={seats.length === 0}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Rotate Right
          </Button>

          <Button
            variant="outline"
            onClick={() => setSeats([])}
            disabled={seats.length === 0}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {seats.length > 0 && (
          <div className="grid gap-4" style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}>
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`p-4 rounded-lg border ${
                  seat.studentName
                    ? "bg-primary/10 border-primary/20"
                    : "bg-muted border-muted-foreground/20"
                } flex items-center justify-center text-center min-h-[100px]`}
              >
                {seat.studentName || "Empty"}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Seating;
