import React, { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '../App';
import { Button } from './ui/button';
import { Printer, X, Loader2 } from 'lucide-react';
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
          invoice_date: sessionInvoice.created_at
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
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Course Registration Form - ${session.name}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; padding: 10px; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .header-left { display: flex; align-items: center; gap: 10px; }
            .logo { max-width: 80px; max-height: 50px; object-fit: contain; }
            .company-name { font-size: 12px; font-weight: bold; }
            .company-tagline { font-size: 8px; color: #666; }
            .form-title { text-align: center; flex: 1; }
            .form-title h1 { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
            .form-title h2 { font-size: 11px; background: #ddd; padding: 3px 8px; display: inline-block; }
            
            .section { margin-bottom: 8px; }
            .section-header { background: #f0f0f0; padding: 4px 8px; font-weight: bold; font-size: 10px; border: 1px solid #000; border-bottom: none; }
            
            .info-row { display: flex; gap: 15px; margin-bottom: 6px; flex-wrap: wrap; }
            .info-item { display: flex; align-items: center; gap: 5px; }
            .info-label { font-weight: bold; font-size: 9px; }
            .info-value { border-bottom: 1px solid #000; min-width: 120px; padding: 2px 5px; font-size: 9px; }
            .info-value-wide { min-width: 250px; }
            
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th, td { border: 1px solid #000; padding: 3px 5px; text-align: left; }
            th { background: #e8e8e8; font-weight: bold; font-size: 8px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .highlight { background: #fffacd !important; }
            .subtotal-row { background: #f5f5f5; font-weight: bold; }
            .total-row { background: #ddd; font-weight: bold; }
            .profit-row { background: #c8e6c9 !important; font-weight: bold; font-size: 11px; }
            
            .two-col-layout { display: flex; gap: 10px; }
            .col-left { flex: 3; }
            .col-right { flex: 2; }
            
            .trainer-table th, .trainer-table td { padding: 2px 4px; }
            .expense-table { font-size: 8px; }
            .expense-table th, .expense-table td { padding: 2px 3px; }
            
            .costing-section { margin-top: 10px; }
            .costing-table { width: 100%; }
            .costing-table td { padding: 3px 8px; }
            .costing-label { font-weight: bold; width: 60%; }
            .costing-value { text-align: right; width: 25%; }
            .costing-pct { text-align: right; width: 15%; background: #fffacd; }
            
            .acknowledgment { margin-top: 15px; }
            .acknowledgment table { width: 100%; }
            .acknowledgment td { padding: 8px; border: 1px solid #000; }
            .sign-box { height: 40px; }
            
            .footer { margin-top: 10px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ccc; padding-top: 5px; }
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
  const marketingAmount = costingData.marketing_commission || 0;
  const totalExpenses = costingData.total_expenses || 0;
  const profit = costingData.profit || 0;
  const profitPct = costingData.profit_percentage || 0;

  // Get marketing person name
  const marketingName = costingData.marketing?.marketing_user_name || costingData.marketing?.full_name || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Action Bar */}
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Course Registration Form (Claim Form)</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-6 bg-white" style={{ fontSize: '11px' }}>
          {/* Header */}
          <div className="header">
            <div className="header-left">
              {companySettings?.logo_url && (
                <img src={companySettings.logo_url} alt="Logo" className="logo" />
              )}
              <div>
                <div className="company-name">{companySettings?.company_name || 'MDDRC'}</div>
                <div className="company-tagline">{companySettings?.tagline || 'Malaysian Defensive Driving and Riding Centre'}</div>
              </div>
            </div>
            <div className="form-title">
              <h1>{companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE (SEL) SDN BHD'}</h1>
              <h2>COURSE REGISTRATION FORM</h2>
            </div>
            <div style={{ width: '80px' }}></div>
          </div>

          {/* Course Particulars */}
          <div className="section">
            <div className="section-header">COURSE PARTICULARS</div>
            <div style={{ border: '1px solid #000', padding: '8px' }}>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">CLIENT:</span>
                  <span className="info-value info-value-wide">{costingData.company_name}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">TRAINING INITIAL:</span>
                  <span className="info-value">{formatDate(session.start_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">TRAINING END:</span>
                  <span className="info-value">{formatDate(session.end_date)}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">TOTAL PARTICIPANTS:</span>
                  <span className="info-value">{costingData.pax}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">No of Days:</span>
                  <span className="info-value">{days}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">PROGRAM:</span>
                  <span className="info-value">{session.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoicing and Trainers Side by Side */}
          <div className="two-col-layout">
            {/* Invoicing */}
            <div className="col-left">
              <div className="section">
                <div className="section-header">INVOICING</div>
                <table>
                  <thead>
                    <tr>
                      <th colSpan="2" style={{ textAlign: 'left' }}>
                        INVOICE NO: {costingData.invoice_number || 'N/A'}
                      </th>
                      <th colSpan="2" style={{ textAlign: 'right' }}>
                        DATE: {formatShortDate(costingData.invoice_date)}
                      </th>
                    </tr>
                    <tr>
                      <th style={{ width: '10%' }}>QTY</th>
                      <th style={{ width: '50%' }}>PARTICULARS</th>
                      <th style={{ width: '20%' }}>RM/UNIT</th>
                      <th style={{ width: '20%' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center">1</td>
                      <td>{session.name} - Training Course</td>
                      <td className="text-right">{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr><td colSpan="4" style={{ height: '20px' }}></td></tr>
                    <tr className="subtotal-row">
                      <td colSpan="3" className="text-right">SUBTOTAL</td>
                      <td className="text-right">{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-right">6% GST (if applicable)</td>
                      <td className="text-right">{taxAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="3" className="text-right">TOTAL</td>
                      <td className="text-right">{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trainers */}
            <div className="col-right">
              <div className="section">
                <div className="section-header">TRAINERS</div>
                <table className="trainer-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>POSITION</th>
                      <th>CLAIM</th>
                      <th>REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(costingData.trainer_fees || []).map((fee, idx) => (
                      <tr key={idx}>
                        <td>{fee.trainer_name}</td>
                        <td style={{ textTransform: 'uppercase' }}>{fee.role}</td>
                        <td className="text-right">{(fee.fee_amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                        <td>{fee.remark || ''}</td>
                      </tr>
                    ))}
                    {/* Coordinator row if exists */}
                    {costingData.coordinator_fee && coordFeeTotal > 0 && (
                      <tr>
                        <td>{costingData.coordinator_fee.coordinator_name || 'Coordinator'}</td>
                        <td>COORDINATOR</td>
                        <td className="text-right">{coordFeeTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                        <td>{costingData.coordinator_fee.num_days} day(s)</td>
                      </tr>
                    )}
                    {/* Empty rows for manual entry */}
                    <tr><td colSpan="4" style={{ height: '18px' }}></td></tr>
                    <tr className="subtotal-row">
                      <td colSpan="2" className="text-right">SUBTOTAL</td>
                      <td className="text-right">{(trainerFeesTotal + coordFeeTotal).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="2" className="text-right">TOTAL</td>
                      <td className="text-right">{(trainerFeesTotal + coordFeeTotal).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="section">
            <div className="section-header">EXPENSES</div>
            <table className="expense-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>DESCRIPTION</th>
                  <th style={{ width: '15%' }}>UNIT PRICE</th>
                  <th style={{ width: '10%' }}>QTY</th>
                  <th style={{ width: '15%' }}>TOTAL</th>
                  <th style={{ width: '35%' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {(costingData.expenses || []).map((expense, idx) => {
                  const amount = expense.actual_amount || expense.estimated_amount || 0;
                  return (
                    <tr key={idx}>
                      <td>{expense.description || expense.category}</td>
                      <td className="text-right">
                        {expense.expense_type === 'percentage' 
                          ? `${expense.estimated_amount ? ((expense.estimated_amount / invoiceTotal) * 100).toFixed(0) : 0}%`
                          : expense.expense_type === 'per_pax'
                          ? `RM ${(amount / (costingData.total_headcount || 1)).toFixed(0)}/pax`
                          : '-'
                        }
                      </td>
                      <td className="text-center">
                        {expense.expense_type === 'percentage' 
                          ? invoiceTotal.toLocaleString()
                          : expense.expense_type === 'per_pax'
                          ? costingData.total_headcount
                          : '-'
                        }
                      </td>
                      <td className="text-right">{amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                      <td>{expense.remark || ''}</td>
                    </tr>
                  );
                })}
                {/* Empty rows if less than 6 expenses */}
                {Array.from({ length: Math.max(0, 6 - (costingData.expenses?.length || 0)) }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td style={{ height: '18px' }}></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td colSpan="3" className="text-right">SUBTOTAL</td>
                  <td className="text-right">{cashExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
                <tr className="total-row">
                  <td colSpan="3" className="text-right">TOTAL</td>
                  <td className="text-right">{cashExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Costing Summary */}
          <div className="costing-section">
            <div className="section-header">COSTING</div>
            <table className="costing-table" style={{ border: '1px solid #000' }}>
              <tbody>
                <tr>
                  <td className="costing-label">TOTAL SALES</td>
                  <td className="costing-value">{invoiceTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr>
                  <td className="costing-label">LESS GST 6%</td>
                  <td className="costing-value">{taxAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr style={{ background: '#e3f2fd' }}>
                  <td className="costing-label">GROSS</td>
                  <td className="costing-value" style={{ fontWeight: 'bold' }}>{grossRevenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr>
                  <td className="costing-label">CASH EXPENSES</td>
                  <td className="costing-value">{cashExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr>
                  <td className="costing-label">TRAINERS CLAIM</td>
                  <td className="costing-value">{(trainerFeesTotal + coordFeeTotal).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr>
                  <td className="costing-label highlight">MARKETING ({marketingName})</td>
                  <td className="costing-value">{marketingAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr>
                  <td className="costing-label">OTHER EXPENSES</td>
                  <td className="costing-value">0.00</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr style={{ background: '#ffecb3' }}>
                  <td className="costing-label">TOTAL EXPENSES</td>
                  <td className="costing-value" style={{ fontWeight: 'bold' }}>{totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct"></td>
                </tr>
                <tr className="profit-row">
                  <td className="costing-label">PROFIT</td>
                  <td className="costing-value" style={{ fontSize: '12px' }}>{profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  <td className="costing-pct highlight" style={{ fontSize: '12px', fontWeight: 'bold' }}>{profitPct.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Acknowledgment */}
          <div className="acknowledgment">
            <div className="section-header">ACKNOWLEDGMENT</div>
            <table>
              <tbody>
                <tr>
                  <td style={{ width: '25%' }}><strong>Training Coordinator:</strong></td>
                  <td style={{ width: '25%' }}></td>
                  <td className="sign-box" style={{ width: '25%' }}><strong>Sign:</strong></td>
                  <td style={{ width: '25%' }}><strong>Date:</strong></td>
                </tr>
                <tr>
                  <td><strong>Manager In Charge:</strong></td>
                  <td></td>
                  <td className="sign-box"><strong>Sign:</strong></td>
                  <td><strong>Date:</strong></td>
                </tr>
                <tr>
                  <td><strong>Director:</strong></td>
                  <td></td>
                  <td className="sign-box"><strong>Sign:</strong></td>
                  <td><strong>Date:</strong></td>
                </tr>
              </tbody>
            </table>
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
