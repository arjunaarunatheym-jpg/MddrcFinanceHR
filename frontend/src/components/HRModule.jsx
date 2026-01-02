import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Users, Plus, Edit, Trash2, Save, Search, DollarSign, 
  FileText, Building2, Printer, X, Calculator, Loader2
} from 'lucide-react';

const HRModule = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedStaffForPayslip, setSelectedStaffForPayslip] = useState(null);
  const [payslipMonth, setPayslipMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [formData, setFormData] = useState({
    user_id: '',
    employee_id: '',
    designation: '',
    department: '',
    date_joined: '',
    bank_name: '',
    bank_account: '',
    basic_salary: '',
    // Allowances
    housing_allowance: '',
    transport_allowance: '',
    meal_allowance: '',
    phone_allowance: '',
    other_allowance: '',
    // Statutory info
    epf_number: '',
    socso_number: '',
    tax_number: '',
    // EPF rates
    employee_epf_rate: '11',
    employer_epf_rate: '13',
    // Status
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axiosInstance.get('/hr/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to load staff:', error);
      // API might not exist yet, set empty array
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        basic_salary: parseFloat(formData.basic_salary) || 0,
        housing_allowance: parseFloat(formData.housing_allowance) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        meal_allowance: parseFloat(formData.meal_allowance) || 0,
        phone_allowance: parseFloat(formData.phone_allowance) || 0,
        other_allowance: parseFloat(formData.other_allowance) || 0,
        employee_epf_rate: parseFloat(formData.employee_epf_rate) || 11,
        employer_epf_rate: parseFloat(formData.employer_epf_rate) || 13,
      };

      if (editingStaff) {
        await axiosInstance.put(`/hr/staff/${editingStaff.id}`, payload);
        toast.success('Staff updated successfully');
      } else {
        await axiosInstance.post('/hr/staff', payload);
        toast.success('Staff added successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save staff');
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      user_id: staffMember.user_id || '',
      employee_id: staffMember.employee_id || '',
      designation: staffMember.designation || '',
      department: staffMember.department || '',
      date_joined: staffMember.date_joined || '',
      bank_name: staffMember.bank_name || '',
      bank_account: staffMember.bank_account || '',
      basic_salary: staffMember.basic_salary?.toString() || '',
      housing_allowance: staffMember.housing_allowance?.toString() || '',
      transport_allowance: staffMember.transport_allowance?.toString() || '',
      meal_allowance: staffMember.meal_allowance?.toString() || '',
      phone_allowance: staffMember.phone_allowance?.toString() || '',
      other_allowance: staffMember.other_allowance?.toString() || '',
      epf_number: staffMember.epf_number || '',
      socso_number: staffMember.socso_number || '',
      tax_number: staffMember.tax_number || '',
      employee_epf_rate: staffMember.employee_epf_rate?.toString() || '11',
      employer_epf_rate: staffMember.employer_epf_rate?.toString() || '13',
      is_active: staffMember.is_active !== false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff record?')) return;
    
    try {
      await axiosInstance.delete(`/hr/staff/${id}`);
      toast.success('Staff deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      user_id: '',
      employee_id: '',
      designation: '',
      department: '',
      date_joined: '',
      bank_name: '',
      bank_account: '',
      basic_salary: '',
      housing_allowance: '',
      transport_allowance: '',
      meal_allowance: '',
      phone_allowance: '',
      other_allowance: '',
      epf_number: '',
      socso_number: '',
      tax_number: '',
      employee_epf_rate: '11',
      employer_epf_rate: '13',
      is_active: true
    });
  };

  const openPayslipDialog = (staffMember) => {
    setSelectedStaffForPayslip(staffMember);
    setPayslipDialogOpen(true);
  };

  const calculateTotalAllowances = (s) => {
    return (s.housing_allowance || 0) + 
           (s.transport_allowance || 0) + 
           (s.meal_allowance || 0) + 
           (s.phone_allowance || 0) + 
           (s.other_allowance || 0);
  };

  const filteredStaff = staff.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            HR & Staff Management
          </h2>
          <p className="text-gray-500 text-sm">Manage full-time staff salary and statutory details</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, employee ID, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="grid gap-4">
        {filteredStaff.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No staff records found</p>
            <p className="text-sm">Click "Add Staff" to create a new record</p>
          </Card>
        ) : (
          filteredStaff.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {s.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{s.full_name}</h3>
                      <p className="text-sm text-gray-500">{s.designation || 'No designation'}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{s.employee_id || 'No ID'}</Badge>
                        <Badge variant="outline" className="bg-blue-50">{s.department || 'No dept'}</Badge>
                        {!s.is_active && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Basic Salary</div>
                    <div className="text-xl font-bold text-green-600">
                      RM {(s.basic_salary || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400">
                      + RM {calculateTotalAllowances(s).toLocaleString()} allowances
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>EPF: {s.epf_number || 'N/A'}</span>
                    <span>SOCSO: {s.socso_number || 'N/A'}</span>
                    <span>Tax: {s.tax_number || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPayslipDialog(s)}>
                      <FileText className="w-4 h-4 mr-1" />
                      Generate Payslip
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(s)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
            <DialogDescription>
              Enter the staff member's salary and statutory information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee ID *</Label>
                  <Input
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="e.g., EMP001"
                  />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., Training Coordinator"
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Operations"
                  />
                </div>
                <div>
                  <Label>Date Joined</Label>
                  <Input
                    type="date"
                    value={formData.date_joined}
                    onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Bank Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g., Maybank"
                  />
                </div>
                <div>
                  <Label>Bank Account Number</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="e.g., 1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Salary */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Salary & Allowances
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Basic Salary (RM) *</Label>
                  <Input
                    type="number"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                    placeholder="e.g., 2700"
                  />
                </div>
                <div>
                  <Label>Housing Allowance (RM)</Label>
                  <Input
                    type="number"
                    value={formData.housing_allowance}
                    onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Transport Allowance (RM)</Label>
                  <Input
                    type="number"
                    value={formData.transport_allowance}
                    onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Meal Allowance (RM)</Label>
                  <Input
                    type="number"
                    value={formData.meal_allowance}
                    onChange={(e) => setFormData({ ...formData, meal_allowance: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Phone Allowance (RM)</Label>
                  <Input
                    type="number"
                    value={formData.phone_allowance}
                    onChange={(e) => setFormData({ ...formData, phone_allowance: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Other Allowance (RM)</Label>
                  <Input
                    type="number"
                    value={formData.other_allowance}
                    onChange={(e) => setFormData({ ...formData, other_allowance: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Statutory Info */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Statutory Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>EPF Number</Label>
                  <Input
                    value={formData.epf_number}
                    onChange={(e) => setFormData({ ...formData, epf_number: e.target.value })}
                    placeholder="EPF number"
                  />
                </div>
                <div>
                  <Label>SOCSO Number</Label>
                  <Input
                    value={formData.socso_number}
                    onChange={(e) => setFormData({ ...formData, socso_number: e.target.value })}
                    placeholder="SOCSO number"
                  />
                </div>
                <div>
                  <Label>Tax Number (LHDN)</Label>
                  <Input
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Tax number"
                  />
                </div>
                <div>
                  <Label>Employee EPF Rate (%)</Label>
                  <Select 
                    value={formData.employee_epf_rate} 
                    onValueChange={(v) => setFormData({ ...formData, employee_epf_rate: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exempted)</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="11">11% (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Employer EPF Rate (%)</Label>
                  <Select 
                    value={formData.employer_epf_rate} 
                    onValueChange={(v) => setFormData({ ...formData, employer_epf_rate: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="13">13% (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {editingStaff ? 'Update' : 'Add Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Payslip</DialogTitle>
            <DialogDescription>
              Select the month for payslip generation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label>Staff Member</Label>
              <Input value={selectedStaffForPayslip?.full_name || ''} disabled />
            </div>
            <div>
              <Label>Payslip Month</Label>
              <Input
                type="month"
                value={payslipMonth}
                onChange={(e) => setPayslipMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayslipDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                toast.info('Payslip generation - Coming soon!');
                // Will implement PayslipPrint component
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRModule;
