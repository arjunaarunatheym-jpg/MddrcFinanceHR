import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  DollarSign, Calendar, TrendingUp, LogOut, RefreshCw, Wallet,
  Building, Clock, CheckCircle, FileText, Search, Eye, Download,
  Users, ChevronDown, ChevronRight, BarChart3
} from 'lucide-react';
import MyEarnings from '../components/MyEarnings';

const MarketingDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('my-earnings');
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Training Reports state
  const [reportFilter, setReportFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [completedSessions, setCompletedSessions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [user.id]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/sessions');
      const allSessions = response.data || [];
      
      // Filter sessions brought in by this marketer
      const myBroughtInSessions = allSessions.filter(s => 
        s.brought_in_by === user.id || s.marketer_id === user.id
      );
      
      setSessions(allSessions);
      setMySessions(myBroughtInSessions);
      
      // Filter completed sessions for reports
      filterCompletedSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const filterCompletedSessions = (allSessions) => {
    const completed = allSessions.filter(s => {
      // Only show sessions brought in by this marketer
      if (s.brought_in_by !== user.id && s.marketer_id !== user.id) return false;
      
      // Check if completed
      if (s.status !== 'completed') return false;
      
      // Filter by month/year
      const endDate = new Date(s.end_date);
      return endDate.getMonth() + 1 === reportFilter.month && 
             endDate.getFullYear() === reportFilter.year;
    });
    setCompletedSessions(completed);
  };

  useEffect(() => {
    if (sessions.length > 0) {
      filterCompletedSessions(sessions);
    }
  }, [reportFilter, sessions]);

  const loadReport = async (sessionId) => {
    try {
      setLoadingReport(true);
      setSelectedReport(sessionId);
      
      // Load AI report if available
      const response = await axiosInstance.get(`/sessions/${sessionId}/ai-report`);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to load report:', error);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const getMonthName = (month) => new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  
  const months = Array.from({length: 12}, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
  const years = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Marketing Portal</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="my-earnings" data-testid="my-earnings-tab" className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">My Earnings</span>
              <span className="sm:hidden">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="my-sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">My Sessions</span>
              <span className="sm:hidden">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="training-reports" data-testid="training-reports-tab" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Training Reports</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* My Earnings Tab - Combined Income & Payroll */}
          <TabsContent value="my-earnings">
            <MyEarnings 
              userId={user.id} 
              userRoles={['marketing', ...(user.additional_roles || [])]}
            />
          </TabsContent>

          {/* My Sessions Tab - Only sessions brought in by marketer */}
          <TabsContent value="my-sessions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      My Sessions
                    </CardTitle>
                    <CardDescription>Training sessions you brought in</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadSessions}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : mySessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No sessions assigned to you yet</p>
                    <p className="text-sm text-gray-400">Sessions you bring in will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{session.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Calendar className="w-4 h-4" />
                              {session.start_date} to {session.end_date}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building className="w-4 h-4" />
                              {session.company_name || 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              <Users className="w-4 h-4 inline mr-1" />
                              {session.participant_ids?.length || 0} Participants
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`mt-1 ${
                                session.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                session.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Reports Tab */}
          <TabsContent value="training-reports">
            <div className="space-y-4">
              {/* Filter Controls */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Filter:</span>
                    </div>
                    <Select 
                      value={reportFilter.month.toString()} 
                      onValueChange={(v) => setReportFilter({...reportFilter, month: parseInt(v)})}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={reportFilter.year.toString()} 
                      onValueChange={(v) => setReportFilter({...reportFilter, year: parseInt(v)})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadSessions}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Sessions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Training Reports - {getMonthName(reportFilter.month)} {reportFilter.year}
                  </CardTitle>
                  <CardDescription>
                    View training reports for your completed sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No completed sessions for {getMonthName(reportFilter.month)} {reportFilter.year}</p>
                      <p className="text-sm text-gray-400">Reports appear after training is completed</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedSessions.map((session) => (
                        <div key={session.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                            onClick={() => selectedReport === session.id ? setSelectedReport(null) : loadReport(session.id)}
                          >
                            <div className="flex items-center gap-3">
                              {selectedReport === session.id ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                              <div>
                                <p className="font-medium">{session.name}</p>
                                <p className="text-sm text-gray-500">
                                  {session.company_name} • {session.start_date} to {session.end_date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700">Completed</Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" /> View Report
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Report Details */}
                          {selectedReport === session.id && (
                            <div className="p-4 border-t bg-white">
                              {loadingReport ? (
                                <div className="text-center py-4">Loading report...</div>
                              ) : reportData ? (
                                <div className="space-y-4">
                                  {/* Report Summary */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-blue-50 rounded p-3 text-center">
                                      <p className="text-xs text-blue-600">Total Participants</p>
                                      <p className="text-xl font-bold text-blue-700">
                                        {reportData.participant_count || session.participant_ids?.length || 0}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 rounded p-3 text-center">
                                      <p className="text-xs text-green-600">Pass Rate</p>
                                      <p className="text-xl font-bold text-green-700">
                                        {reportData.pass_rate || 'N/A'}%
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 rounded p-3 text-center">
                                      <p className="text-xs text-purple-600">Avg Pre-Test</p>
                                      <p className="text-xl font-bold text-purple-700">
                                        {reportData.avg_pre_test || 'N/A'}%
                                      </p>
                                    </div>
                                    <div className="bg-amber-50 rounded p-3 text-center">
                                      <p className="text-xs text-amber-600">Avg Post-Test</p>
                                      <p className="text-xl font-bold text-amber-700">
                                        {reportData.avg_post_test || 'N/A'}%
                                      </p>
                                    </div>
                                  </div>

                                  {/* AI Summary if available */}
                                  {reportData.ai_summary && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Training Summary
                                      </h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {reportData.ai_summary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Feedback highlights */}
                                  {reportData.feedback_summary && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                      <h4 className="font-semibold mb-2">Participant Feedback</h4>
                                      <p className="text-sm text-gray-700">
                                        {reportData.feedback_summary}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <p>No detailed report available yet</p>
                                  <p className="text-sm text-gray-400">Report will be available after coordinator submission</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingDashboard;
