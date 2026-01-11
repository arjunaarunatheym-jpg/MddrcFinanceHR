import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Upload } from "lucide-react";

const TestManagement = ({ program, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [program.id]);

  const loadQuestions = async () => {
    try {
      const response = await axiosInstance.get(`/tests/program/${program.id}`);
      // Get pre-test questions (pre and post use same questions)
      const preTest = response.data.find(t => t.test_type === "pre");
      if (preTest) {
        setQuestions(preTest.questions || []);
      }
    } catch (error) {
      console.error("Failed to load questions");
    }
  };

  const handleAddQuestion = () => {
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
    });
    setAddDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    const filledOptions = newQuestion.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    const updatedQuestions = [...questions, newQuestion];
    await saveQuestionsToBackend(updatedQuestions);
    
    setQuestions(updatedQuestions);
    setAddDialogOpen(false);
    toast.success("Question added successfully");
  };

  const handleEditQuestion = (index) => {
    setEditingQuestion({ ...questions[index], index });
  };

  const handleUpdateQuestion = async () => {
    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestion.index] = {
      question: editingQuestion.question,
      options: editingQuestion.options,
      correct_answer: editingQuestion.correct_answer,
    };
    
    await saveQuestionsToBackend(updatedQuestions);
    setQuestions(updatedQuestions);
    setEditingQuestion(null);
    toast.success("Question updated successfully");
  };

  const handleDeleteQuestion = async (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    await saveQuestionsToBackend(updatedQuestions);
    setQuestions(updatedQuestions);
    toast.success("Question deleted successfully");
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
      formData.append('program_id', program.id);  // Pass program ID from context

      const response = await axiosInstance.post('/tests/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { total_uploaded, warnings } = response.data;
      
      let message = `✓ Successfully uploaded ${total_uploaded} question(s)!`;
      if (warnings) {
        message += `\n⚠ ${warnings}`;
      }
      
      toast.success(message);
      setUploadDialogOpen(false);
      loadQuestions();
      
      e.target.value = '';
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to upload file";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };


  const saveQuestionsToBackend = async (questionsList) => {
    try {
      // Delete existing tests
      const existingTests = await axiosInstance.get(`/tests/program/${program.id}`);
      for (const test of existingTests.data) {
        await axiosInstance.delete(`/tests/${test.id}`);
      }

      // Create new pre and post tests with same questions
      await axiosInstance.post("/tests", {
        program_id: program.id,
        title: `${program.name} - Pre-Test`,
        test_type: "pre",
        questions: questionsList,
      });

      await axiosInstance.post("/tests", {
        program_id: program.id,
        title: `${program.name} - Post-Test`,
        test_type: "post",
        questions: questionsList,
      });
    } catch (error) {
      toast.error("Failed to save questions");
      throw error;
    }
  };

  const updateOption = (index, value, isNew = false) => {
    const target = isNew ? newQuestion : editingQuestion;
    const updated = { ...target };
    updated.options[index] = value;
    
    if (isNew) {
      setNewQuestion(updated);
    } else {
      setEditingQuestion(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            data-testid="back-to-programs"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{program.name}</h2>
            <p className="text-sm text-gray-600">
              Manage Pre & Post Test Questions (Same questions, post test shuffles them)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Test Questions</DialogTitle>
                <DialogDescription>
                  Upload questions for: <strong>{program.name}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-900">Excel Format Required:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Question Text</strong> - The question</li>
                    <li>• <strong>Option A, B, C, D</strong> - Answer choices</li>
                    <li>• <strong>Correct Answer</strong> - Enter A, B, C, or D</li>
                    <li>• <strong>Points</strong> - Number of points (optional, default: 5)</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2">
                    Questions will automatically be used for both Pre-Test (in order) and Post-Test (shuffled).
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

          <Button
            data-testid="add-question-button"
            onClick={handleAddQuestion}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Test Questions ({questions.length})</CardTitle>
          <CardDescription>
            These questions will be used for both pre-test (in order) and post-test (shuffled)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={index}
                  data-testid={`question-${index}`}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Q{index + 1}. {q.question}
                      </h3>
                      <div className="space-y-1">
                        {q.options.map((option, optIdx) => (
                          <div
                            key={optIdx}
                            className={`text-sm px-3 py-2 rounded ${
                              optIdx === q.correct_answer
                                ? "bg-green-100 text-green-800 font-medium"
                                : "bg-white"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {option}
                            {optIdx === q.correct_answer && " ✓ (Correct Answer)"}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuestion(index)}
                        data-testid={`edit-question-${index}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteQuestion(index)}
                        data-testid={`delete-question-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Question Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a multiple-choice question with 2-4 options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                data-testid="question-input"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Enter your question"
              />
            </div>

            <div>
              <Label>Options (At least 2 required) *</Label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    data-testid={`option-${index}-input`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value, true)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <Button
                    type="button"
                    variant={newQuestion.correct_answer === index ? "default" : "outline"}
                    onClick={() => setNewQuestion({ ...newQuestion, correct_answer: index })}
                    data-testid={`correct-answer-${index}`}
                  >
                    {newQuestion.correct_answer === index ? "✓ Correct" : "Set Correct"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveQuestion}
                data-testid="save-question-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Update the question and its options
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-question">Question *</Label>
                <Input
                  id="edit-question"
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  placeholder="Enter your question"
                />
              </div>

              <div>
                <Label>Options *</Label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value, false)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <Button
                      type="button"
                      variant={editingQuestion.correct_answer === index ? "default" : "outline"}
                      onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: index })}
                    >
                      {editingQuestion.correct_answer === index ? "✓ Correct" : "Set Correct"}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateQuestion}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TestManagement;
