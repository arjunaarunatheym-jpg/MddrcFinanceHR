import React, { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '../App';
import { Button } from './ui/button';
import { Printer, X, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const ClaimFormPrint = ({ session, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [costingData, setCostingData] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [session.id]);

  const loadData = async () => {
    try {
      const [costingRes, settingsRes, invoicesRes] = await Promise.all([
        axiosInstance.get(`/finance/session/${session.id}/costing`),
        axiosInstance.get('/finance/company-settings'),
        axiosInstance.get('/finance/invoices')
      ]);
      
      setCostingData(costingRes.data);
      setCompanySettings(settingsRes.data);
      
      // Find invoice for this session to get invoice number
      const sessionInvoice = invoicesRes.data.find(inv => inv.session_id === session.id);
      if (sessionInvoice) {
        setCostingData(prev => ({
          ...prev,
          invoice_number: sessionInvoice.invoice_number,
          invoice_date: sessionInvoice.invoice_date || sessionInvoice.created_at
        }));
      }
    } catch (error) {
      toast.error('Failed to load claim form data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    const logoUrl = companySettings?.logo_url || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Course Registration Form - ${session.name}</title>
          <style>
            @page { size: A4; margin: 8mm 10mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 8px; line-height: 1.25; padding: 5px; }
            
            /* Header - Compact */
            .header { 
              display: flex; 
              align-items: center; 
              justify-content: center;
              margin-bottom: 8px; 
              border-bottom: 2px solid #1e40af; 
              padding-bottom: 6px;
              gap: 12px;
            }
            .logo { max-width: 60px; max-height: 40px; object-fit: contain; }
            .header-text { text-align: center; }
            .company-name { font-size: 11px; font-weight: bold; color: #1e40af; margin-bottom: 2px; }
            .form-title { font-size: 9px; font-weight: bold; background: #e5e7eb; padding: 2px 8px; display: inline-block; }
            
            /* Sections - Compact */
            .section { margin-bottom: 6px; }
            .section-header { 
              background: #1e40af; 
              color: white; 
              padding: 3px 8px; 
              font-weight: bold; 
              font-size: 8px; 
            }
            
            /* Info Grid - Compact */
            .info-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 4px 8px; 
              padding: 6px 8px; 
              border: 1px solid #000; 
              border-top: none; 
            }
            .info-item { }
            .info-label { 
              font-weight: bold; 
              font-size: 7px; 
              color: #333; 
              display: block; 
              margin-bottom: 1px; 
              text-transform: uppercase;
            }
            .info-value { 
              border-bottom: 1px solid #ccc; 
              padding: 3px 4px; 
              min-height: 16px; 
              font-size: 9px;
              background: #fafafa;
            }
            .info-full { grid-column: span 2; }
            
            /* Tables - Compact */
            table { width: 100%; border-collapse: collapse; font-size: 8px; margin-top: 0; }
            th, td { border: 1px solid #000; padding: 2px 4px; text-align: left; }
            th { background: #f3f4f6; font-weight: bold; font-size: 7px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .highlight { background: #fef9c3 !important; }
            .subtotal-row { background: #f3f4f6; font-weight: bold; }
            .total-row { background: #d1d5db; font-weight: bold; }
            .profit-row { background: #bbf7d0 !important; font-weight: bold; }
            
            /* Three Column Layout */
            .three-col { display: flex; gap: 6px; margin-bottom: 6px; }
            .col-invoice { flex: 1.1; }
            .col-trainers { flex: 0.9; }
            .col-costing { flex: 1; }
            
            /* Costing Summary - Compact */
            .costing-table { width: 100%; }
            .costing-table td { padding: 2px 6px; border: 1px solid #000; font-size: 8px; }
            .costing-label { font-weight: bold; width: 60%; }
            .costing-value { text-align: right; width: 25%; }
            .costing-pct { text-align: right; width: 15%; font-size: 8px; }
            
            /* Acknowledgment - Compact */
            .ack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; border: 1px solid #000; border-top: none; padding: 4px; }
            .ack-item { text-align: center; padding: 3px; border: 1px solid #ccc; }
            .ack-label { font-size: 7px; font-weight: bold; margin-bottom: 15px; display: block; }
            .ack-line { border-bottom: 1px solid #000; margin-top: 20px; }
            
            /* Footer */
            .footer { 
              margin-top: 6px; 
              text-align: center; 
              font-size: 7px; 
              color: #666; 
              border-top: 1px solid #ccc; 
              padding-top: 4px; 
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const calculateDays = () => {
    if (!session.start_date || !session.end_date) return 1;
    const start = new Date(session.start_date);
    const end = new Date(session.end_date);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading claim form data...</p>
        </div>
      </div>
    );
  }

  if (!costingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-600">Failed to load data</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  const days = calculateDays();
  const invoiceTotal = costingData.invoice_total || 0;
  const taxAmount = costingData.less_tax || 0;
  const grossRevenue = costingData.gross_revenue || 0;
  const trainerFeesTotal = costingData.trainer_fees_total || 0;
  const coordFeeTotal = costingData.coordinator_fee_total || 0;
  const cashExpenses = costingData.cash_expenses_actual || costingData.cash_expenses_estimated || 0;
  
  // Calculate marketing commission and profit the same way as Profit Summary
  // (based on profit AFTER expenses, not from stored values)
  const profitBeforeMarketing = grossRevenue - trainerFeesTotal - coordFeeTotal - cashExpenses;
  
  let marketingAmount = 0;
  if (costingData.marketing) {
    if (costingData.marketing.commission_type === 'percentage') {
      marketingAmount = profitBeforeMarketing * (costingData.marketing.commission_rate || 0) / 100;
    } else {
      marketingAmount = costingData.marketing.fixed_amount || 0;
    }
  }
  
  const totalExpenses = trainerFeesTotal + coordFeeTotal + cashExpenses + marketingAmount;
  const profit = grossRevenue - totalExpenses;
  const profitPct = grossRevenue > 0 ? (profit / grossRevenue * 100) : 0;
  const marketingName = costingData.marketing?.marketing_user_name || costingData.marketing?.full_name || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Action Bar */}
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Course Registration Form (Claim Form)</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-6 bg-white" style={{ fontSize: '11px' }}>
          {/* Header - Logo + Company Name centered */}
          <div className="header">
            {companySettings?.logo_url && (
              <img src={companySettings.logo_url} alt="Logo" className="logo" />
            )}
            <div className="header-text">
              <div className="company-name">
                {companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}
              </div>
              <div className="form-title">COURSE REGISTRATION FORM</div>
            </div>
          </div>

          {/* Course Particulars - Compact 4-column grid */}
          <div className="section">
            <div className="section-header" style={{ background: '#1e40af', color: 'white', padding: '3px 8px', fontWeight: 'bold', fontSize: '8px' }}>COURSE PARTICULARS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 8px', padding: '6px 8px', border: '1px solid #000', borderTop: 'none', fontSize: '8px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>CLIENT</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{costingData.company_name}</div>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>START</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{formatDate(session.start_date)}</div>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>END</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{formatDate(session.end_date)}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>PROGRAM</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{session.name}</div>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>PARTICIPANTS</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{costingData.pax}</div>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#333', display: 'block', textTransform: 'uppercase' }}>DAYS</span>
                <div style={{ borderBottom: '1px solid #ccc', padding: '2px 4px', fontSize: '9px', background: '#f9fafb' }}>{days}</div>
              </div>
            </div>
          </div>

          {/* Invoicing, Trainers, and Costing Summary - 3 columns */}
          <div className="three-col">
            {/* Invoicing */}
            <div className="col-invoice">
              <div className="section">
                <div className="section-header">INVOICING</div>
                <table style={{ fontSize: '7px' }}>
                  <thead>
                    <tr>
                      <th colSpan="4" style={{ fontSize: '7px', padding: '2px 4px' }}>INV: {costingData.invoice_number || 'N/A'} | {formatShortDate(costingData.invoice_date)}</th>
                    </tr>
                    <tr>
                      <th style={{ width: '8%', padding: '2px' }}>QTY</th>
                      <th style={{ width: '52%', padding: '2px' }}>PARTICULARS</th>
                      <th style={{ width: '20%', padding: '2px' }}>RM/UNIT</th>
                      <th style={{ width: '20%', padding: '2px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center" style={{ padding: '2px' }}>1</td>
                      <td style={{ padding: '2px', fontSize: '7px' }}>{session.name?.substring(0, 35)}{session.name?.length > 35 ? '...' : ''}</td>
                      <td className="text-right" style={{ padding: '2px' }}>{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td className="text-right" style={{ padding: '2px' }}>{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="subtotal-row">
                      <td colSpan="3" className="text-right" style={{ padding: '2px' }}>SUBTOTAL</td>
                      <td className="text-right" style={{ padding: '2px' }}>{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-right" style={{ padding: '2px' }}>6% GST</td>
                      <td className="text-right" style={{ padding: '2px' }}>{taxAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="3" className="text-right" style={{ padding: '2px' }}>TOTAL</td>
                      <td className="text-right" style={{ padding: '2px' }}>{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trainers */}
            <div className="col-trainers">
              <div className="section">
                <div className="section-header">TRAINERS</div>
                <table style={{ fontSize: '7px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '2px' }}>NAME</th>
                      <th style={{ padding: '2px' }}>ROLE</th>
                      <th style={{ padding: '2px' }}>RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(costingData.trainer_fees || []).slice(0, 4).map((fee, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '2px', fontSize: '7px' }}>{fee.trainer_name?.split(' ').slice(0, 2).join(' ')}</td>
                        <td style={{ padding: '2px', textTransform: 'capitalize', fontSize: '7px' }}>{fee.role?.substring(0, 6)}</td>
                        <td className="text-right" style={{ padding: '2px' }}>{(fee.fee_amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {costingData.coordinator_fee && coordFeeTotal > 0 && (
                      <tr>
                        <td style={{ padding: '2px', fontSize: '7px' }}>{costingData.coordinator_fee.coordinator_name?.split(' ').slice(0, 2).join(' ') || 'Coordinator'}</td>
                        <td style={{ padding: '2px', fontSize: '7px' }}>Coord</td>
                        <td className="text-right" style={{ padding: '2px' }}>{coordFeeTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td colSpan="2" className="text-right" style={{ padding: '2px' }}>TOTAL</td>
                      <td className="text-right" style={{ padding: '2px' }}>{(trainerFeesTotal + coordFeeTotal).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Costing Summary */}
            <div className="col-costing">
              <div className="section">
                <div className="section-header">COSTING SUMMARY</div>
                <table className="costing-table" style={{ fontSize: '7px' }}>
                  <tbody>
                    <tr>
                      <td className="costing-label" style={{ padding: '2px 4px' }}>Total Sales</td>
                      <td className="costing-value" style={{ padding: '2px 4px' }}>{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="costing-label" style={{ padding: '2px 4px' }}>Less GST 6%</td>
                      <td className="costing-value" style={{ padding: '2px 4px' }}>{taxAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style={{ background: '#dbeafe' }}>
                      <td className="costing-label" style={{ padding: '2px 4px', fontWeight: 'bold' }}>Gross Revenue</td>
                      <td className="costing-value" style={{ padding: '2px 4px', fontWeight: 'bold' }}>{grossRevenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="costing-label" style={{ padding: '2px 4px' }}>Cash Expenses</td>
                      <td className="costing-value" style={{ padding: '2px 4px' }}>{cashExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="costing-label" style={{ padding: '2px 4px' }}>Trainers Claim</td>
                      <td className="costing-value" style={{ padding: '2px 4px' }}>{(trainerFeesTotal + coordFeeTotal).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="highlight">
                      <td className="costing-label" style={{ padding: '2px 4px' }}>Marketing</td>
                      <td className="costing-value" style={{ padding: '2px 4px' }}>{marketingAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style={{ background: '#fef3c7' }}>
                      <td className="costing-label" style={{ padding: '2px 4px', fontWeight: 'bold' }}>Total Expenses</td>
                      <td className="costing-value" style={{ padding: '2px 4px', fontWeight: 'bold' }}>{totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="profit-row">
                      <td className="costing-label" style={{ padding: '2px 4px', fontWeight: 'bold' }}>NET PROFIT</td>
                      <td className="costing-value" style={{ padding: '2px 4px', fontWeight: 'bold' }}>{profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })} ({profitPct.toFixed(1)}%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Expenses - Compact */}
          <div className="section">
            <div className="section-header">EXPENSES</div>
            <table style={{ fontSize: '7px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%', padding: '2px 4px' }}>DESCRIPTION</th>
                  <th style={{ width: '12%', padding: '2px 4px' }}>RATE</th>
                  <th style={{ width: '12%', padding: '2px 4px' }}>BASE</th>
                  <th style={{ width: '16%', padding: '2px 4px' }}>TOTAL (RM)</th>
                  <th style={{ width: '20%', padding: '2px 4px' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {(costingData.expenses || []).map((expense, idx) => {
                  const amount = expense.actual_amount || expense.estimated_amount || 0;
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '2px 4px' }}>{expense.description || expense.category}</td>
                      <td className="text-center" style={{ padding: '2px 4px' }}>
                        {expense.expense_type === 'percentage' 
                          ? `${((amount / invoiceTotal) * 100).toFixed(0)}%`
                          : expense.expense_type === 'per_pax'
                          ? `RM${(amount / (costingData.total_headcount || 1)).toFixed(0)}/pax`
                          : 'Fixed'
                        }
                      </td>
                      <td className="text-center" style={{ padding: '2px 4px' }}>
                        {expense.expense_type === 'percentage' 
                          ? invoiceTotal.toLocaleString()
                          : expense.expense_type === 'per_pax'
                          ? costingData.total_headcount
                          : '-'
                        }
                      </td>
                      <td className="text-right" style={{ padding: '2px 4px' }}>{amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '2px 4px', fontSize: '6px' }}>{expense.remark || ''}</td>
                    </tr>
                  );
                })}
                {(costingData.expenses?.length || 0) === 0 && (
                  <tr><td colSpan="5" className="text-center" style={{ padding: '8px', color: '#666' }}>No expenses recorded</td></tr>
                )}
                <tr className="total-row">
                  <td colSpan="3" className="text-right" style={{ padding: '2px 4px' }}>TOTAL EXPENSES</td>
                  <td className="text-right" style={{ padding: '2px 4px' }}>{cashExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Acknowledgment - Compact horizontal */}
          <div className="section">
            <div className="section-header">ACKNOWLEDGMENT</div>
            <div className="ack-grid">
              <div className="ack-item">
                <span className="ack-label">Training Coordinator</span>
                <div className="ack-line"></div>
                <div style={{ fontSize: '6px', marginTop: '2px' }}>Sign / Date</div>
              </div>
              <div className="ack-item">
                <span className="ack-label">Manager In Charge</span>
                <div className="ack-line"></div>
                <div style={{ fontSize: '6px', marginTop: '2px' }}>Sign / Date</div>
              </div>
              <div className="ack-item">
                <span className="ack-label">Director</span>
                <div className="ack-line"></div>
                <div style={{ fontSize: '6px', marginTop: '2px' }}>Sign / Date</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            {companySettings?.document_styling?.footer_tagline || 'Generated by Training Management System'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimFormPrint;
