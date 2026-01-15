import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, X, Download } from 'lucide-react';

const PayAdvicePrint = ({ payAdvice, companySettings, onClose }) => {
  const printRef = useRef(null);
  
  // Get colors from company settings or use defaults
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoUrl = companySettings?.logo_url || '';
  
  // Get the display period - use period_name if available, or construct from month/year
  const getDisplayPeriod = () => {
    if (payAdvice?.period_name) return payAdvice.period_name.toUpperCase();
    if (payAdvice?.month && payAdvice?.year) {
      const monthName = new Date(2000, payAdvice.month - 1).toLocaleString('default', { month: 'long' });
      return `${monthName.toUpperCase()} ${payAdvice.year}`;
    }
    return 'N/A';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    const displayPeriod = getDisplayPeriod();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pay Advice - ${payAdvice?.full_name || 'Staff'} - ${payAdvice?.period_name || displayPeriod}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            
            .header { text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 20px; }
            .header-logo { max-height: 60px; max-width: 200px; margin-bottom: 10px; }
            .header h1 { font-size: 16px; color: ${primaryColor}; margin-bottom: 5px; }
            .header h2 { font-size: 14px; font-weight: normal; }
            
            .recipient-info { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-row { display: flex; gap: 10px; }
            .info-label { font-weight: bold; min-width: 100px; color: #666; }
            
            .session-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .session-table th, .session-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .session-table th { background: ${primaryColor}; color: white; }
            .session-table tr:nth-child(even) { background: #f9fafb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary { background: ${secondaryColor}; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .summary .label { font-size: 12px; margin-bottom: 5px; }
            .summary .amount { font-size: 28px; font-weight: bold; }
            
            .bank-info { margin-top: 20px; padding: 15px; background: ${primaryColor}10; border-radius: 8px; border-left: 4px solid ${primaryColor}; }
            .bank-info h3 { color: ${primaryColor}; margin-bottom: 10px; }
            
            .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #666; }
            .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-box { text-align: center; }
            .signature-line { border-bottom: 1px solid #000; height: 50px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const getMonthName = (month) => {
    if (!month || isNaN(month)) return '';
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };
  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Pay Advice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} style={{ backgroundColor: secondaryColor }} className="hover:opacity-90">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div ref={printRef} className="p-6">
          {/* Header with Logo */}
          <div className="header" style={{ borderBottom: `2px solid ${primaryColor}` }}>
            {logoUrl && (
              <img src={logoUrl} alt="Company Logo" className="header-logo" style={{ maxHeight: '60px', maxWidth: '200px', marginBottom: '10px' }} />
            )}
            <h1 style={{ color: primaryColor }}>{companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}</h1>
            <h2>PAY ADVICE - {getDisplayPeriod()}</h2>
          </div>

          {/* Recipient Info */}
          <div className="recipient-info">
            <div className="info-grid">
              <div>
                <div className="info-row"><span className="info-label">Name:</span><span>{payAdvice.full_name}</span></div>
                <div className="info-row"><span className="info-label">NRIC:</span><span>{payAdvice.id_number || '-'}</span></div>
                {payAdvice.training_period_name && (
                  <div className="info-row"><span className="info-label">Training Period:</span><span>{payAdvice.training_period_name}</span></div>
                )}
              </div>
              <div>
                <div className="info-row"><span className="info-label">Phone:</span><span>{payAdvice.phone || '-'}</span></div>
                <div className="info-row"><span className="info-label">Email:</span><span>{payAdvice.email || '-'}</span></div>
                <div className="info-row"><span className="info-label">Payment Period:</span><span>{payAdvice.period_name || getDisplayPeriod()}</span></div>
              </div>
            </div>
          </div>

          {/* Session Details Table */}
          <table className="session-table">
            <thead>
              <tr style={{ background: primaryColor }}>
                <th style={{ background: primaryColor }}>No</th>
                <th style={{ background: primaryColor }}>Company</th>
                <th style={{ background: primaryColor }}>Training Session</th>
                <th style={{ background: primaryColor }}>Date</th>
                <th style={{ background: primaryColor }}>Role</th>
                <th className="text-right" style={{ background: primaryColor }}>Amount (RM)</th>
              </tr>
            </thead>
            <tbody>
              {payAdvice.session_details?.map((session, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td>{session.company_name}</td>
                  <td>{session.session_name}</td>
                  <td>{session.session_date || '-'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{session.role}</td>
                  <td className="text-right">{(session.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {(!payAdvice.session_details || payAdvice.session_details.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: '20px', color: '#666' }}>
                    No session records found for this period
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e5e7eb', fontWeight: 'bold' }}>
                <td colSpan="5" className="text-right">GROSS TOTAL</td>
                <td className="text-right">{formatCurrency(payAdvice.gross_amount)}</td>
              </tr>
              {payAdvice.deductions > 0 && (
                <tr>
                  <td colSpan="5" className="text-right">Less: Deductions</td>
                  <td className="text-right">({formatCurrency(payAdvice.deductions)})</td>
                </tr>
              )}
            </tfoot>
          </table>

          {/* Nett Amount */}
          <div className="summary" style={{ background: secondaryColor }}>
            <div className="label">NETT PAYMENT</div>
            <div className="amount">{formatCurrency(payAdvice.nett_amount)}</div>
          </div>

          {/* Bank Info */}
          {(payAdvice.bank_name || payAdvice.bank_account) && (
            <div className="bank-info" style={{ background: `${primaryColor}10`, borderLeft: `4px solid ${primaryColor}` }}>
              <h3 style={{ color: primaryColor }}>Payment Details</h3>
              <div className="info-grid">
                <div className="info-row"><span className="info-label">Bank:</span><span>{payAdvice.bank_name || '-'}</span></div>
                <div className="info-row"><span className="info-label">Account:</span><span>{payAdvice.bank_account || '-'}</span></div>
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div>Prepared By</div>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div>Received By</div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            This document is computer-generated. For enquiries, please contact HR department.
            {/* Custom Fields */}
            {(companySettings?.payadvice_custom_fields || []).length > 0 && (
              <div style={{ marginTop: '10px', textAlign: 'left' }}>
                {(companySettings?.payadvice_custom_fields || []).map((field, idx) => (
                  <span key={idx} style={{ marginRight: '15px' }}>
                    <strong>{field.label}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAdvicePrint;
