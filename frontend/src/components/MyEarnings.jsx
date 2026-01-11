import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  FileText, DollarSign, Printer, Eye, Loader2, Calendar, Download,
  Wallet, TrendingUp, Briefcase, CheckCircle, Clock, XCircle
} from 'lucide-react';
import PayslipPrint from './PayslipPrint';
import PayAdvicePrint from './PayAdvicePrint';

/**
 * MyEarnings - Combined Income & Payroll Component
 * Merges "Session Income" (training-based earnings) and "Payroll Documents" (payslips, EA forms)
 */
const MyEarnings = ({ userId, userRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('session-income');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [companySettings, setCompanySettings] = useState(null);
  
  // Session Income states
  const [incomeData, setIncomeData] = useState(null);
  const [coordinatorIncomeData, setCoordinatorIncomeData] = useState(null);
  const [marketingIncomeData, setMarketingIncomeData] = useState(null);
  const [incomeFilter, setIncomeFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    showAll: true
  });
  
  // Payroll Document states
  const [payslips, setPayslips] = useState([]);
  const [payAdvice, setPayAdvice] = useState([]);
  const [eaFormData, setEaFormData] = useState(null);
  
  // Print states
  const [printPayslip, setPrintPayslip] = useState(null);
  const [printPayAdvice, setPrintPayAdvice] = useState(null);

  // Determine user capabilities
  const hasTrainerRole = userRoles.includes('trainer') || userRoles.includes('chief_trainer');
  const hasCoordinatorRole = userRoles.includes('coordinator');
  const hasMarketingRole = userRoles.includes('marketing');

  useEffect(() => {
    loadAllData();
  }, [selectedYear, userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const promises = [
        axiosInstance.get('/finance/company-settings').catch(() => ({ data: {} })),
        axiosInstance.get(`/hr/my-payslips?year=${selectedYear}`).catch(() => ({ data: [] })),
        axiosInstance.get(`/hr/my-pay-advice?year=${selectedYear}`).catch(() => ({ data: [] }))
      ];

      // Load income based on roles
      if (hasTrainerRole && userId) {
        promises.push(axiosInstance.get(`/finance/income/trainer/${userId}`).catch(() => ({ data: null })));
      }
      if (hasCoordinatorRole && userId) {
        promises.push(axiosInstance.get(`/finance/income/coordinator/${userId}`).catch(() => ({ data: null })));
      }
      if (hasMarketingRole && userId) {
        promises.push(axiosInstance.get(`/finance/income/marketing/${userId}`).catch(() => ({ data: null })));
      }

      const results = await Promise.all(promises);
      
      setCompanySettings(results[0].data);
      setPayslips(results[1].data);
      setPayAdvice(results[2].data);

      let idx = 3;
      if (hasTrainerRole && userId) {
        setIncomeData(results[idx]?.data);
        idx++;
      }
      if (hasCoordinatorRole && userId) {
        setCoordinatorIncomeData(results[idx]?.data);
        idx++;
      }
      if (hasMarketingRole && userId) {
        setMarketingIncomeData(results[idx]?.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEAForm = async () => {
    try {
      const response = await axiosInstance.get(`/hr/my-ea-form/${selectedYear}`);
      setEaFormData(response.data);
    } catch (error) {
      toast.error('EA Form data not available');
      setEaFormData(null);
    }
  };

  const getMonthName = (month) => new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  // Filter income sessions by month/year
  const getFilteredSessions = (sessions) => {
    if (!sessions || incomeFilter.showAll) return sessions || [];
    return sessions.filter(s => {
      const sessionDate = new Date(s.session_date || s.start_date);
      return sessionDate.getMonth() + 1 === incomeFilter.month && sessionDate.getFullYear() === incomeFilter.year;
    });
  };

  // Render income section for a specific role
  const renderIncomeSection = (title, data, icon, colorClass) => {
    if (!data) return null;
    
    // API returns 'records' not 'sessions'
    const filteredSessions = getFilteredSessions(data.records || data.sessions || []);
    const totalAmount = filteredSessions.reduce((sum, s) => sum + (s.fee_amount || s.amount || s.total_fee || s.calculated_amount || 0), 0);
    const paidAmount = filteredSessions.filter(s => s.status === 'paid' || s.payment_status === 'paid').reduce((sum, s) => sum + (s.fee_amount || s.amount || s.total_fee || s.calculated_amount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-lg ${colorClass}`}>
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Total Earnings</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 font-medium">Paid</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(paidAmount)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-600 font-medium">Pending</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>

          {/* Sessions Table */}
          {filteredSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div>{session.session_name || session.name}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {new Date(session.session_date || session.start_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(session.session_date || session.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(session.fee_amount || session.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {session.payment_status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No sessions found for selected period</p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 sm:p-4" data-testid="my-earnings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            My Earnings
          </h2>
          <p className="text-gray-500 text-sm">View your session income and payroll documents</p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger 
            value="session-income" 
            data-testid="session-income-tab"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Session Income</span>
            <span className="sm:hidden">Income</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payroll-docs" 
            data-testid="payroll-docs-tab"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Payroll Documents</span>
            <span className="sm:hidden">Payroll</span>
          </TabsTrigger>
        </TabsList>

        {/* Session Income Tab */}
        <TabsContent value="session-income" className="mt-4">
          {/* Filter Controls */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select 
                  value={incomeFilter.month.toString()} 
                  onValueChange={(v) => setIncomeFilter({...incomeFilter, month: parseInt(v), showAll: false})}
                  disabled={incomeFilter.showAll}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>{getMonthName(i+1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={incomeFilter.year.toString()} 
                  onValueChange={(v) => setIncomeFilter({...incomeFilter, year: parseInt(v), showAll: false})}
                  disabled={incomeFilter.showAll}
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
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={incomeFilter.showAll} 
                    onChange={(e) => setIncomeFilter({...incomeFilter, showAll: e.target.checked})}
                    className="rounded"
                  />
                  Show All
                </label>
                <Button variant="outline" size="sm" onClick={loadAllData}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Income Sections by Role */}
          {hasTrainerRole && renderIncomeSection(
            'Trainer Income', 
            incomeData, 
            <Briefcase className="w-5 h-5" />,
            'text-blue-600'
          )}
          
          {hasCoordinatorRole && renderIncomeSection(
            'Coordinator Income', 
            coordinatorIncomeData, 
            <Briefcase className="w-5 h-5" />,
            'text-purple-600'
          )}
          
          {hasMarketingRole && renderIncomeSection(
            'Marketing Commission', 
            marketingIncomeData, 
            <TrendingUp className="w-5 h-5" />,
            'text-green-600'
          )}

          {!incomeData && !coordinatorIncomeData && !marketingIncomeData && (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No session income data available</p>
                <p className="text-sm text-gray-400">Income from training sessions will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payroll Documents Tab */}
        <TabsContent value="payroll-docs" className="mt-4">
          <Tabs defaultValue="payslips">
            <TabsList className="grid w-full grid-cols-3 h-auto mb-4">
              <TabsTrigger value="payslips" className="py-2 text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Payslips</span>
                <span className="sm:hidden">Slips</span>
              </TabsTrigger>
              <TabsTrigger value="pay-advice" className="py-2 text-xs sm:text-sm">
                <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Pay Advice</span>
                <span className="sm:hidden">Advice</span>
              </TabsTrigger>
              <TabsTrigger value="ea-form" className="py-2 text-xs sm:text-sm" onClick={loadEAForm}>
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">EA Form</span>
                <span className="sm:hidden">EA</span>
              </TabsTrigger>
            </TabsList>

            {/* Payslips */}
            <TabsContent value="payslips">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payslips - {selectedYear}</CardTitle>
                  <CardDescription>Monthly salary statements</CardDescription>
                </CardHeader>
                <CardContent>
                  {payslips.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No payslips available for {selectedYear}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {payslips.map((slip) => (
                        <Card key={slip.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{getMonthName(slip.month)} {slip.year}</p>
                                <p className="text-xs text-gray-500">Period: {slip.period_name}</p>
                              </div>
                              <Badge variant={slip.is_locked ? 'default' : 'outline'}>
                                {slip.is_locked ? 'Final' : 'Draft'}
                              </Badge>
                            </div>
                            <div className="bg-green-50 rounded p-2 mb-3">
                              <p className="text-xs text-green-600">Nett Pay</p>
                              <p className="text-lg font-bold text-green-700">{formatCurrency(slip.nett_pay)}</p>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => setPrintPayslip(slip)}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Payslip
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pay Advice */}
            <TabsContent value="pay-advice">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pay Advice - {selectedYear}</CardTitle>
                  <CardDescription>Session-based payment advice</CardDescription>
                </CardHeader>
                <CardContent>
                  {payAdvice.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pay advice available for {selectedYear}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {payAdvice.map((advice) => (
                        <Card key={advice.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-sm">{advice.session_name}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(advice.session_date).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={advice.status === 'paid' ? 'default' : 'outline'}>
                                {advice.status}
                              </Badge>
                            </div>
                            <div className="bg-blue-50 rounded p-2 mb-3">
                              <p className="text-xs text-blue-600">Amount</p>
                              <p className="text-lg font-bold text-blue-700">{formatCurrency(advice.total_amount)}</p>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => setPrintPayAdvice(advice)}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EA Form */}
            <TabsContent value="ea-form">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">EA Form - {selectedYear}</CardTitle>
                  <CardDescription>Annual remuneration statement for tax purposes</CardDescription>
                </CardHeader>
                <CardContent>
                  {!eaFormData ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Click to load your EA Form for {selectedYear}</p>
                      <Button onClick={loadEAForm} className="mt-4">
                        <Download className="w-4 h-4 mr-2" /> Load EA Form
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50 rounded p-3 text-center">
                          <p className="text-xs text-blue-600">Gross Income</p>
                          <p className="font-bold text-blue-700">{formatCurrency(eaFormData.annual_gross)}</p>
                        </div>
                        <div className="bg-green-50 rounded p-3 text-center">
                          <p className="text-xs text-green-600">EPF (Employee)</p>
                          <p className="font-bold text-green-700">{formatCurrency(eaFormData.annual_epf_employee)}</p>
                        </div>
                        <div className="bg-purple-50 rounded p-3 text-center">
                          <p className="text-xs text-purple-600">SOCSO</p>
                          <p className="font-bold text-purple-700">{formatCurrency(eaFormData.annual_socso_employee)}</p>
                        </div>
                        <div className="bg-amber-50 rounded p-3 text-center">
                          <p className="text-xs text-amber-600">PCB (Tax)</p>
                          <p className="font-bold text-amber-700">{formatCurrency(eaFormData.annual_pcb)}</p>
                        </div>
                      </div>
                      <Button className="w-full sm:w-auto">
                        <Printer className="w-4 h-4 mr-2" /> Print EA Form
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Print Modals */}
      {printPayslip && (
        <PayslipPrint 
          payslip={printPayslip} 
          companySettings={companySettings}
          onClose={() => setPrintPayslip(null)} 
        />
      )}
      {printPayAdvice && (
        <PayAdvicePrint 
          record={printPayAdvice}
          companySettings={companySettings}
          onClose={() => setPrintPayAdvice(null)} 
        />
      )}
    </div>
  );
};

export default MyEarnings;
