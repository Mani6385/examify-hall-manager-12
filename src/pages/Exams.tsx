
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Exam {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  duration: string;
  venue: string;
  centerName: string;
  centerCode: string;
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    date: "",
    startTime: "",
    duration: "",
    venue: "",
    centerName: "",
    centerCode: "",
  });
  const { toast } = useToast();

  // Mock data for exam centers
  const examCenters = [
    { name: "Engineering Block", code: "ENG-01" },
    { name: "Science Block", code: "SCI-01" },
    { name: "Arts Block", code: "ART-01" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExam) {
      // Edit existing exam
      setExams(exams.map(exam => 
        exam.id === selectedExam.id 
          ? { ...exam, ...formData }
          : exam
      ));
      toast({
        title: "Exam Updated",
        description: "Exam information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    } else {
      // Add new exam
      const newExam = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
      };
      setExams([...exams, newExam]);
      toast({
        title: "Exam Added",
        description: "New exam has been added successfully.",
      });
      setIsAddDialogOpen(false);
    }
    setFormData({
      subject: "",
      date: "",
      startTime: "",
      duration: "",
      venue: "",
      centerName: "",
      centerCode: "",
    });
    setSelectedExam(null);
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setFormData({
      subject: exam.subject,
      date: exam.date,
      startTime: exam.startTime,
      duration: exam.duration,
      venue: exam.venue,
      centerName: exam.centerName,
      centerCode: exam.centerCode,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setExams(exams.filter(exam => exam.id !== id));
    toast({
      title: "Exam Deleted",
      description: "Exam has been removed successfully.",
      variant: "destructive",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Exams</h2>
            <p className="text-muted-foreground mt-2">
              Manage examination schedules and details
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerName">Exam Center</Label>
                  <Select 
                    value={formData.centerName}
                    onValueChange={(value) => {
                      const center = examCenters.find(c => c.name === value);
                      setFormData({ 
                        ...formData, 
                        centerName: value,
                        centerCode: center?.code || ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {examCenters.map((center) => (
                        <SelectItem key={center.code} value={center.name}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerCode">Center Code</Label>
                  <Input
                    id="centerCode"
                    value={formData.centerCode}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="1.5">1.5 hours</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="2.5">2.5 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Exam
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exam</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-centerName">Exam Center</Label>
                <Select 
                  value={formData.centerName}
                  onValueChange={(value) => {
                    const center = examCenters.find(c => c.name === value);
                    setFormData({ 
                      ...formData, 
                      centerName: value,
                      centerCode: center?.code || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Center" />
                  </SelectTrigger>
                  <SelectContent>
                    {examCenters.map((center) => (
                      <SelectItem key={center.code} value={center.name}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-centerCode">Center Code</Label>
                <Input
                  id="edit-centerCode"
                  value={formData.centerCode}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (hours)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="2.5">2.5 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-venue">Venue</Label>
                <Input
                  id="edit-venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Update Exam
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Center</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.centerName}</TableCell>
                  <TableCell>{exam.centerCode}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>{exam.startTime}</TableCell>
                  <TableCell>{exam.duration} hours</TableCell>
                  <TableCell>{exam.venue}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(exam)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No exams found. Add your first exam to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Exams;
