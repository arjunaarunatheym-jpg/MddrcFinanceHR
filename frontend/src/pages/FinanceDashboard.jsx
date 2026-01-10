import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  DollarSign, FileText, CreditCard, TrendingUp, 
  CheckCircle, Clock, AlertCircle, LogOut, RefreshCw,
  Check, X, Plus, FileX, Receipt, Edit, Printer, Settings, Download, FileSpreadsheet, Users,
  BarChart3, Wallet
} from 'lucide-react';
import HRModule from '../components/HRModule';
import ProfitLossLedger from '../components/ProfitLossLedger';
import PettyCash from '../components/PettyCash';

const FinanceDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    company_name: 'MDDRC SDN BHD',
    company_reg_no: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    invoice_terms: 'Upon receipt of invoice',
    invoice_footer_note: 'Thank you for your business!',
    // Document styling settings
    tagline: 'Towards a Nation of Safe Drivers',
    primary_color: '#1a365d',
    secondary_color: '#4472C4',
    header_font: 'Arial',
    body_font: 'Arial',
    logo_width: 150,
    logo_position: 'center',
    show_watermark: true,
    watermark_opacity: 0.08,
    tagline_font: 'Georgia',
    tagline_style: 'italic'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
    create_cn: false,
    cn_percentage: '4',
    cn_reason: 'HRDCorp Levy Deduction'
  });
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [showCNDialog, setShowCNDialog] = useState(false);
  const [payables, setPayables] = useState({ trainer_fees: [], coordinator_fees: [], marketing_commissions: [] });
  
  // Invoice Edit State
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    bill_to_name: '',
    bill_to_address: '',
    bill_to_reg_no: '',
    your_reference: '',
    programme_name: '',
    training_dates: '',
    venue: '',
    pax: 0,
    line_items: [],
    subtotal: 0,
    mobilisation_fee: 0,
    rounding: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total_amount: 0
  });

  useEffect(() => {
    loadDashboard();
    loadInvoices();
    loadPendingInvoices();
    loadCreditNotes();
    loadPayables();
    loadCompanySettings();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axiosInstance.get('/finance/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadPayables = async () => {
    try {
      // Load all pending payables
      const [trainerRes, coordRes, commRes] = await Promise.all([
        axiosInstance.get('/finance/payables/trainer-fees'),
        axiosInstance.get('/finance/payables/coordinator-fees'),
        axiosInstance.get('/finance/payables/marketing-commissions')
      ]);
      setPayables({
        trainer_fees: trainerRes.data || [],
        coordinator_fees: coordRes.data || [],
        marketing_commissions: commRes.data || []
      });
    } catch (error) {
      console.error('Failed to load payables:', error);
    }
  };

  const handleMarkPaid = async (type, id) => {
    try {
      let endpoint = '';
      if (type === 'trainer') endpoint = `/finance/trainer-fees/${id}/mark-paid`;
      else if (type === 'coordinator') endpoint = `/finance/coordinator-fees/${id}/mark-paid`;
      else if (type === 'marketing') endpoint = `/finance/income/commission/${id}/mark-paid`;
      
      await axiosInstance.post(endpoint);
      toast.success('Marked as paid successfully');
      loadPayables();
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  const handleBulkMarkPaid = async (type, items) => {
    try {
      let successCount = 0;
      for (const item of items) {
        if (item.status === 'paid') continue;
        let endpoint = '';
        if (type === 'trainer') endpoint = `/finance/trainer-fees/${item.id}/mark-paid`;
        else if (type === 'coordinator') endpoint = `/finance/coordinator-fees/${item.id}/mark-paid`;
        else if (type === 'marketing') endpoint = `/finance/income/commission/${item.id}/mark-paid`;
        
        await axiosInstance.post(endpoint);
        successCount++;
      }
      toast.success(`Marked ${successCount} items as paid`);
      loadPayables();
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  // Group payables by month based on session start_date
  const groupByMonth = (records) => {
    const groups = {};
    records.forEach(record => {
      // Get month from created_at or session date
      const dateStr = record.session_start_date || record.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = { label: monthLabel, records: [], total: 0 };
      }
      groups[monthKey].records.push(record);
      groups[monthKey].total += record.fee_amount || record.total_fee || record.calculated_amount || 0;
    });
    // Sort by month descending (newest first)
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({ key, ...value }));
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/finance/invoices');
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Load company settings
  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/finance/company-settings');
      setCompanySettings(response.data);
    } catch (error) {
      console.error('Failed to load company settings');
    }
  };

  // Save company settings
  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await axiosInstance.put('/finance/company-settings', companySettings);
      toast.success('Company settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Print Receipt
  const handlePrintReceipt = async (payment) => {
    try {
      const response = await axiosInstance.get(`/finance/payments/${payment.id}/receipt`);
      const { receipt_number, invoice, company_settings: settings } = response.data;
      
      // Also get app settings for logo
      let logoUrl = settings?.logo_url;
      if (!logoUrl) {
        try {
          const appSettings = await axiosInstance.get('/settings');
          logoUrl = appSettings.data?.logo_url;
        } catch (e) {
          // Ignore error, use default
        }
      }
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt ${receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo-img { max-height: 80px; margin-bottom: 10px; }
            .logo-text { font-size: 24px; font-weight: bold; color: #1a365d; }
            .company-info { font-size: 12px; color: #666; margin-top: 5px; }
            .receipt-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; background: #f0f0f0; padding: 10px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .detail-box { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .detail-label { font-weight: bold; font-size: 12px; color: #666; margin-bottom: 5px; }
            .detail-value { font-size: 14px; }
            .amount-box { text-align: center; padding: 30px; background: #e8f5e9; border-radius: 10px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #2e7d32; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />` : ''}
            <div class="logo-text">${settings?.company_name || 'MDDRC SDN BHD'}</div>
            <div class="company-info">
              ${settings?.company_reg_no ? `(${settings.company_reg_no})` : ''}<br>
              ${settings?.address_line1 || ''} ${settings?.address_line2 || ''}<br>
              ${settings?.city || ''} ${settings?.postcode || ''} ${settings?.state || ''}<br>
              ${settings?.phone ? `Tel: ${settings.phone}` : ''} ${settings?.email ? `| Email: ${settings.email}` : ''}
            </div>
          </div>
          
          <div class="receipt-title">OFFICIAL RECEIPT</div>
          
          <div class="details-grid">
            <div class="detail-box">
              <div class="detail-label">Receipt No:</div>
              <div class="detail-value">${receipt_number}</div>
              <div class="detail-label" style="margin-top: 10px;">Date:</div>
              <div class="detail-value">${new Date(payment.payment_date).toLocaleDateString('en-MY')}</div>
            </div>
            <div class="detail-box">
              <div class="detail-label">Invoice No:</div>
              <div class="detail-value">${invoice?.invoice_number || payment.invoice_number || '-'}</div>
              <div class="detail-label" style="margin-top: 10px;">Payment Method:</div>
              <div class="detail-value">${payment.payment_method?.replace('_', ' ').toUpperCase() || '-'}</div>
            </div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">RECEIVED FROM:</div>
            <div class="detail-value" style="font-size: 16px; font-weight: bold;">${invoice?.bill_to_name || invoice?.company_name || '-'}</div>
            <div class="detail-value">${invoice?.programme_name || ''}</div>
          </div>
          
          <div class="amount-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Amount Received</div>
            <div class="amount">RM ${payment.amount?.toLocaleString('en-MY', {minimumFractionDigits: 2})}</div>
            ${payment.reference_number ? `<div style="font-size: 12px; color: #666; margin-top: 10px;">Ref: ${payment.reference_number}</div>` : ''}
          </div>
          
          ${payment.notes ? `<div class="detail-box"><div class="detail-label">Notes:</div><div class="detail-value">${payment.notes}</div></div>` : ''}
          
          <div class="footer">
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>${settings?.invoice_footer_note || 'Thank you for your business!'}</p>
          </div>
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      toast.error('Failed to generate receipt');
    }
  };

  // Export invoices to Excel
  const handleExportInvoices = async () => {
    try {
      const response = await axiosInstance.get('/finance/invoices/export');
      const data = response.data;
      
      // Convert to CSV
      if (data.length === 0) {
        toast.error('No invoices to export');
        return;
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h];
          // Escape commas and quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(','))
      ].join('\\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Invoices exported successfully');
    } catch (error) {
      toast.error('Failed to export invoices');
    }
  };

  const loadPendingInvoices = async () => {
    try {
      const response = await axiosInstance.get('/finance/invoices');
      // Filter to show only issued invoices (ready for payment)
      const pending = response.data.filter(inv => inv.status === 'issued' || inv.status === 'approved');
      setPendingInvoices(pending);
    } catch (error) {
      console.error('Failed to load pending invoices');
    }
  };

  const loadCreditNotes = async () => {
    try {
      const response = await axiosInstance.get('/finance/credit-notes');
      setCreditNotes(response.data);
    } catch (error) {
      console.error('Failed to load credit notes');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await axiosInstance.get('/finance/audit-log?limit=50');
      setAuditLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
  };

  const loadPayments = async () => {
    try {
      const response = await axiosInstance.get('/finance/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments');
    }
  };

  const handleApproveInvoice = async (invoiceId) => {
    try {
      await axiosInstance.post(`/finance/invoices/${invoiceId}/approve`);
      toast.success('Invoice approved');
      loadInvoices();
      loadDashboard();
      loadPendingInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve invoice');
    }
  };

  const handleIssueInvoice = async (invoiceId) => {
    try {
      await axiosInstance.post(`/finance/invoices/${invoiceId}/issue`);
      toast.success('Invoice issued');
      loadInvoices();
      loadDashboard();
      loadPendingInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to issue invoice');
    }
  };

  const handleCancelInvoice = async (invoiceId) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    
    try {
      await axiosInstance.post(`/finance/invoices/${invoiceId}/cancel?reason=${encodeURIComponent(reason)}`);
      toast.success('Invoice cancelled');
      loadInvoices();
      loadDashboard();
      loadPendingInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel invoice');
    }
  };

  // Open edit dialog for an invoice - auto-populate from session
  const handleEditInvoice = async (invoice) => {
    // Try to get session details for auto-population
    let sessionData = null;
    if (invoice.session_id) {
      try {
        const response = await axiosInstance.get(`/sessions/${invoice.session_id}`);
        sessionData = response.data;
      } catch (e) {
        // Session might not exist, continue with invoice data
      }
    }
    
    setEditForm({
      bill_to_name: invoice.bill_to_name || invoice.company_name || '',
      bill_to_address: invoice.bill_to_address || '',
      bill_to_reg_no: invoice.bill_to_reg_no || '',
      your_reference: invoice.your_reference || '',
      // Auto-populate from session if available, otherwise use invoice data
      programme_name: invoice.programme_name || sessionData?.program_name || sessionData?.name || '',
      training_dates: invoice.training_dates || (sessionData ? `${sessionData.start_date}${sessionData.end_date && sessionData.end_date !== sessionData.start_date ? ' - ' + sessionData.end_date : ''}` : ''),
      venue: invoice.venue || sessionData?.venue || '',
      pax: invoice.pax || sessionData?.participant_ids?.length || sessionData?.pax || 0,
      line_items: invoice.line_items || [{description: '', quantity: 1, unit_price: 0, amount: 0}],
      subtotal: invoice.subtotal || 0,
      mobilisation_fee: invoice.mobilisation_fee || 0,
      rounding: invoice.rounding || 0,
      tax_rate: invoice.tax_rate || 0,
      tax_amount: invoice.tax_amount || 0,
      discount: invoice.discount || 0,
      total_amount: invoice.total_amount || 0
    });
    setEditingInvoice(invoice);
  };

  // Save invoice edits
  const handleSaveInvoice = async () => {
    try {
      await axiosInstance.put(`/finance/invoices/${editingInvoice.id}`, editForm);
      toast.success('Invoice updated');
      setEditingInvoice(null);
      loadInvoices();
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update invoice');
    }
  };

  // Add line item
  const addLineItem = () => {
    setEditForm({
      ...editForm,
      line_items: [...editForm.line_items, {description: '', quantity: 1, unit_price: 0, amount: 0}]
    });
  };

  // Update line item
  const updateLineItem = (index, field, value) => {
    const newItems = [...editForm.line_items];
    newItems[index][field] = value;
    
    // Calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    // Recalculate subtotal
    const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalBeforeTax = subtotal + (editForm.mobilisation_fee || 0) + (editForm.rounding || 0) - (editForm.discount || 0);
    const taxAmount = totalBeforeTax * (editForm.tax_rate || 0) / 100;
    const totalAmount = totalBeforeTax + taxAmount;
    
    setEditForm({
      ...editForm,
      line_items: newItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    const newItems = editForm.line_items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    setEditForm({
      ...editForm,
      line_items: newItems,
      subtotal
    });
  };

  // Recalculate totals when fees change
  const recalculateTotals = (updates) => {
    const newForm = { ...editForm, ...updates };
    const subtotal = (newForm.line_items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalBeforeTax = subtotal + (newForm.mobilisation_fee || 0) + (newForm.rounding || 0) - (newForm.discount || 0);
    const taxAmount = totalBeforeTax * (newForm.tax_rate || 0) / 100;
    const totalAmount = totalBeforeTax + taxAmount;
    
    setEditForm({
      ...newForm,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    });
  };

  // Print invoice
  // Print invoice with company settings
  const handlePrintInvoice = async (invoice) => {
    // Get company settings for invoice
    let settings = companySettings;
    let logoUrl = companySettings.logo_url;
    
    // Also try to get app settings logo if not set
    if (!logoUrl) {
      try {
        const appSettings = await axiosInstance.get('/settings');
        logoUrl = appSettings.data?.logo_url;
      } catch (e) {
        // Ignore error, use default
      }
    }
    
    // Styling variables from settings
    const primaryColor = settings.primary_color || '#1a365d';
    const secondaryColor = settings.secondary_color || '#4472C4';
    const tagline = settings.tagline || 'Towards a Nation of Safe Drivers';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          @media print { 
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10px;
            padding: 15px; 
            max-width: 210mm;
            margin: 0 auto; 
            line-height: 1.3;
          }
          
          /* Compact Header with Logo */
          .header { 
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${primaryColor};
            margin-bottom: 10px;
          }
          .logo-img { 
            width: 80px; 
            height: auto;
            flex-shrink: 0;
          }
          .company-details {
            flex: 1;
          }
          .company-name { 
            font-size: 14px; 
            font-weight: bold; 
            color: ${primaryColor};
            margin-bottom: 2px;
          }
          .company-info { 
            font-size: 9px; 
            color: #444;
            line-height: 1.4;
          }
          
          .invoice-title { 
            font-size: 16px; 
            font-weight: bold; 
            text-align: center; 
            color: ${primaryColor}; 
            margin: 8px 0;
            padding: 5px;
            background: #f0f4f8;
          }
          
          /* Details Grid - More Compact */
          .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
            margin-bottom: 10px;
          }
          .detail-box { 
            padding: 8px; 
            border: 1px solid #ddd; 
            border-radius: 4px;
            font-size: 9px;
          }
          .detail-label { 
            font-weight: bold; 
            font-size: 8px; 
            color: #666; 
            margin-bottom: 2px; 
            text-transform: uppercase;
          }
          .detail-value { font-size: 10px; margin-bottom: 2px; }
          
          /* Training Details - Inline */
          .training-box {
            padding: 8px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 9px;
          }
          .training-box .detail-label { display: inline; }
          .training-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
          
          /* Compact Table */
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 9px; }
          th { background: ${secondaryColor}; color: white; font-weight: bold; font-size: 8px; text-transform: uppercase; }
          .text-right { text-align: right; }
          
          /* Compact Totals */
          .totals { 
            width: 50%;
            margin-left: auto;
            font-size: 9px;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 4px 0; 
            border-bottom: 1px solid #eee;
          }
          .grand-total { 
            font-size: 12px; 
            font-weight: bold; 
            background: ${secondaryColor}; 
            color: white; 
            padding: 8px 10px; 
            margin-top: 5px; 
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
          }
          
          /* Compact Footer */
          .footer { 
            margin-top: 15px; 
            font-size: 8px; 
            color: #555;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          .footer p { margin-bottom: 3px; }
          
          .tagline { 
            font-style: italic;
            color: ${primaryColor}; 
            font-size: 10px; 
            text-align: center; 
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <!-- Compact Header -->
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />` : ''}
          <div class="company-details">
            <div class="company-name">${settings.company_name || 'MDDRC SDN BHD'}</div>
            <div class="company-info">
              ${settings.company_reg_no ? `(${settings.company_reg_no})` : ''}
              ${settings.address_line1 ? ` • ${settings.address_line1}` : ''}${settings.address_line2 ? `, ${settings.address_line2}` : ''}<br>
              ${settings.city || ''}${settings.postcode ? ` ${settings.postcode}` : ''}${settings.state ? `, ${settings.state}` : ''}
              ${settings.phone ? ` • Tel: ${settings.phone}` : ''}${settings.email ? ` • ${settings.email}` : ''}
            </div>
          </div>
        </div>
        
        <div class="invoice-title">INVOICE</div>
        
        <div class="details-grid">
          <div class="detail-box">
            <div class="detail-label">Bill To:</div>
            <div class="detail-value" style="font-weight: bold;">${invoice.bill_to_name || invoice.company_name || '-'}</div>
            ${invoice.bill_to_address ? `<div class="detail-value">${invoice.bill_to_address}</div>` : ''}
            ${invoice.bill_to_reg_no ? `<div class="detail-value">Reg: ${invoice.bill_to_reg_no}</div>` : ''}
          </div>
          <div class="detail-box">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
              <div><div class="detail-label">Invoice No:</div><div class="detail-value">${invoice.invoice_number}</div></div>
              <div><div class="detail-label">Date:</div><div class="detail-value">${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-MY') : (invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('en-MY') : new Date().toLocaleDateString('en-MY'))}</div></div>
              ${invoice.your_reference ? `<div style="grid-column: span 2;"><div class="detail-label">Your Ref:</div><div class="detail-value">${invoice.your_reference}</div></div>` : ''}
            </div>
          </div>
        </div>
        
        <div class="training-box">
          <div class="training-grid">
            <div><span class="detail-label">Program:</span> ${invoice.programme_name || '-'}</div>
            <div><span class="detail-label">Company:</span> ${invoice.company_name || '-'}</div>
            <div><span class="detail-label">Training Date:</span> ${invoice.training_dates || '-'}</div>
            <div><span class="detail-label">Venue:</span> ${invoice.venue || '-'}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Description</th>
              <th class="text-right" style="width: 50px;">Qty</th>
              <th class="text-right" style="width: 80px;">Price (RM)</th>
              <th class="text-right" style="width: 90px;">Total (RM)</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.line_items || []).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.description || '-'}</td>
                <td class="text-right">${item.quantity || 0}</td>
                <td class="text-right">${(item.unit_price || 0).toLocaleString('en-MY', {minimumFractionDigits: 2})}</td>
                <td class="text-right">${(item.amount || 0).toLocaleString('en-MY', {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row"><span>Sub-Total:</span><span>RM ${(invoice.subtotal || 0).toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>
          ${invoice.mobilisation_fee ? `<div class="total-row"><span>Mobilisation Fee:</span><span>RM ${invoice.mobilisation_fee.toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>` : ''}
          ${invoice.rounding ? `<div class="total-row"><span>Rounding:</span><span>RM ${invoice.rounding.toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>` : ''}
          ${invoice.tax_amount ? `<div class="total-row"><span>Tax (${invoice.tax_rate || 0}%):</span><span>RM ${invoice.tax_amount.toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>` : ''}
          ${invoice.discount ? `<div class="total-row"><span>Discount:</span><span>- RM ${invoice.discount.toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>` : ''}
          <div class="grand-total"><span>GRAND TOTAL</span><span>RM ${(invoice.total_amount || 0).toLocaleString('en-MY', {minimumFractionDigits: 2})}</span></div>
        </div>
        
        <div class="footer">
          <p><strong>Payment Terms:</strong> ${settings.invoice_terms || 'Upon receipt of invoice'}</p>
          <p><strong>Bank:</strong> ${settings.bank_name || '-'} | <strong>Account:</strong> ${settings.bank_account_name || settings.company_name || '-'} | <strong>No:</strong> ${settings.bank_account_number || '-'}</p>
          <p>${settings.invoice_footer_note || 'Thank you for your business!'}</p>
        </div>
        
        <div class="tagline">"${tagline}"</div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.invoice_id) {
      toast.error('Please select an invoice');
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      // Record the payment
      await axiosInstance.post('/finance/payments', {
        invoice_id: paymentForm.invoice_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes
      });

      // If CN checkbox is checked, create credit note
      if (paymentForm.create_cn) {
        const selectedInvoice = pendingInvoices.find(inv => inv.id === paymentForm.invoice_id);
        if (selectedInvoice) {
          await axiosInstance.post(`/finance/session/${selectedInvoice.session_id}/credit-note`, {
            reason: paymentForm.cn_reason,
            description: `${paymentForm.cn_percentage}% deduction`,
            percentage: parseFloat(paymentForm.cn_percentage),
            base_amount: selectedInvoice.total_amount
          });
          toast.success('Credit Note created');
        }
      }

      toast.success('Payment recorded successfully');
      
      // Reset form
      setPaymentForm({
        invoice_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
        create_cn: false,
        cn_percentage: '4',
        cn_reason: 'HRDCorp Levy Deduction'
      });
      
      loadInvoices();
      loadDashboard();
      loadPendingInvoices();
      loadPayments();
      loadCreditNotes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    const selected = pendingInvoices.find(inv => inv.id === invoiceId);
    setPaymentForm({
      ...paymentForm,
      invoice_id: invoiceId,
      amount: selected?.total_amount?.toString() || ''
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      auto_draft: { color: 'bg-gray-500', label: 'Draft' },
      draft: { color: 'bg-gray-500', label: 'Draft' },
      finance_review: { color: 'bg-yellow-500', label: 'Under Review' },
      approved: { color: 'bg-blue-500', label: 'Approved' },
      issued: { color: 'bg-purple-500', label: 'Issued' },
      paid: { color: 'bg-green-500', label: 'Paid' },
      cancelled: { color: 'bg-red-500', label: 'Cancelled' }
    };
    const config = statusConfig[status] || { color: 'bg-gray-400', label: status };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  // Filter invoices based on status
  const filteredInvoices = statusFilter === 'all' 
    ? invoices 
    : statusFilter === 'pending' 
      ? invoices.filter(inv => !['paid', 'cancelled'].includes(inv.status))
      : invoices.filter(inv => inv.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finance Portal</h1>
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
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto w-full justify-start bg-gray-100 p-2 rounded-lg">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm">Invoices</TabsTrigger>
            <TabsTrigger value="payables" className="text-xs sm:text-sm">Payables</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">Payments</TabsTrigger>
            <TabsTrigger value="credit-notes" className="text-xs sm:text-sm">Credit Notes</TabsTrigger>
            <TabsTrigger value="profit-loss" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" />
              P&L Ledger
            </TabsTrigger>
            <TabsTrigger value="petty-cash" className="text-xs sm:text-sm">
              <Wallet className="w-4 h-4 mr-1 hidden sm:inline" />
              Petty Cash
            </TabsTrigger>
            <TabsTrigger value="hr" className="text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1 hidden sm:inline" />
              HR & Payroll
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit Log</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-1 hidden sm:inline" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Total Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {dashboard?.invoices?.total || 0}
                  </div>
                  <p className="text-sm text-blue-600">
                    RM {(dashboard?.financials?.total_issued || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    RM {(dashboard?.financials?.total_collected || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-green-600">
                    {dashboard?.invoices?.paid || 0} invoices paid
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    RM {(dashboard?.financials?.outstanding_receivables || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-orange-600">
                    {dashboard?.invoices?.issued || 0} pending
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Payables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    RM {(dashboard?.payables?.pending_total || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-600">
                    Staff payments pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={() => setActiveTab('payments')} className="bg-green-600 hover:bg-green-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('credit-notes')}>
                    <FileX className="w-4 h-4 mr-2" />
                    View Credit Notes
                  </Button>
                  <Button variant="outline" onClick={() => { loadInvoices(); loadDashboard(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payables Tab - Pay staff fees with monthly grouping */}
          <TabsContent value="payables">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Staff Payables</CardTitle>
                    <CardDescription>
                      Monthly closing: 1st-31st | Payment release: 15th of following month
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadPayables}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-700 font-medium">Trainer Fees</p>
                      <p className="text-xl font-bold text-blue-900">
                        RM {payables.trainer_fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.fee_amount || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600">{payables.trainer_fees.filter(f => f.status !== 'paid').length} pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-700 font-medium">Coordinator Fees</p>
                      <p className="text-xl font-bold text-green-900">
                        RM {payables.coordinator_fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.total_fee || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">{payables.coordinator_fees.filter(f => f.status !== 'paid').length} pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-purple-700 font-medium">Marketing Commission</p>
                      <p className="text-xl font-bold text-purple-900">
                        RM {payables.marketing_commissions.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.calculated_amount || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600">{payables.marketing_commissions.filter(f => f.status !== 'paid').length} pending</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="trainer" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="trainer">Trainers ({payables.trainer_fees.length})</TabsTrigger>
                    <TabsTrigger value="coordinator">Coordinators ({payables.coordinator_fees.length})</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing ({payables.marketing_commissions.length})</TabsTrigger>
                  </TabsList>

                  {/* Trainer Fees Tab */}
                  <TabsContent value="trainer">
                    {payables.trainer_fees.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No trainer fees</p>
                    ) : (
                      <div className="space-y-4">
                        {groupByMonth(payables.trainer_fees).map(group => (
                          <div key={group.key} className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-100 px-4 py-3 flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-blue-900">{group.label}</h4>
                                <p className="text-sm text-blue-700">Total: RM {group.total.toLocaleString()} | {group.records.length} item(s)</p>
                              </div>
                              {group.records.some(r => r.status !== 'paid') && (
                                <Button size="sm" onClick={() => handleBulkMarkPaid('trainer', group.records)}>
                                  <Check className="w-4 h-4 mr-1" />
                                  Pay All ({group.records.filter(r => r.status !== 'paid').length})
                                </Button>
                              )}
                            </div>
                            <div className="divide-y">
                              {group.records.map(fee => (
                                <div key={fee.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                    <p className="font-medium">{fee.trainer_name}</p>
                                    <p className="text-sm text-gray-600">{fee.session_name}</p>
                                    <p className="text-xs text-gray-500">Role: {fee.trainer_role || 'Trainer'}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-bold">RM {(fee.fee_amount || 0).toLocaleString()}</p>
                                      <Badge className={fee.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                                        {fee.status || 'pending'}
                                      </Badge>
                                    </div>
                                    {fee.status !== 'paid' && (
                                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid('trainer', fee.id)}>
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Coordinator Fees Tab */}
                  <TabsContent value="coordinator">
                    {payables.coordinator_fees.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No coordinator fees</p>
                    ) : (
                      <div className="space-y-4">
                        {groupByMonth(payables.coordinator_fees).map(group => (
                          <div key={group.key} className="border rounded-lg overflow-hidden">
                            <div className="bg-green-100 px-4 py-3 flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-green-900">{group.label}</h4>
                                <p className="text-sm text-green-700">Total: RM {group.total.toLocaleString()} | {group.records.length} item(s)</p>
                              </div>
                              {group.records.some(r => r.status !== 'paid') && (
                                <Button size="sm" onClick={() => handleBulkMarkPaid('coordinator', group.records)}>
                                  <Check className="w-4 h-4 mr-1" />
                                  Pay All ({group.records.filter(r => r.status !== 'paid').length})
                                </Button>
                              )}
                            </div>
                            <div className="divide-y">
                              {group.records.map(fee => (
                                <div key={fee.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                    <p className="font-medium">{fee.coordinator_name}</p>
                                    <p className="text-sm text-gray-600">{fee.session_name}</p>
                                    <p className="text-xs text-gray-500">{fee.num_days || 1} day(s) × RM {fee.daily_rate || 0}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-bold">RM {(fee.total_fee || 0).toLocaleString()}</p>
                                      <Badge className={fee.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                                        {fee.status || 'pending'}
                                      </Badge>
                                    </div>
                                    {fee.status !== 'paid' && (
                                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid('coordinator', fee.id)}>
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Marketing Commissions Tab */}
                  <TabsContent value="marketing">
                    {payables.marketing_commissions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No marketing commissions</p>
                    ) : (
                      <div className="space-y-4">
                        {groupByMonth(payables.marketing_commissions).map(group => (
                          <div key={group.key} className="border rounded-lg overflow-hidden">
                            <div className="bg-purple-100 px-4 py-3 flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-purple-900">{group.label}</h4>
                                <p className="text-sm text-purple-700">Total: RM {group.total.toLocaleString()} | {group.records.length} item(s)</p>
                              </div>
                              {group.records.some(r => r.status !== 'paid') && (
                                <Button size="sm" onClick={() => handleBulkMarkPaid('marketing', group.records)}>
                                  <Check className="w-4 h-4 mr-1" />
                                  Pay All ({group.records.filter(r => r.status !== 'paid').length})
                                </Button>
                              )}
                            </div>
                            <div className="divide-y">
                              {group.records.map(comm => (
                                <div key={comm.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                    <p className="font-medium">{comm.marketing_user_name}</p>
                                    <p className="text-sm text-gray-600">{comm.session_name}</p>
                                    <p className="text-xs text-gray-500">{comm.commission_percentage || 0}% of RM {(comm.invoice_amount || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-bold">RM {(comm.calculated_amount || 0).toLocaleString()}</p>
                                      <Badge className={comm.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                                        {comm.status || 'pending'}
                                      </Badge>
                                    </div>
                                    {comm.status !== 'paid' && (
                                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid('marketing', comm.id)}>
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <CardTitle>Invoice Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportInvoices} className="text-green-600">
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Export Excel
                    </Button>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Invoices</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadInvoices}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No invoices found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice #</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Session</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{invoice.invoice_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-MY') : '-'}</td>
                            <td className="px-4 py-3 text-sm">{invoice.company_name || '-'}</td>
                            <td className="px-4 py-3 text-sm">{invoice.session_name || '-'}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">RM {invoice.total_amount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(invoice.status)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1">
                                {/* Edit Button - Available before issuing */}
                                {!['issued', 'paid', 'cancelled'].includes(invoice.status) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-orange-600"
                                    onClick={() => handleEditInvoice(invoice)}
                                    title="Edit Invoice"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {(invoice.status === 'auto_draft' || invoice.status === 'draft') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => handleApproveInvoice(invoice.id)}
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {invoice.status === 'approved' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-blue-600"
                                    onClick={() => handleIssueInvoice(invoice.id)}
                                    title="Issue"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                )}
                                {invoice.status === 'issued' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() => handlePrintInvoice(invoice)}
                                      title="Download Invoice"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-blue-600"
                                      onClick={() => {
                                        handleInvoiceSelect(invoice.id);
                                        setActiveTab('payments');
                                      }}
                                      title="Record Payment"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {invoice.status === 'paid' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => handlePrintInvoice(invoice)}
                                    title="Download Invoice"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                {!['paid', 'cancelled'].includes(invoice.status) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleCancelInvoice(invoice.id)}
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Record Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Record Payment
                  </CardTitle>
                  <CardDescription>Record payment received for an invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Invoice (Pending Only)</Label>
                    <Select value={paymentForm.invoice_id} onValueChange={handleInvoiceSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an invoice to pay" />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingInvoices.length === 0 ? (
                          <SelectItem value="none" disabled>No pending invoices</SelectItem>
                        ) : (
                          pendingInvoices.map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.invoice_number} - {inv.company_name || inv.session_name} (RM {inv.total_amount?.toLocaleString()})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Amount (RM)</Label>
                      <Input 
                        type="number" 
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Payment Date</Label>
                      <Input 
                        type="date" 
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({...paymentForm, payment_method: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Reference Number</Label>
                      <Input 
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                        placeholder="Transaction ref"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input 
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      placeholder="Additional notes"
                    />
                  </div>
                  
                  {/* Credit Note Option */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="create-cn"
                        checked={paymentForm.create_cn}
                        onChange={(e) => setPaymentForm({...paymentForm, create_cn: e.target.checked})}
                      />
                      <Label htmlFor="create-cn" className="text-red-700 font-medium">
                        Create Credit Note (e.g., HRDCorp deduction)
                      </Label>
                    </div>
                    {paymentForm.create_cn && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Deduction %</Label>
                          <Input 
                            type="number" 
                            value={paymentForm.cn_percentage}
                            onChange={(e) => setPaymentForm({...paymentForm, cn_percentage: e.target.value})}
                            placeholder="4"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Reason</Label>
                          <Input 
                            value={paymentForm.cn_reason}
                            onChange={(e) => setPaymentForm({...paymentForm, cn_reason: e.target.value})}
                            placeholder="HRDCorp Levy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleRecordPayment} className="bg-green-600 hover:bg-green-700 flex-1">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                    <Button variant="outline" onClick={() => setPaymentForm({
                      invoice_id: '',
                      amount: '',
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'bank_transfer',
                      reference_number: '',
                      notes: '',
                      create_cn: false,
                      cn_percentage: '4',
                      cn_reason: 'HRDCorp Levy Deduction'
                    })}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Payments</CardTitle>
                    <Button variant="outline" size="sm" onClick={loadPayments}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No payments recorded yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={loadPayments}>
                        Load Payments
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.slice(0, 10).map((payment) => (
                        <div key={payment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{payment.invoice_number}</p>
                              <p className="text-sm text-gray-500">{payment.payment_date}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-bold text-green-600">RM {payment.amount?.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{payment.payment_method}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePrintReceipt(payment)}
                                title="Print Receipt"
                              >
                                <Receipt className="w-4 h-4 text-purple-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credit Notes Tab */}
          <TabsContent value="credit-notes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileX className="w-5 h-5 text-red-600" />
                      Credit Notes
                    </CardTitle>
                    <CardDescription>Track deductions like HRDCorp levy</CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadCreditNotes}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {creditNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileX className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No credit notes yet</p>
                    <p className="text-sm">Credit notes are created when recording payments with deductions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CN Number</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Reason</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {creditNotes.map((cn) => (
                          <tr key={cn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-red-600">{cn.cn_number}</td>
                            <td className="px-4 py-3 text-sm">{cn.invoice_number || '-'}</td>
                            <td className="px-4 py-3 text-sm">{cn.company_name || '-'}</td>
                            <td className="px-4 py-3 text-sm">{cn.reason}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-red-600">- RM {cn.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={cn.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                                {cn.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Ledger Tab */}
          <TabsContent value="profit-loss">
            <ProfitLossLedger />
          </TabsContent>

          {/* Petty Cash Tab */}
          <TabsContent value="petty-cash">
            <PettyCash />
          </TabsContent>

          {/* HR & Payroll Tab */}
          <TabsContent value="hr">
            <HRModule />
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Audit Log</CardTitle>
                  <Button variant="outline" onClick={loadAuditLogs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Click Load Logs to view audit history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log, idx) => (
                      <div key={log.id || idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{log.action} - {log.entity_type}</p>
                            <p className="text-sm text-gray-500">By: {log.changed_by_name}</p>
                            {log.remark && <p className="text-sm text-gray-400">{log.remark}</p>}
                          </div>
                          <p className="text-xs text-gray-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Company Settings
                </CardTitle>
                <CardDescription>
                  Customize your company details for invoices and receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Info */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-blue-900">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={companySettings.company_name}
                        onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Registration No.</Label>
                      <Input
                        value={companySettings.company_reg_no}
                        onChange={(e) => setCompanySettings({...companySettings, company_reg_no: e.target.value})}
                        placeholder="e.g., 1234567-A"
                      />
                    </div>
                    <div>
                      <Label>Address Line 1</Label>
                      <Input
                        value={companySettings.address_line1}
                        onChange={(e) => setCompanySettings({...companySettings, address_line1: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Address Line 2</Label>
                      <Input
                        value={companySettings.address_line2}
                        onChange={(e) => setCompanySettings({...companySettings, address_line2: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={companySettings.city}
                        onChange={(e) => setCompanySettings({...companySettings, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input
                        value={companySettings.postcode}
                        onChange={(e) => setCompanySettings({...companySettings, postcode: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={companySettings.state}
                        onChange={(e) => setCompanySettings({...companySettings, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={companySettings.website}
                        onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-4 bg-green-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-green-900">Bank Details (for invoices)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={companySettings.bank_name}
                        onChange={(e) => setCompanySettings({...companySettings, bank_name: e.target.value})}
                        placeholder="e.g., Maybank"
                      />
                    </div>
                    <div>
                      <Label>Account Name</Label>
                      <Input
                        value={companySettings.bank_account_name}
                        onChange={(e) => setCompanySettings({...companySettings, bank_account_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={companySettings.bank_account_number}
                        onChange={(e) => setCompanySettings({...companySettings, bank_account_number: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Settings */}
                <div className="p-4 bg-purple-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-purple-900">Invoice Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Terms</Label>
                      <Input
                        value={companySettings.invoice_terms}
                        onChange={(e) => setCompanySettings({...companySettings, invoice_terms: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Footer Note</Label>
                      <Input
                        value={companySettings.invoice_footer_note}
                        onChange={(e) => setCompanySettings({...companySettings, invoice_footer_note: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Logo URL (optional)</Label>
                      <Input
                        value={companySettings.logo_url || ''}
                        onChange={(e) => setCompanySettings({...companySettings, logo_url: e.target.value})}
                        placeholder="https://your-logo-url.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Styling Settings */}
                <div className="p-4 bg-orange-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-orange-900">📄 Document Styling (Invoice, Payslip, Pay Advice)</h3>
                  <p className="text-sm text-orange-700">Customize the look of all printed documents</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Logo Settings */}
                    <div>
                      <Label>Logo Width (px)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="300"
                        value={companySettings.logo_width || 150}
                        onChange={(e) => setCompanySettings({...companySettings, logo_width: parseInt(e.target.value) || 150})}
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: 150px. Max: 300px</p>
                    </div>
                    <div>
                      <Label>Logo Position</Label>
                      <Select 
                        value={companySettings.logo_position || 'center'} 
                        onValueChange={(v) => setCompanySettings({...companySettings, logo_position: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="show_watermark"
                        checked={companySettings.show_watermark !== false}
                        onChange={(e) => setCompanySettings({...companySettings, show_watermark: e.target.checked})}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="show_watermark" className="cursor-pointer">Show Logo Watermark</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Colors */}
                    <div>
                      <Label>Primary Color (Headers)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={companySettings.primary_color || '#1a365d'}
                          onChange={(e) => setCompanySettings({...companySettings, primary_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={companySettings.primary_color || '#1a365d'}
                          onChange={(e) => setCompanySettings({...companySettings, primary_color: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color (Accents)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={companySettings.secondary_color || '#4472C4'}
                          onChange={(e) => setCompanySettings({...companySettings, secondary_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={companySettings.secondary_color || '#4472C4'}
                          onChange={(e) => setCompanySettings({...companySettings, secondary_color: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Watermark Opacity</Label>
                      <Input
                        type="range"
                        min="0.02"
                        max="0.2"
                        step="0.01"
                        value={companySettings.watermark_opacity || 0.08}
                        onChange={(e) => setCompanySettings({...companySettings, watermark_opacity: parseFloat(e.target.value)})}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500">{((companySettings.watermark_opacity || 0.08) * 100).toFixed(0)}% opacity</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fonts */}
                    <div>
                      <Label>Header Font</Label>
                      <Select 
                        value={companySettings.header_font || 'Arial'} 
                        onValueChange={(v) => setCompanySettings({...companySettings, header_font: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Body Font</Label>
                      <Select 
                        value={companySettings.body_font || 'Arial'} 
                        onValueChange={(v) => setCompanySettings({...companySettings, body_font: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Footer Tagline</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <Label>Tagline Text</Label>
                        <Input
                          value={companySettings.tagline || 'Towards a Nation of Safe Drivers'}
                          onChange={(e) => setCompanySettings({...companySettings, tagline: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Tagline Font</Label>
                        <Select 
                          value={companySettings.tagline_font || 'Georgia'} 
                          onValueChange={(v) => setCompanySettings({...companySettings, tagline_font: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Georgia">Georgia (Elegant)</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Palatino">Palatino</SelectItem>
                            <SelectItem value="Garamond">Garamond</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tagline Style</Label>
                        <Select 
                          value={companySettings.tagline_style || 'italic'} 
                          onValueChange={(v) => setCompanySettings({...companySettings, tagline_style: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Preview */}
                    <div className="mt-3 p-3 bg-white border rounded text-center">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <p style={{
                        fontFamily: companySettings.tagline_font || 'Georgia',
                        fontStyle: companySettings.tagline_style === 'italic' ? 'italic' : 'normal',
                        fontWeight: companySettings.tagline_style === 'bold' ? 'bold' : 'normal',
                        color: companySettings.primary_color || '#1a365d',
                        fontSize: '14px'
                      }}>
                        "{companySettings.tagline || 'Towards a Nation of Safe Drivers'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Custom Fields for Documents */}
                <div className="p-4 bg-indigo-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-indigo-900">🔧 Custom Fields (Add to Documents)</h3>
                  <p className="text-sm text-indigo-700">Add extra fields to any document type without coding. These will appear in the respective documents.</p>
                  
                  <Tabs defaultValue="invoice_fields" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="invoice_fields">Invoice</TabsTrigger>
                      <TabsTrigger value="indemnity_fields">Indemnity</TabsTrigger>
                      <TabsTrigger value="payslip_fields">Payslip</TabsTrigger>
                      <TabsTrigger value="payadvice_fields">Pay Advice</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="invoice_fields" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Invoice Custom Fields</Label>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fields = companySettings.invoice_custom_fields || [];
                              setCompanySettings({
                                ...companySettings, 
                                invoice_custom_fields: [...fields, { label: '', value: '', position: 'footer' }]
                              });
                            }}
                          >
                            + Add Field
                          </Button>
                        </div>
                        {(companySettings.invoice_custom_fields || []).map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                            <Input
                              placeholder="Label (e.g., GST No.)"
                              value={field.label}
                              onChange={(e) => {
                                const fields = [...(companySettings.invoice_custom_fields || [])];
                                fields[idx].label = e.target.value;
                                setCompanySettings({...companySettings, invoice_custom_fields: fields});
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Value"
                              value={field.value}
                              onChange={(e) => {
                                const fields = [...(companySettings.invoice_custom_fields || [])];
                                fields[idx].value = e.target.value;
                                setCompanySettings({...companySettings, invoice_custom_fields: fields});
                              }}
                              className="flex-1"
                            />
                            <Select 
                              value={field.position || 'footer'}
                              onValueChange={(v) => {
                                const fields = [...(companySettings.invoice_custom_fields || [])];
                                fields[idx].position = v;
                                setCompanySettings({...companySettings, invoice_custom_fields: fields});
                              }}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="details">Details</SelectItem>
                                <SelectItem value="footer">Footer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const fields = (companySettings.invoice_custom_fields || []).filter((_, i) => i !== idx);
                                setCompanySettings({...companySettings, invoice_custom_fields: fields});
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        {(!companySettings.invoice_custom_fields || companySettings.invoice_custom_fields.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No custom fields. Click "Add Field" to add.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="indemnity_fields" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Indemnity Form Custom Fields</Label>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fields = companySettings.indemnity_custom_fields || [];
                              setCompanySettings({
                                ...companySettings, 
                                indemnity_custom_fields: [...fields, { label: '', type: 'text', required: false }]
                              });
                            }}
                          >
                            + Add Field
                          </Button>
                        </div>
                        {(companySettings.indemnity_custom_fields || []).map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                            <Input
                              placeholder="Field Label"
                              value={field.label}
                              onChange={(e) => {
                                const fields = [...(companySettings.indemnity_custom_fields || [])];
                                fields[idx].label = e.target.value;
                                setCompanySettings({...companySettings, indemnity_custom_fields: fields});
                              }}
                              className="flex-1"
                            />
                            <Select 
                              value={field.type || 'text'}
                              onValueChange={(v) => {
                                const fields = [...(companySettings.indemnity_custom_fields || [])];
                                fields[idx].type = v;
                                setCompanySettings({...companySettings, indemnity_custom_fields: fields});
                              }}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="signature">Signature</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                              <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => {
                                  const fields = [...(companySettings.indemnity_custom_fields || [])];
                                  fields[idx].required = e.target.checked;
                                  setCompanySettings({...companySettings, indemnity_custom_fields: fields});
                                }}
                              />
                              <span className="text-xs">Required</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const fields = (companySettings.indemnity_custom_fields || []).filter((_, i) => i !== idx);
                                setCompanySettings({...companySettings, indemnity_custom_fields: fields});
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        {(!companySettings.indemnity_custom_fields || companySettings.indemnity_custom_fields.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No custom fields. Click "Add Field" to add.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payslip_fields" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Payslip Custom Fields</Label>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fields = companySettings.payslip_custom_fields || [];
                              setCompanySettings({
                                ...companySettings, 
                                payslip_custom_fields: [...fields, { label: '', type: 'earning', default_value: '' }]
                              });
                            }}
                          >
                            + Add Field
                          </Button>
                        </div>
                        {(companySettings.payslip_custom_fields || []).map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                            <Input
                              placeholder="Field Label (e.g., Transport Allowance)"
                              value={field.label}
                              onChange={(e) => {
                                const fields = [...(companySettings.payslip_custom_fields || [])];
                                fields[idx].label = e.target.value;
                                setCompanySettings({...companySettings, payslip_custom_fields: fields});
                              }}
                              className="flex-1"
                            />
                            <Select 
                              value={field.type || 'earning'}
                              onValueChange={(v) => {
                                const fields = [...(companySettings.payslip_custom_fields || [])];
                                fields[idx].type = v;
                                setCompanySettings({...companySettings, payslip_custom_fields: fields});
                              }}
                            >
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="earning">Earning (+)</SelectItem>
                                <SelectItem value="deduction">Deduction (-)</SelectItem>
                                <SelectItem value="info">Info Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const fields = (companySettings.payslip_custom_fields || []).filter((_, i) => i !== idx);
                                setCompanySettings({...companySettings, payslip_custom_fields: fields});
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        {(!companySettings.payslip_custom_fields || companySettings.payslip_custom_fields.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No custom fields. Click "Add Field" to add.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payadvice_fields" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Pay Advice Custom Fields</Label>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fields = companySettings.payadvice_custom_fields || [];
                              setCompanySettings({
                                ...companySettings, 
                                payadvice_custom_fields: [...fields, { label: '', show_in_summary: true }]
                              });
                            }}
                          >
                            + Add Field
                          </Button>
                        </div>
                        {(companySettings.payadvice_custom_fields || []).map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                            <Input
                              placeholder="Field Label (e.g., Bonus, Incentive)"
                              value={field.label}
                              onChange={(e) => {
                                const fields = [...(companySettings.payadvice_custom_fields || [])];
                                fields[idx].label = e.target.value;
                                setCompanySettings({...companySettings, payadvice_custom_fields: fields});
                              }}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-1">
                              <input 
                                type="checkbox" 
                                checked={field.show_in_summary !== false}
                                onChange={(e) => {
                                  const fields = [...(companySettings.payadvice_custom_fields || [])];
                                  fields[idx].show_in_summary = e.target.checked;
                                  setCompanySettings({...companySettings, payadvice_custom_fields: fields});
                                }}
                              />
                              <span className="text-xs">Show in Summary</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const fields = (companySettings.payadvice_custom_fields || []).filter((_, i) => i !== idx);
                                setCompanySettings({...companySettings, payadvice_custom_fields: fields});
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        {(!companySettings.payadvice_custom_fields || companySettings.payadvice_custom_fields.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No custom fields. Click "Add Field" to add.</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Live Document Preview */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">👁️ Live Document Preview</h3>
                  <p className="text-sm text-gray-600">See how your documents will look with current settings</p>
                  
                  <Tabs defaultValue="invoice_preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="invoice_preview">Invoice</TabsTrigger>
                      <TabsTrigger value="indemnity_preview">Indemnity</TabsTrigger>
                      <TabsTrigger value="payslip_preview">Payslip</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="invoice_preview" className="mt-4">
                      <div 
                        className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner relative overflow-hidden"
                        style={{ minHeight: '400px' }}
                      >
                        {/* Watermark */}
                        {companySettings.show_watermark && companySettings.logo_url && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ opacity: companySettings.watermark_opacity || 0.08 }}
                          >
                            <img src={companySettings.logo_url} alt="" style={{ width: '300px' }} />
                          </div>
                        )}
                        
                        {/* Header */}
                        <div style={{ textAlign: companySettings.logo_position || 'center' }}>
                          {companySettings.logo_url && (
                            <img 
                              src={companySettings.logo_url} 
                              alt="Logo" 
                              style={{ width: `${companySettings.logo_width || 150}px`, marginBottom: '10px', display: 'inline-block' }}
                            />
                          )}
                          <div style={{ 
                            fontFamily: companySettings.header_font || 'Arial',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: companySettings.primary_color || '#1a365d'
                          }}>
                            {companySettings.company_name || 'MDDRC SDN BHD'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {companySettings.address_line1} {companySettings.address_line2}<br/>
                            {companySettings.city} {companySettings.postcode} {companySettings.state}
                          </div>
                        </div>
                        
                        {/* Invoice Title */}
                        <div style={{ 
                          textAlign: 'center', 
                          margin: '15px 0',
                          fontFamily: companySettings.header_font || 'Arial',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: companySettings.primary_color || '#1a365d'
                        }}>
                          INVOICE
                        </div>
                        
                        {/* Sample Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ backgroundColor: companySettings.secondary_color || '#4472C4', color: 'white' }}>
                              <th style={{ padding: '6px', border: '1px solid #ddd' }}>No</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd' }}>Description</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody style={{ fontFamily: companySettings.body_font || 'Arial' }}>
                            <tr>
                              <td style={{ padding: '6px', border: '1px solid #ddd' }}>1</td>
                              <td style={{ padding: '6px', border: '1px solid #ddd' }}>Training Fee (Sample)</td>
                              <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>RM 5,000.00</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        {/* Custom Fields Preview */}
                        {(companySettings.invoice_custom_fields || []).filter(f => f.label).length > 0 && (
                          <div style={{ marginTop: '10px', fontSize: '11px', fontFamily: companySettings.body_font || 'Arial' }}>
                            {(companySettings.invoice_custom_fields || []).filter(f => f.label && f.position === 'footer').map((f, i) => (
                              <div key={i}><strong>{f.label}:</strong> {f.value || '[Value]'}</div>
                            ))}
                          </div>
                        )}
                        
                        {/* Tagline */}
                        <div style={{ 
                          textAlign: 'center',
                          marginTop: '20px',
                          paddingTop: '15px',
                          borderTop: `2px solid ${companySettings.primary_color || '#1a365d'}`,
                          fontFamily: companySettings.tagline_font || 'Georgia',
                          fontStyle: companySettings.tagline_style === 'italic' ? 'italic' : 'normal',
                          fontWeight: companySettings.tagline_style === 'bold' ? 'bold' : 'normal',
                          color: companySettings.primary_color || '#1a365d',
                          fontSize: '12px'
                        }}>
                          "{companySettings.tagline || 'Towards a Nation of Safe Drivers'}"
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="indemnity_preview" className="mt-4">
                      <div 
                        className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner relative overflow-hidden"
                        style={{ minHeight: '400px' }}
                      >
                        {/* Watermark */}
                        {companySettings.show_watermark && companySettings.logo_url && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ opacity: companySettings.watermark_opacity || 0.08 }}
                          >
                            <img src={companySettings.logo_url} alt="" style={{ width: '300px' }} />
                          </div>
                        )}
                        
                        {/* Header */}
                        <div style={{ textAlign: companySettings.logo_position || 'center' }}>
                          {companySettings.logo_url && (
                            <img 
                              src={companySettings.logo_url} 
                              alt="Logo" 
                              style={{ width: `${companySettings.logo_width || 150}px`, marginBottom: '10px', display: 'inline-block' }}
                            />
                          )}
                          <div style={{ 
                            fontFamily: companySettings.header_font || 'Arial',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: companySettings.primary_color || '#1a365d'
                          }}>
                            {companySettings.company_name || 'MDDRC SDN BHD'}
                          </div>
                        </div>
                        
                        <div style={{ 
                          textAlign: 'center', 
                          margin: '15px 0',
                          fontFamily: companySettings.header_font || 'Arial',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: companySettings.primary_color || '#1a365d'
                        }}>
                          INDEMNITY FORM
                        </div>
                        
                        <div style={{ fontFamily: companySettings.body_font || 'Arial', fontSize: '11px', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '10px' }}>
                            I, the undersigned, hereby acknowledge that I am participating in the training program voluntarily...
                          </p>
                          
                          <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><strong>Full Name:</strong> _______________</div>
                            <div><strong>IC Number:</strong> _______________</div>
                            <div><strong>Date:</strong> _______________</div>
                            <div><strong>Signature:</strong> _______________</div>
                          </div>
                          
                          {/* Custom Fields */}
                          {(companySettings.indemnity_custom_fields || []).filter(f => f.label).length > 0 && (
                            <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                              <strong>Additional Information:</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                                {(companySettings.indemnity_custom_fields || []).filter(f => f.label).map((f, i) => (
                                  <div key={i}><strong>{f.label}{f.required ? '*' : ''}:</strong> _______________</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Tagline */}
                        <div style={{ 
                          textAlign: 'center',
                          marginTop: '20px',
                          paddingTop: '15px',
                          borderTop: `2px solid ${companySettings.primary_color || '#1a365d'}`,
                          fontFamily: companySettings.tagline_font || 'Georgia',
                          fontStyle: companySettings.tagline_style === 'italic' ? 'italic' : 'normal',
                          fontWeight: companySettings.tagline_style === 'bold' ? 'bold' : 'normal',
                          color: companySettings.primary_color || '#1a365d',
                          fontSize: '12px'
                        }}>
                          "{companySettings.tagline || 'Towards a Nation of Safe Drivers'}"
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payslip_preview" className="mt-4">
                      <div 
                        className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner relative overflow-hidden"
                        style={{ minHeight: '400px' }}
                      >
                        {/* Watermark */}
                        {companySettings.show_watermark && companySettings.logo_url && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ opacity: companySettings.watermark_opacity || 0.08 }}
                          >
                            <img src={companySettings.logo_url} alt="" style={{ width: '300px' }} />
                          </div>
                        )}
                        
                        {/* Header */}
                        <div style={{ textAlign: companySettings.logo_position || 'center' }}>
                          {companySettings.logo_url && (
                            <img 
                              src={companySettings.logo_url} 
                              alt="Logo" 
                              style={{ width: `${companySettings.logo_width || 150}px`, marginBottom: '10px', display: 'inline-block' }}
                            />
                          )}
                          <div style={{ 
                            fontFamily: companySettings.header_font || 'Arial',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: companySettings.primary_color || '#1a365d'
                          }}>
                            {companySettings.company_name || 'MDDRC SDN BHD'}
                          </div>
                        </div>
                        
                        <div style={{ 
                          textAlign: 'center', 
                          margin: '15px 0',
                          fontFamily: companySettings.header_font || 'Arial',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: companySettings.primary_color || '#1a365d'
                        }}>
                          PAYSLIP - January 2026
                        </div>
                        
                        <div style={{ fontFamily: companySettings.body_font || 'Arial', fontSize: '11px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Earnings */}
                            <div>
                              <div style={{ backgroundColor: companySettings.secondary_color || '#4472C4', color: 'white', padding: '5px 10px', fontWeight: 'bold' }}>
                                EARNINGS
                              </div>
                              <div style={{ padding: '5px 10px', borderBottom: '1px solid #ddd' }}>Basic Salary: RM 3,000.00</div>
                              {(companySettings.payslip_custom_fields || []).filter(f => f.label && f.type === 'earning').map((f, i) => (
                                <div key={i} style={{ padding: '5px 10px', borderBottom: '1px solid #ddd' }}>{f.label}: RM 0.00</div>
                              ))}
                              <div style={{ padding: '5px 10px', fontWeight: 'bold' }}>Total Earnings: RM 3,000.00</div>
                            </div>
                            
                            {/* Deductions */}
                            <div>
                              <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '5px 10px', fontWeight: 'bold' }}>
                                DEDUCTIONS
                              </div>
                              <div style={{ padding: '5px 10px', borderBottom: '1px solid #ddd' }}>EPF (11%): RM 330.00</div>
                              <div style={{ padding: '5px 10px', borderBottom: '1px solid #ddd' }}>SOCSO: RM 15.00</div>
                              {(companySettings.payslip_custom_fields || []).filter(f => f.label && f.type === 'deduction').map((f, i) => (
                                <div key={i} style={{ padding: '5px 10px', borderBottom: '1px solid #ddd' }}>{f.label}: RM 0.00</div>
                              ))}
                              <div style={{ padding: '5px 10px', fontWeight: 'bold' }}>Total Deductions: RM 345.00</div>
                            </div>
                          </div>
                          
                          <div style={{ 
                            marginTop: '15px', 
                            padding: '10px', 
                            backgroundColor: companySettings.secondary_color || '#4472C4',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}>
                            NET PAY: RM 2,655.00
                          </div>
                        </div>
                        
                        {/* Tagline */}
                        <div style={{ 
                          textAlign: 'center',
                          marginTop: '20px',
                          paddingTop: '15px',
                          borderTop: `2px solid ${companySettings.primary_color || '#1a365d'}`,
                          fontFamily: companySettings.tagline_font || 'Georgia',
                          fontStyle: companySettings.tagline_style === 'italic' ? 'italic' : 'normal',
                          fontWeight: companySettings.tagline_style === 'bold' ? 'bold' : 'normal',
                          color: companySettings.primary_color || '#1a365d',
                          fontSize: '12px'
                        }}>
                          "{companySettings.tagline || 'Towards a Nation of Safe Drivers'}"
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={settingsLoading}>
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Invoice Dialog */}
      <Dialog open={editingInvoice !== null} onOpenChange={(open) => !open && setEditingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Invoice: {editingInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription>
              Modify invoice details before approval/issuance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Bill To Section */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-blue-900">Bill To (M/S)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company/Organization Name</Label>
                  <Input
                    value={editForm.bill_to_name}
                    onChange={(e) => setEditForm({...editForm, bill_to_name: e.target.value})}
                    placeholder="e.g., HUMAN RESOURCES DEVELOPMENT CORPORATION"
                  />
                </div>
                <div>
                  <Label>Co. Reg. No.</Label>
                  <Input
                    value={editForm.bill_to_reg_no}
                    onChange={(e) => setEditForm({...editForm, bill_to_reg_no: e.target.value})}
                    placeholder="Company registration number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={editForm.bill_to_address}
                    onChange={(e) => setEditForm({...editForm, bill_to_address: e.target.value})}
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <Label>Your Reference</Label>
                  <Input
                    value={editForm.your_reference}
                    onChange={(e) => setEditForm({...editForm, your_reference: e.target.value})}
                    placeholder="Client's reference number"
                  />
                </div>
              </div>
            </div>

            {/* Training Details */}
            <div className="p-4 bg-green-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-green-900">Training Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={editForm.programme_name}
                    onChange={(e) => setEditForm({...editForm, programme_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Training Dates</Label>
                  <Input
                    value={editForm.training_dates}
                    onChange={(e) => setEditForm({...editForm, training_dates: e.target.value})}
                    placeholder="e.g., 18th November 2025"
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={editForm.venue}
                    onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Number of Participants</Label>
                  <Input
                    type="number"
                    value={editForm.pax}
                    onChange={(e) => setEditForm({...editForm, pax: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {editForm.line_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {idx === 0 && <Label className="text-xs">Description</Label>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Qty</Label>}
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Unit Price</Label>}
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Amount</Label>}
                      <Input
                        type="number"
                        value={item.amount}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="col-span-1">
                      {editForm.line_items.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => removeLineItem(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-purple-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-purple-900">Totals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Sub-Total (RM)</Label>
                  <Input
                    type="number"
                    value={editForm.subtotal}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label>Mobilisation Fee (RM)</Label>
                  <Input
                    type="number"
                    value={editForm.mobilisation_fee}
                    onChange={(e) => recalculateTotals({mobilisation_fee: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Rounding (RM)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.rounding}
                    onChange={(e) => recalculateTotals({rounding: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Discount (RM)</Label>
                  <Input
                    type="number"
                    value={editForm.discount}
                    onChange={(e) => recalculateTotals({discount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.tax_rate}
                    onChange={(e) => recalculateTotals({tax_rate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Tax Amount (RM)</Label>
                  <Input
                    type="number"
                    value={editForm.tax_amount?.toFixed(2)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-lg font-bold">Grand Total (RM)</Label>
                  <Input
                    type="number"
                    value={editForm.total_amount?.toFixed(2)}
                    disabled
                    className="bg-green-100 text-lg font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingInvoice(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInvoice}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceDashboard;
