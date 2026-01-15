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
  
  // Get the display period
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
          <title>Pay Advice - ${payAdvice?.full_name || 'Staff'} - ${displayPeriod}</title>
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
            .watermark img { width: 400px; height: auto; }
            
            /* Header - Invoice Style */
            .header {
              display: flex;
              align-items: flex-start;
              gap: 15px;
              padding-bottom: 15px;
              border-bottom: 3px solid ${primaryColor};
              margin-bottom: 15px;
            }
            .logo-img { width: ${Math.max(logoWidth, 100)}px; max-width: 120px; height: auto; flex-shrink: 0; }
            .company-details { flex: 1; }
            .company-name { font-size: 16px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
            .company-info { font-size: 10px; color: #444; line-height: 1.5; }
            
            .document-title { 
              font-size: 18px; 
              font-weight: bold; 
              text-align: center; 
              color: ${primaryColor}; 
              margin: 15px 0;
              padding: 8px;
              background: #f0f4f8;
              border-left: 4px solid ${secondaryColor};
            }
            
            .recipient-info { 
              margin-bottom: 15px; 
              padding: 12px; 
              background: #f9fafb; 
              border-radius: 4px; 
              border: 1px solid #e5e7eb;
            }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .info-row { display: flex; gap: 8px; font-size: 11px; }
            .info-label { font-weight: bold; min-width: 100px; color: #666; }
            
            .session-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
            .session-table th, .session-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .session-table th { background: ${primaryColor}; color: white; }
            .session-table tr:nth-child(even) { background: #f9fafb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary { 
              background: ${secondaryColor}; 
              color: white; 
              padding: 15px; 
              text-align: center; 
              border-radius: 4px; 
              margin: 15px 0; 
            }
            .summary .label { font-size: 12px; margin-bottom: 3px; }
            .summary .amount { font-size: 26px; font-weight: bold; }
            
            .bank-info { 
              padding: 12px; 
              background: #f0f4f8; 
              border-radius: 4px; 
              border-left: 3px solid ${primaryColor}; 
              margin-bottom: 15px;
            }
            .bank-info h3 { color: ${primaryColor}; margin-bottom: 8px; font-size: 11px; }
            
            .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #666; }
            .signature-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .signature-box { text-align: center; }
            .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; }
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

  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  // Build company info string like invoice
  const companyInfoParts = [];
  if (companySettings?.company_reg_no) companyInfoParts.push(`(${companySettings.company_reg_no})`);
  if (companySettings?.address_line1) companyInfoParts.push(companySettings.address_line1);
  if (companySettings?.address_line2) companyInfoParts.push(companySettings.address_line2);
  
  const addressParts = [];
  if (companySettings?.city) addressParts.push(companySettings.city);
  if (companySettings?.postcode) addressParts.push(companySettings.postcode);
  if (companySettings?.state) addressParts.push(companySettings.state);
  
  const contactParts = [];
  if (companySettings?.phone) contactParts.push(`Tel: ${companySettings.phone}`);
  if (companySettings?.email) contactParts.push(companySettings.email);

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
            {/* Header - Invoice Style */}
            <div className="header flex items-start gap-4 pb-4 mb-4" style={{ borderBottom: `3px solid ${primaryColor}` }}>
              {fullLogoUrl && (
                <img src={fullLogoUrl} alt="Logo" className="logo-img" style={{ width: `${Math.max(logoWidth, 100)}px`, maxWidth: '120px', height: 'auto', flexShrink: 0 }} />
              )}
              <div className="company-details flex-1">
                <div className="company-name text-base font-bold mb-1" style={{ color: primaryColor }}>
                  {companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}
                </div>
                <div className="company-info text-xs text-gray-600 leading-relaxed">
                  {companyInfoParts.length > 0 && <span>{companyInfoParts.join(' • ')}</span>}
                  {addressParts.length > 0 && <><br />{addressParts.join(', ')}</>}
                  {contactParts.length > 0 && <><br />{contactParts.join(' • ')}</>}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 px-4 mb-4 rounded" style={{ background: '#f0f4f8', borderLeft: `4px solid ${secondaryColor}` }}>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>PAY ADVICE</span>
            </div>

            {/* Recipient Info */}
            <div className="p-3 rounded mb-4" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">Name:</span><span>{payAdvice.full_name}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">NRIC:</span><span>{payAdvice.id_number || '-'}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">Phone:</span><span>{payAdvice.phone || '-'}</span></div>
                </div>
                <div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">Period:</span><span className="font-semibold">{payAdvice.period_name || getDisplayPeriod()}</span></div>
                  <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">Email:</span><span>{payAdvice.email || '-'}</span></div>
                  {payAdvice.training_period_name && (
                    <div className="flex gap-2 mb-1"><span className="font-bold text-gray-600 w-24">Training:</span><span>{payAdvice.training_period_name}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Details Table */}
            <table className="w-full border-collapse mb-4 text-xs">
              <thead>
                <tr style={{ background: primaryColor, color: 'white' }}>
                  <th className="border p-2 text-center w-10">No</th>
                  <th className="border p-2">Company</th>
                  <th className="border p-2">Training Session</th>
                  <th className="border p-2 w-24">Date</th>
                  <th className="border p-2 w-20">Role</th>
                  <th className="border p-2 text-right w-24">Amount (RM)</th>
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
                  <tr><td colSpan="6" className="border p-4 text-center text-gray-500">No session records found</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
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
            <div className="text-center py-4 px-4 rounded my-4" style={{ background: secondaryColor, color: 'white' }}>
              <div className="text-sm mb-1">NETT PAYMENT</div>
              <div className="text-2xl font-bold">{formatCurrency(payAdvice.nett_amount)}</div>
            </div>

            {/* Bank Info */}
            {(payAdvice.bank_name || payAdvice.bank_account) && (
              <div className="p-3 rounded mb-4" style={{ background: '#f0f4f8', borderLeft: `3px solid ${primaryColor}` }}>
                <h3 className="font-bold mb-2 text-xs" style={{ color: primaryColor }}>Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="font-bold text-gray-600">Bank:</span> {payAdvice.bank_name || '-'}</div>
                  <div><span className="font-bold text-gray-600">Account:</span> {payAdvice.bank_account || '-'}</div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-10 mt-8">
              <div className="text-center">
                <div className="border-b border-black h-10 mb-1"></div>
                <div className="text-xs">Prepared By</div>
              </div>
              <div className="text-center">
                <div className="border-b border-black h-10 mb-1"></div>
                <div className="text-xs">Received By</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              This document is computer-generated. For enquiries, please contact HR department.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAdvicePrint;
