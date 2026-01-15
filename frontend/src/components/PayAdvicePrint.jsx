import React, { useRef } from 'react';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

const PayAdvicePrint = ({ payAdvice, companySettings, onClose }) => {
  const printRef = useRef(null);
  
  // Get colors from company settings or use defaults
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoUrl = companySettings?.logo_url || '';
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

  // Build company info
  const getCompanyInfo = () => {
    const parts = [];
    if (companySettings?.company_reg_no) parts.push(`(${companySettings.company_reg_no})`);
    if (companySettings?.address_line1) parts.push(companySettings.address_line1);
    if (companySettings?.address_line2) parts.push(companySettings.address_line2);
    if (companySettings?.city) parts.push(companySettings.city);
    if (companySettings?.postcode) parts.push(companySettings.postcode);
    if (companySettings?.state) parts.push(companySettings.state);
    return parts.join(' • ');
  };
  
  const getContactInfo = () => {
    const parts = [];
    if (companySettings?.phone) parts.push(`Tel: ${companySettings.phone}`);
    if (companySettings?.email) parts.push(companySettings.email);
    return parts.join(' • ');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pay Advice - ${payAdvice?.full_name || 'Staff'} - ${getDisplayPeriod()}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 9px; line-height: 1.3; }
            
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: ${watermarkOpacity}; z-index: 0; pointer-events: none; }
            .watermark img { width: 280px; height: auto; }
            .container { position: relative; z-index: 1; }
            
            .container { padding: 8px; }
            .header { display: flex; align-items: flex-start; gap: 10px; padding-bottom: 8px; border-bottom: 2px solid ${primaryColor}; margin-bottom: 8px; }
            .logo-img { width: 80px; height: auto; }
            .company-name { font-size: 12px; font-weight: bold; color: ${primaryColor}; margin-bottom: 2px; }
            .company-info { font-size: 8px; color: #444; line-height: 1.4; }
            
            .doc-title { text-align: center; font-size: 12px; font-weight: bold; color: ${primaryColor}; background: #f0f4f8; padding: 5px; margin-bottom: 8px; border-left: 3px solid ${secondaryColor}; }
            
            .info-box { background: #f9fafb; padding: 8px; margin-bottom: 8px; border: 1px solid #e5e7eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
            .info-row { display: flex; font-size: 9px; }
            .info-label { font-weight: bold; width: 70px; color: #666; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background: ${primaryColor}; color: white; font-size: 8px; }
            tr:nth-child(even) { background: #f9fafb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary { background: ${secondaryColor}; color: white; padding: 10px; text-align: center; margin: 8px 0; }
            .summary .label { font-size: 10px; }
            .summary .amount { font-size: 20px; font-weight: bold; }
            
            .bank-box { background: #f0f4f8; padding: 6px; border-left: 2px solid ${primaryColor}; margin-bottom: 8px; font-size: 8px; }
            .bank-title { font-weight: bold; color: ${primaryColor}; margin-bottom: 4px; }
            
            .sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 15px; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 3px; }
            .sig-label { font-size: 8px; }
            
            .footer { text-align: center; font-size: 7px; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          ${showWatermark && fullLogoUrl ? `<div class="watermark"><img src="${fullLogoUrl}" alt="" /></div>` : ''}
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-2 flex justify-between items-center z-10">
          <h2 className="text-base font-bold">Pay Advice Preview</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} style={{ backgroundColor: secondaryColor }}>
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div ref={printRef} className="p-3 relative text-xs" style={{ minHeight: '500px' }}>
          {/* Single centered watermark for preview */}
          {showWatermark && fullLogoUrl && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: watermarkOpacity, zIndex: 0, pointerEvents: 'none' }}>
              <img src={fullLogoUrl} alt="" style={{ width: '250px', height: 'auto' }} />
            </div>
          )}
          <div className="container relative" style={{ zIndex: 1 }}>
            {/* Compact Header */}
            <div className="header flex items-start gap-3 pb-2 mb-2" style={{ borderBottom: `2px solid ${primaryColor}` }}>
              {fullLogoUrl && (
                <img src={fullLogoUrl} alt="Logo" className="logo-img" style={{ width: '70px', height: 'auto' }} />
              )}
              <div className="flex-1">
                <div className="company-name" style={{ fontSize: '11px', fontWeight: 'bold', color: primaryColor }}>
                  {companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}
                </div>
                <div className="company-info" style={{ fontSize: '8px', color: '#444' }}>
                  {getCompanyInfo()}<br/>{getContactInfo()}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="doc-title text-center py-1 mb-2" style={{ fontSize: '11px', fontWeight: 'bold', color: primaryColor, background: '#f0f4f8', borderLeft: `3px solid ${secondaryColor}` }}>
              PAY ADVICE - {getDisplayPeriod()}
            </div>

            {/* Compact Recipient Info */}
            <div className="info-box p-2 mb-2" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div className="grid grid-cols-2 gap-1" style={{ fontSize: '9px' }}>
                <div className="flex"><span className="font-bold text-gray-600 w-16">Name:</span><span>{payAdvice.full_name}</span></div>
                <div className="flex"><span className="font-bold text-gray-600 w-16">Period:</span><span className="font-semibold">{payAdvice.period_name || getDisplayPeriod()}</span></div>
                <div className="flex"><span className="font-bold text-gray-600 w-16">NRIC:</span><span>{payAdvice.id_number || '-'}</span></div>
                <div className="flex"><span className="font-bold text-gray-600 w-16">Email:</span><span>{payAdvice.email || '-'}</span></div>
              </div>
            </div>

            {/* Compact Session Details Table */}
            <table className="w-full mb-2" style={{ fontSize: '8px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: primaryColor, color: 'white' }}>
                  <th className="border p-1 text-center" style={{ width: '25px', background: primaryColor }}>No</th>
                  <th className="border p-1" style={{ background: primaryColor }}>Company</th>
                  <th className="border p-1" style={{ background: primaryColor }}>Training Session</th>
                  <th className="border p-1" style={{ width: '60px', background: primaryColor }}>Date</th>
                  <th className="border p-1" style={{ width: '50px', background: primaryColor }}>Role</th>
                  <th className="border p-1 text-right" style={{ width: '70px', background: primaryColor }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payAdvice.session_details?.map((session, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-1 text-center">{idx + 1}</td>
                    <td className="border p-1">{session.company_name}</td>
                    <td className="border p-1">{session.session_name}</td>
                    <td className="border p-1">{session.session_date || '-'}</td>
                    <td className="border p-1 capitalize">{session.role}</td>
                    <td className="border p-1 text-right">{(session.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="5" className="border p-1 text-right">GROSS TOTAL</td>
                  <td className="border p-1 text-right">{formatCurrency(payAdvice.gross_amount)}</td>
                </tr>
                {payAdvice.deductions > 0 && (
                  <tr>
                    <td colSpan="5" className="border p-1 text-right">Less: Deductions</td>
                    <td className="border p-1 text-right">({formatCurrency(payAdvice.deductions)})</td>
                  </tr>
                )}
              </tfoot>
            </table>

            {/* Compact Nett Amount */}
            <div className="summary text-center py-2 my-2" style={{ background: secondaryColor, color: 'white' }}>
              <div style={{ fontSize: '9px' }}>NETT PAYMENT</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(payAdvice.nett_amount)}</div>
            </div>

            {/* Compact Bank Info */}
            {(payAdvice.bank_name || payAdvice.bank_account) && (
              <div className="bank-box p-2 mb-2" style={{ background: '#f0f4f8', borderLeft: `2px solid ${primaryColor}`, fontSize: '8px' }}>
                <span className="font-bold" style={{ color: primaryColor }}>Payment: </span>
                {payAdvice.bank_name || '-'} | Acc: {payAdvice.bank_account || '-'}
              </div>
            )}

            {/* Compact Signature Section */}
            <div className="sig-section grid grid-cols-2 gap-8 mt-4">
              <div className="sig-box text-center">
                <div className="sig-line" style={{ borderBottom: '1px solid #000', height: '25px', marginBottom: '2px' }}></div>
                <div style={{ fontSize: '8px' }}>Prepared By</div>
              </div>
              <div className="sig-box text-center">
                <div className="sig-line" style={{ borderBottom: '1px solid #000', height: '25px', marginBottom: '2px' }}></div>
                <div style={{ fontSize: '8px' }}>Received By</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer text-center mt-3" style={{ fontSize: '7px', color: '#666' }}>
              This document is computer-generated. For enquiries, please contact HR department.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAdvicePrint;
