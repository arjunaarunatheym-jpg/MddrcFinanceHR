import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FeedbackManagement = ({ program, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [program.id]);

  const loadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`/feedback/templates/program/${program.id}`);
      // API returns an array of templates, get the most recent one
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Sort by created_at descending and get the first one (most recent)
        const sortedTemplates = response.data.sort((a, b) => 
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setQuestions(sortedTemplates[0].questions || []);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      // No template exists yet
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "rating",
        required: true
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    // Validate
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const emptyQuestion = questions.find(q => !q.question.trim());
    if (emptyQuestion) {
      toast.error("Please fill in all question fields");
      return;
    }

    try {
      await axiosInstance.post("/feedback/templates", {
        program_id: program.id,
        questions: questions
      });
      
      toast.success("Feedback template saved successfully!");
    } catch (error) {
      toast.error("Failed to save feedback template");
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('program_id', program.id);

      const response = await axiosInstance.post('/feedback/templates/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { total_uploaded, warnings } = response.data;
      
      let message = `✓ Successfully uploaded ${total_uploaded} feedback question(s)!`;
      if (warnings) {
        message += `\n⚠ ${warnings}`;
      }
      
      toast.success(message);
      setUploadDialogOpen(false);
      loadTemplate();
      
      e.target.value = '';
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to upload file";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Feedback Form - {program.name}</CardTitle>
            <CardDescription>Create custom feedback questions for participants</CardDescription>
          </div>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Question {index + 1}</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(index, "question", e.target.value)}
                          placeholder="Enter your feedback question..."
                          data-testid={`question-${index}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) => updateQuestion(index, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">Rating (1-5 Stars)</SelectItem>
                              <SelectItem value="text">Text Response</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Required</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteQuestion(index)}
                      data-testid={`delete-question-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-2 mb-4">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Feedback Questions</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file (.xlsx or .xls) with feedback questions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-blue-900">Excel Format Required:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>Program Name</strong> - Must match existing program</li>
                      <li>• <strong>Question Text</strong> - The feedback question</li>
                      <li>• <strong>Question Type</strong> - Use &quot;rating&quot;, &quot;multiple_choice&quot;, or &quot;text&quot;</li>
                      <li>• <strong>Options</strong> - For multiple choice, separate with commas</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">
                      Example: Defensive Riding | How was the training? | rating | (leave blank)
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-sm text-gray-600">
                        {uploading ? "Uploading..." : "Click to select Excel file"}
                      </span>
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleBulkUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full border-dashed border-2"
            data-testid="add-question-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>

          {questions.length > 0 && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={saveTemplate}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                data-testid="save-template-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Feedback Template
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackManagement;
