import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, MessageSquare } from "lucide-react";

const TrainerChiefFeedback = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [feedbackTemplate, setFeedbackTemplate] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
    loadFeedbackTemplate();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/sessions");
      const mySessions = response.data.filter(session => 
        session.trainer_assignments && session.trainer_assignments.some(t => t.trainer_id === user.id)
      );
      setSessions(mySessions);
      if (mySessions.length > 0) {
        setSelectedSession(mySessions[0]);
        loadFeedback(mySessions[0].id);
      }
    } catch (error) {
      toast.error("Failed to load sessions");
    }
  };

  const loadFeedbackTemplate = async () => {
    try {
      const response = await axiosInstance.get("/chief-trainer-feedback-template");
      setFeedbackTemplate(response.data);
    } catch (error) {
      console.error("Failed to load feedback template");
    }
  };

  const loadFeedback = async (sessionId) => {
    try {
      const response = await axiosInstance.get(`/chief-trainer-feedback/${sessionId}`);
      if (response.data && response.data.responses) {
        setFeedback(response.data.responses);
        setFeedbackSubmitted(true);
      } else {
        setFeedbackSubmitted(false);
        setFeedback({});
      }
    } catch (error) {
      setFeedbackSubmitted(false);
      setFeedback({});
    }
  };

  const handleSessionChange = (session) => {
    setSelectedSession(session);
    loadFeedback(session.id);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedSession) return;

    setSubmitting(true);
    try {
      await axiosInstance.post(`/chief-trainer-feedback/${selectedSession.id}`, feedback);
      toast.success("Feedback submitted successfully!");
      setFeedbackSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chief Trainer Feedback</h1>
            <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Session</CardTitle>
            <CardDescription>Choose a session to provide feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedSession?.id || ""}
              onChange={(e) => {
                const session = sessions.find(s => s.id === e.target.value);
                if (session) handleSessionChange(session);
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a session...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.start_date} to {session.end_date}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        {selectedSession && feedbackTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chief Trainer Feedback Form
              </CardTitle>
              <CardDescription>
                Session: {selectedSession.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {feedbackTemplate.questions?.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {question.question}
                      {question.type === 'rating' && (
                        <span className="text-gray-500 ml-1">(Rate 1-{question.scale})</span>
                      )}
                    </label>
                    {question.type === 'rating' ? (
                      <div className="flex gap-2">
                        {[...Array(question.scale)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setFeedback({...feedback, [question.id]: i + 1})}
                            className={`w-10 h-10 rounded-full font-bold ${
                              feedback[question.id] === i + 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            disabled={feedbackSubmitted}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={feedback[question.id] || ''}
                        onChange={(e) => setFeedback({...feedback, [question.id]: e.target.value})}
                        className="w-full p-3 border rounded-md"
                        rows={4}
                        disabled={feedbackSubmitted}
                        placeholder="Enter your response..."
                      />
                    )}
                  </div>
                ))}
                
                <div className="flex items-center gap-2 mt-6 pt-6 border-t">
                  {feedbackSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        ✓ Feedback Submitted
                      </span>
                      <Button
                        onClick={() => setFeedbackSubmitted(false)}
                        variant="outline"
                        size="sm"
                      >
                        Edit Feedback
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedSession && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Select a session to provide feedback</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TrainerChiefFeedback;
