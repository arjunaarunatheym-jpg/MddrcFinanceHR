import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, DollarSign, Printer, Eye, Loader2, Calendar, Download
} from 'lucide-react';
import PayslipPrint from './PayslipPrint';
import PayAdvicePrint from './PayAdvicePrint';

const MyPayroll = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payslips');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [companySettings, setCompanySettings] = useState(null);
  
  const [payslips, setPayslips] = useState([]);
  const [payAdvice, setPayAdvice] = useState([]);
  const [eaFormData, setEaFormData] = useState(null);
  
  const [printPayslip, setPrintPayslip] = useState(null);
  const [printPayAdvice, setPrintPayAdvice] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payslipsRes, payAdviceRes, settingsRes] = await Promise.all([
        axiosInstance.get(`/hr/my-payslips?year=${selectedYear}`).catch(() => ({ data: [] })),
        axiosInstance.get(`/hr/my-pay-advice?year=${selectedYear}`).catch(() => ({ data: [] })),
        axiosInstance.get('/finance/company-settings').catch(() => ({ data: {} }))
      ]);
      
      setPayslips(payslipsRes.data);
      setPayAdvice(payAdviceRes.data);
      setCompanySettings(settingsRes.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            My Payroll
          </h2>
          <p className="text-gray-500 text-sm">View your payslips, pay advice, and EA Form</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="payslips" className="text-xs sm:text-sm">Payslips</TabsTrigger>
          <TabsTrigger value="pay-advice" className="text-xs sm:text-sm">Pay Advice</TabsTrigger>
          <TabsTrigger value="ea-form" className="text-xs sm:text-sm" onClick={loadEAForm}>EA Form</TabsTrigger>
        </TabsList>

        {/* Payslips Tab */}
        <TabsContent value="payslips">
          {payslips.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payslips available for {selectedYear}</p>
              <p className="text-sm">Payslips will appear here once finalized by HR</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {payslips.map((ps) => (
                <Card key={ps.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{getMonthName(ps.month)} {ps.year}</h4>
                        <p className="text-sm text-gray-500">{ps.designation}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Gross: {formatCurrency(ps.gross_salary)}</Badge>
                          <Badge className="bg-green-100 text-green-700 text-xs">Nett: {formatCurrency(ps.nett_pay)}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPrintPayslip(ps)}>
                          <Printer className="w-4 h-4 mr-1" /> View/Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pay Advice Tab */}
        <TabsContent value="pay-advice">
          {payAdvice.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pay advice available for {selectedYear}</p>
              <p className="text-sm">Pay advice for training sessions will appear here</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {payAdvice.map((pa) => (
                <Card key={pa.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{getMonthName(pa.month)} {pa.year}</h4>
                        <p className="text-sm text-gray-500">{pa.total_sessions} session(s)</p>
                        <Badge className="bg-green-100 text-green-700 mt-2">
                          Total: {formatCurrency(pa.nett_amount)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPrintPayAdvice(pa)}>
                          <Printer className="w-4 h-4 mr-1" /> View/Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* EA Form Tab */}
        <TabsContent value="ea-form">
          {!eaFormData ? (
            <Card className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>EA Form for {selectedYear}</p>
              <p className="text-sm mb-4">Click to load your annual remuneration statement</p>
              <Button onClick={loadEAForm}>Load EA Form</Button>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  EA Form (Borang EA) - {selectedYear}
                </CardTitle>
                <CardDescription>Annual Remuneration Statement for Tax Filing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employee Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Employee Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {eaFormData.employee_details?.full_name}</div>
                    <div><span className="text-gray-500">NRIC:</span> {eaFormData.employee_details?.nric || '-'}</div>
                    <div><span className="text-gray-500">Employee ID:</span> {eaFormData.employee_details?.employee_id || '-'}</div>
                    <div><span className="text-gray-500">EPF No:</span> {eaFormData.employee_details?.epf_number || '-'}</div>
                  </div>
                </div>

                {/* Annual Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-2">Annual Income (Section B)</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Basic Salary</span><span>{formatCurrency(eaFormData.annual_totals?.basic_salary)}</span></div>
                      <div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(eaFormData.annual_totals?.allowances)}</span></div>
                      <div className="flex justify-between"><span>Overtime</span><span>{formatCurrency(eaFormData.annual_totals?.overtime)}</span></div>
                      <div className="flex justify-between"><span>Bonus</span><span>{formatCurrency(eaFormData.annual_totals?.bonus)}</span></div>
                      <div className="flex justify-between"><span>Commission</span><span>{formatCurrency(eaFormData.annual_totals?.commission)}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>Total Gross Income</span><span>{formatCurrency(eaFormData.annual_totals?.gross_salary)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-700 mb-2">Annual Deductions (Section C/D)</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>EPF (Employee)</span><span>{formatCurrency(eaFormData.annual_totals?.epf_employee)}</span></div>
                      <div className="flex justify-between"><span>SOCSO (Employee)</span><span>{formatCurrency(eaFormData.annual_totals?.socso_employee)}</span></div>
                      <div className="flex justify-between"><span>EIS (Employee)</span><span>{formatCurrency(eaFormData.annual_totals?.eis_employee)}</span></div>
                      <div className="flex justify-between"><span>PCB/MTD (Tax)</span><span>{formatCurrency(eaFormData.annual_totals?.pcb)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div>
                  <h4 className="font-semibold mb-2">Monthly Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Month</th>
                          <th className="p-2 text-right">Gross</th>
                          <th className="p-2 text-right">EPF</th>
                          <th className="p-2 text-right">PCB</th>
                          <th className="p-2 text-right">Nett</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eaFormData.monthly_breakdown?.map((m, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{getMonthName(m.month)}</td>
                            <td className="p-2 text-right">{formatCurrency(m.gross_salary)}</td>
                            <td className="p-2 text-right">{formatCurrency(m.epf_employee)}</td>
                            <td className="p-2 text-right">{formatCurrency(m.pcb)}</td>
                            <td className="p-2 text-right">{formatCurrency(m.nett_pay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
                  <strong>Note:</strong> This is a summary for reference. Please obtain the official EA Form (C.P.8A) from HR before filing your income tax with LHDN.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Print Payslip Modal */}
      {printPayslip && (
        <PayslipPrint 
          payslip={printPayslip} 
          companySettings={companySettings} 
          onClose={() => setPrintPayslip(null)} 
        />
      )}

      {/* Print Pay Advice Modal */}
      {printPayAdvice && (
        <PayAdvicePrint 
          payAdvice={printPayAdvice} 
          companySettings={companySettings} 
          onClose={() => setPrintPayAdvice(null)} 
        />
      )}
    </div>
  );
};

export default MyPayroll;
