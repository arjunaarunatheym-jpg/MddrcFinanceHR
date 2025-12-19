import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  DollarSign, Calendar, TrendingUp, LogOut, RefreshCw,
  Building, Clock, CheckCircle
} from 'lucide-react';

const MarketingDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('income');
  const [incomeData, setIncomeData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncome();
    loadSessions();
  }, [user.id]);

  const loadIncome = async () => {
    try {
      const response = await axiosInstance.get(`/finance/income/marketing/${user.id}`);
      setIncomeData(response.data);
    } catch (error) {
      console.error('Failed to load income:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get('/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-500', label: 'Pending' },
      approved: { color: 'bg-blue-500', label: 'Approved' },
      paid: { color: 'bg-green-500', label: 'Paid' }
    };
    const c = config[status] || { color: 'bg-gray-400', label: status };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

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
          <TabsList className="mb-6">
            <TabsTrigger value="income">My Income</TabsTrigger>
            <TabsTrigger value="calendar">Training Calendar</TabsTrigger>
          </TabsList>

          {/* Income Tab */}
          <TabsContent value="income">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : incomeData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Total Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900">
                        RM {incomeData.summary.total_commission?.toLocaleString() || '0'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">
                        RM {incomeData.summary.paid_commission?.toLocaleString() || '0'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-900">
                        RM {incomeData.summary.pending_commission?.toLocaleString() || '0'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Commission Records */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Commission Records</CardTitle>
                      <Button variant="outline" size="sm" onClick={loadIncome}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {incomeData.records.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No commission records yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incomeData.records.map((record) => (
                          <div key={record.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">{record.session_name || 'Training Session'}</p>
                              <p className="text-sm text-gray-500">{record.company_name}</p>
                              <p className="text-xs text-gray-400">{record.training_dates}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">RM {record.calculated_amount?.toLocaleString() || '0'}</p>
                              {getStatusBadge(record.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Training Calendar (View Only)</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadSessions}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No training sessions</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg">
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
                            <p className="text-sm text-gray-500">{session.participant_ids?.length || 0} Participants</p>
                            <Badge variant="outline" className="mt-1">
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
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingDashboard;
