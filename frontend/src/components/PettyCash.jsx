import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Wallet, Plus, Minus, RefreshCw, Check, X, Trash2, Settings,
  Loader2, Calendar, Receipt, AlertTriangle, CheckCircle, Clock,
  ArrowUpCircle, ArrowDownCircle, Scale
} from 'lucide-react';

const PettyCash = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('transactions');

  // Dialog states
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);

  // Form states
  const [setupForm, setSetupForm] = useState({
    float_amount: 500,
    custodian_name: '',
    approval_threshold: 100
  });
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    description: '',
    category: 'Miscellaneous',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [reconcileForm, setReconcileForm] = useState({
    physical_count: '',
    notes: ''
  });

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) {
    years.push(y);
  }

  const expenseCategories = [
    'Office Supplies', 'Transport', 'Refreshments', 'Postage', 
    'Printing', 'Cleaning', 'Stationery', 'Miscellaneous'
  ];

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, transactionsRes, reconciliationsRes, summaryRes] = await Promise.all([
        axiosInstance.get('/finance/petty-cash/settings'),
        axiosInstance.get(`/finance/petty-cash/transactions?year=${selectedYear}`),
        axiosInstance.get('/finance/petty-cash/reconciliations'),
        axiosInstance.get(`/finance/petty-cash/summary?year=${selectedYear}`)
      ]);
      setSettings(settingsRes.data);
      setTransactions(transactionsRes.data);
      setReconciliations(reconciliationsRes.data);
      setSummary(summaryRes.data);
      
      // Pre-fill setup form if settings exist
      if (settingsRes.data) {
        setSetupForm({
          float_amount: settingsRes.data.float_amount || 500,
          custodian_name: settingsRes.data.custodian_name || '',
          approval_threshold: settingsRes.data.approval_threshold || 100
        });
        setReconcileForm({
          physical_count: settingsRes.data.current_balance || '',
          notes: ''
        });
      }
    } catch (error) {
      toast.error('Failed to load petty cash data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      await axiosInstance.post('/finance/petty-cash/setup', setupForm);
      toast.success('Petty cash settings saved');
      setShowSetupDialog(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    }
  };

  const handleAddExpense = async () => {
    if (!transactionForm.amount || !transactionForm.description) {
      toast.error('Please fill in amount and description');
      return;
    }
    try {
      const response = await axiosInstance.post('/finance/petty-cash/transaction', {
        type: 'expense',
        ...transactionForm,
        amount: parseFloat(transactionForm.amount)
      });
      toast.success(response.data.message);
      setShowExpenseDialog(false);
      resetTransactionForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add expense');
    }
  };

  const handleTopup = async () => {
    if (!transactionForm.amount) {
      toast.error('Please enter amount');
      return;
    }
    try {
      await axiosInstance.post('/finance/petty-cash/transaction', {
        type: 'topup',
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description || 'Cash top-up',
        date: transactionForm.date,
        notes: transactionForm.notes
      });
      toast.success('Top-up recorded');
      setShowTopupDialog(false);
      resetTransactionForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record top-up');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.post(`/finance/petty-cash/approve/${id}`);
      toast.success('Transaction approved');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.post(`/finance/petty-cash/reject/${id}`);
      toast.success('Transaction rejected');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction? This will reverse the balance.')) return;
    try {
      await axiosInstance.delete(`/finance/petty-cash/transaction/${id}`);
      toast.success('Transaction deleted');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleReconcile = async () => {
    if (!reconcileForm.physical_count) {
      toast.error('Please enter the physical count');
      return;
    }
    try {
      const response = await axiosInstance.post('/finance/petty-cash/reconcile', {
        physical_count: parseFloat(reconcileForm.physical_count),
        notes: reconcileForm.notes
      });
      toast.success(`Reconciliation complete. Variance: RM ${response.data.variance.toFixed(2)}`);
      setShowReconcileDialog(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reconcile');
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      amount: '',
      description: '',
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    if (type === 'expense') return <Badge className="bg-red-100 text-red-700"><Minus className="w-3 h-3 mr-1" />Expense</Badge>;
    if (type === 'topup') return <Badge className="bg-green-100 text-green-700"><Plus className="w-3 h-3 mr-1" />Top-up</Badge>;
    return <Badge variant="outline">{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            Petty Cash Management
          </h2>
          <p className="text-gray-500">Track small expenses and cash float</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-28">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowSetupDialog(true)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-600 font-medium">Current Balance</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(settings?.current_balance)}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-600 font-medium">Float Amount</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(settings?.float_amount)}</p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Expenses (YTD)</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(summary?.total_expenses)}</p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${pendingCount > 0 ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>Pending Approval</p>
                <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-700' : 'text-gray-700'}`}>{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowExpenseDialog(true)} className="bg-red-600 hover:bg-red-700">
          <Minus className="w-4 h-4 mr-2" /> Record Expense
        </Button>
        <Button onClick={() => setShowTopupDialog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" /> Top-up Cash
        </Button>
        <Button onClick={() => setShowReconcileDialog(true)} variant="outline">
          <Scale className="w-4 h-4 mr-2" /> Reconcile
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto w-full justify-start bg-gray-100 p-2 rounded-lg">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="reconciliations">Reconciliation History</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions recorded for {selectedYear}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div 
                      key={txn.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3 ${
                        txn.type === 'expense' ? 'bg-red-50 border-red-200' : 
                        txn.type === 'topup' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(txn.type)}
                          {getStatusBadge(txn.status)}
                          {txn.category && <Badge variant="outline">{txn.category}</Badge>}
                        </div>
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-sm text-gray-500">{txn.date} • by {txn.created_by_name}</p>
                        {txn.notes && <p className="text-xs text-gray-400 mt-1">{txn.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${txn.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                            {txn.type === 'expense' ? '-' : '+'}{formatCurrency(txn.amount)}
                          </p>
                          <p className="text-xs text-gray-400">Bal: {formatCurrency(txn.balance_after)}</p>
                        </div>
                        {txn.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(txn.id)}>
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Transactions exceeding RM {settings?.approval_threshold || 100} require approval</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.filter(t => t.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.filter(t => t.status === 'pending').map((txn) => (
                    <div key={txn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-sm text-gray-500">{txn.date} • {txn.category} • by {txn.created_by_name}</p>
                        {txn.notes && <p className="text-xs text-gray-400 mt-1">{txn.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">-{formatCurrency(txn.amount)}</span>
                        <Button size="sm" onClick={() => handleApprove(txn.id)} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(txn.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summary?.by_category || {}).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No expense data for {selectedYear}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(summary?.by_category || {}).map(([category, data]) => {
                    const percentage = summary.total_expenses > 0 ? ((data.total / summary.total_expenses) * 100).toFixed(1) : 0;
                    return (
                      <div key={category} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{category}</span>
                          <Badge variant="outline">{data.count} txn</Badge>
                        </div>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(data.total)}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{percentage}% of total</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliations Tab */}
        <TabsContent value="reconciliations">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation History</CardTitle>
              <CardDescription>Past balance verifications</CardDescription>
            </CardHeader>
            <CardContent>
              {reconciliations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reconciliations recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reconciliations.map((rec) => (
                    <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border gap-3">
                      <div>
                        <p className="font-medium">{rec.date}</p>
                        <p className="text-sm text-gray-500">by {rec.reconciled_by_name}</p>
                        {rec.notes && <p className="text-xs text-gray-400 mt-1">{rec.notes}</p>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">System</p>
                          <p className="font-medium">{formatCurrency(rec.system_balance)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Physical</p>
                          <p className="font-medium">{formatCurrency(rec.physical_count)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Variance</p>
                          <p className={`font-bold ${rec.variance === 0 ? 'text-green-600' : rec.variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {rec.variance >= 0 ? '+' : ''}{formatCurrency(rec.variance)}
                          </p>
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

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Petty Cash Settings</DialogTitle>
            <DialogDescription>Configure petty cash float and approval rules</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Float Amount (RM)</Label>
              <Input 
                type="number"
                value={setupForm.float_amount}
                onChange={(e) => setSetupForm({ ...setupForm, float_amount: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">Standard amount to maintain in petty cash</p>
            </div>
            <div>
              <Label>Custodian Name</Label>
              <Input 
                value={setupForm.custodian_name}
                onChange={(e) => setSetupForm({ ...setupForm, custodian_name: e.target.value })}
                placeholder="Person responsible for petty cash"
              />
            </div>
            <div>
              <Label>Approval Threshold (RM)</Label>
              <Input 
                type="number"
                value={setupForm.approval_threshold}
                onChange={(e) => setSetupForm({ ...setupForm, approval_threshold: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">Expenses above this amount require approval</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSetupDialog(false)}>Cancel</Button>
              <Button onClick={handleSetup}>Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Petty Cash Expense</DialogTitle>
            <DialogDescription>Current balance: {formatCurrency(settings?.current_balance)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (RM) *</Label>
                <Input 
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Input 
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                placeholder="What was purchased?"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={transactionForm.category} onValueChange={(v) => setTransactionForm({ ...transactionForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input 
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                placeholder="Additional notes (optional)"
              />
            </div>
            {parseFloat(transactionForm.amount) > (settings?.approval_threshold || 100) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700">This amount exceeds the threshold and will require approval</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowExpenseDialog(false); resetTransactionForm(); }}>Cancel</Button>
              <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700">Record Expense</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top-up Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top-up Petty Cash</DialogTitle>
            <DialogDescription>Add funds to petty cash float</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (RM) *</Label>
                <Input 
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input 
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                placeholder="e.g., Monthly float replenishment"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input 
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                placeholder="Additional notes (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowTopupDialog(false); resetTransactionForm(); }}>Cancel</Button>
              <Button onClick={handleTopup} className="bg-green-600 hover:bg-green-700">Add Top-up</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile Petty Cash</DialogTitle>
            <DialogDescription>Verify physical cash against system balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600">System Balance</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(settings?.current_balance)}</p>
            </div>
            <div>
              <Label>Physical Count (RM) *</Label>
              <Input 
                type="number"
                value={reconcileForm.physical_count}
                onChange={(e) => setReconcileForm({ ...reconcileForm, physical_count: e.target.value })}
                placeholder="Enter actual cash amount"
              />
            </div>
            {reconcileForm.physical_count && (
              <div className={`p-4 rounded-lg border ${
                parseFloat(reconcileForm.physical_count) === settings?.current_balance 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className="text-sm">Variance</p>
                <p className={`text-xl font-bold ${
                  parseFloat(reconcileForm.physical_count) === settings?.current_balance 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {formatCurrency(parseFloat(reconcileForm.physical_count) - (settings?.current_balance || 0))}
                </p>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Input 
                value={reconcileForm.notes}
                onChange={(e) => setReconcileForm({ ...reconcileForm, notes: e.target.value })}
                placeholder="Explain any variance"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>Cancel</Button>
              <Button onClick={handleReconcile}>Complete Reconciliation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PettyCash;
