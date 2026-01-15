import React, { useRef } from 'react';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

const PayAdvicePrint = ({ payAdvice, companySettings, onClose }) => {
  const printRef = useRef(null);
  
  // Get colors from company settings or use defaults
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoUrl = companySettings?.logo_url || '';
  const logoWidth = companySettings?.logo_width || 150;
  const showWatermark = companySettings?.show_watermark !== false;
  const watermarkOpacity = companySettings?.watermark_opacity || 0.08;
  
  // Build full logo URL
  const fullLogoUrl = logoUrl ? `${process.env.REACT_APP_BACKEND_URL || ''}${logoUrl}` : '';
  
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
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; position: relative; }
            
            /* Watermark */
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: ${watermarkOpacity};
              z-index: -1;
              pointer-events: none;
            }
            .watermark img {
              width: 400px;
              height: auto;
            }
            
            .header { 
              text-align: center; 
              border-bottom: 3px solid ${primaryColor}; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
            }
            .header-logo { 
              width: ${Math.max(logoWidth, 180)}px; 
              max-width: 250px;
              height: auto; 
              margin-bottom: 10px; 
            }
            .header h1 { font-size: 18px; color: ${primaryColor}; margin-bottom: 5px; }
            .header h2 { font-size: 16px; font-weight: bold; color: ${secondaryColor}; background: #f0f4f8; padding: 8px; margin-top: 10px; }
            
            .recipient-info { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; border-left: 4px solid ${primaryColor}; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-row { display: flex; gap: 10px; margin-bottom: 5px; }
            .info-label { font-weight: bold; min-width: 120px; color: #666; }
            
            .session-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .session-table th, .session-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .session-table th { background: ${primaryColor}; color: white; font-size: 11px; }
            .session-table tr:nth-child(even) { background: #f9fafb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary { background: ${secondaryColor}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .summary .label { font-size: 14px; margin-bottom: 5px; }
            .summary .amount { font-size: 32px; font-weight: bold; }
            
            .bank-info { margin-top: 20px; padding: 15px; background: ${primaryColor}10; border-radius: 8px; border-left: 4px solid ${primaryColor}; }
            .bank-info h3 { color: ${primaryColor}; margin-bottom: 10px; font-size: 12px; }
            
            .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #666; }
            .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-box { text-align: center; }
            .signature-line { border-bottom: 1px solid #000; height: 50px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          ${showWatermark && fullLogoUrl ? `<div class="watermark"><img src="${fullLogoUrl}" alt="Watermark" /></div>` : ''}
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

        <div ref={printRef} className="p-6 relative">
          {/* Watermark for preview */}
          {showWatermark && fullLogoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: watermarkOpacity, zIndex: 0 }}>
              <img src={fullLogoUrl} alt="" className="w-96 h-auto" />
            </div>
          )}
          
          <div className="relative" style={{ zIndex: 1 }}>
            {/* Header with Logo */}
            <div className="header text-center pb-4 mb-5" style={{ borderBottom: `3px solid ${primaryColor}` }}>
              {fullLogoUrl && (
                <img src={fullLogoUrl} alt="Company Logo" className="header-logo mx-auto" style={{ width: `${Math.max(logoWidth, 180)}px`, maxWidth: '250px', height: 'auto', marginBottom: '10px' }} />
              )}
              <h1 style={{ color: primaryColor, fontSize: '18px', fontWeight: 'bold' }}>{companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}</h1>
              <h2 className="mt-2 py-2 px-4 rounded" style={{ background: '#f0f4f8', color: secondaryColor, fontSize: '16px', fontWeight: 'bold' }}>
                PAY ADVICE - {getDisplayPeriod()}
              </h2>
            </div>

            {/* Recipient Info */}
            <div className="recipient-info p-4 rounded-lg mb-5" style={{ background: '#f3f4f6', borderLeft: `4px solid ${primaryColor}` }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">Name:</span><span>{payAdvice.full_name}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">NRIC:</span><span>{payAdvice.id_number || '-'}</span></div>
                  {payAdvice.training_period_name && (
                    <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">Training Period:</span><span>{payAdvice.training_period_name}</span></div>
                  )}
                </div>
                <div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">Phone:</span><span>{payAdvice.phone || '-'}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">Email:</span><span>{payAdvice.email || '-'}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-28">Payment Period:</span><span>{payAdvice.period_name || getDisplayPeriod()}</span></div>
                </div>
              </div>
            </div>

            {/* Session Details Table */}
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr style={{ background: primaryColor, color: 'white' }}>
                  <th className="border p-2 text-center" style={{ background: primaryColor }}>No</th>
                  <th className="border p-2" style={{ background: primaryColor }}>Company</th>
                  <th className="border p-2" style={{ background: primaryColor }}>Training Session</th>
                  <th className="border p-2" style={{ background: primaryColor }}>Date</th>
                  <th className="border p-2" style={{ background: primaryColor }}>Role</th>
                  <th className="border p-2 text-right" style={{ background: primaryColor }}>Amount (RM)</th>
                </tr>
              </thead>
              <tbody>
                {payAdvice.session_details?.map((session, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">{session.company_name}</td>
                    <td className="border p-2">{session.session_name}</td>
                    <td className="border p-2">{session.session_date || '-'}</td>
                    <td className="border p-2 capitalize">{session.role}</td>
                    <td className="border p-2 text-right">{(session.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {(!payAdvice.session_details || payAdvice.session_details.length === 0) && (
                  <tr>
                    <td colSpan="6" className="border p-5 text-center text-gray-500">
                      No session records found for this period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td colSpan="5" className="border p-2 text-right">GROSS TOTAL</td>
                  <td className="border p-2 text-right">{formatCurrency(payAdvice.gross_amount)}</td>
                </tr>
                {payAdvice.deductions > 0 && (
                  <tr>
                    <td colSpan="5" className="border p-2 text-right">Less: Deductions</td>
                    <td className="border p-2 text-right">({formatCurrency(payAdvice.deductions)})</td>
                  </tr>
                )}
              </tfoot>
            </table>

            {/* Nett Amount */}
            <div className="text-center py-5 px-4 rounded-lg my-5" style={{ background: secondaryColor, color: 'white' }}>
              <div className="text-sm mb-1">NETT PAYMENT</div>
              <div className="text-3xl font-bold">{formatCurrency(payAdvice.nett_amount)}</div>
            </div>

            {/* Bank Info */}
            {(payAdvice.bank_name || payAdvice.bank_account) && (
              <div className="p-4 rounded-lg" style={{ background: `${primaryColor}10`, borderLeft: `4px solid ${primaryColor}` }}>
                <h3 className="font-bold mb-2" style={{ color: primaryColor }}>Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-gray-600">Bank:</span> {payAdvice.bank_name || '-'}</div>
                  <div><span className="font-bold text-gray-600">Account:</span> {payAdvice.bank_account || '-'}</div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-12 mt-10">
              <div className="text-center">
                <div className="border-b border-black h-12 mb-1"></div>
                <div className="text-sm">Prepared By</div>
              </div>
              <div className="text-center">
                <div className="border-b border-black h-12 mb-1"></div>
                <div className="text-sm">Received By</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              This document is computer-generated. For enquiries, please contact HR department.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAdvicePrint;
