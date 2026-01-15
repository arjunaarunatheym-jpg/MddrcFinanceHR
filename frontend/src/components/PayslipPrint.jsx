import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { X, Maximize2, Download } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

// Helper functions
const getMonthName = (month) => new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

// Payslip Content with standardized header like invoice
const PayslipContent = ({ payslip, companySettings, fullLogoUrl, showWatermark, watermarkOpacity }) => {
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoWidth = companySettings?.logo_width || 150;
  
  // Build company info parts
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
    <div className="payslip relative" style={{ border: `2px solid ${primaryColor}` }}>
      {/* Watermark for preview */}
      {showWatermark && fullLogoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: watermarkOpacity, zIndex: 0 }}>
          <img src={fullLogoUrl} alt="" className="w-80 h-auto" />
        </div>
      )}
      
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header - Invoice Style */}
        <div className="flex items-start gap-4 p-4" style={{ borderBottom: `3px solid ${primaryColor}` }}>
          {fullLogoUrl && (
            <img src={fullLogoUrl} alt="Logo" style={{ width: `${Math.max(logoWidth, 100)}px`, maxWidth: '120px', height: 'auto', flexShrink: 0 }} />
          )}
          <div className="flex-1">
            <div className="text-base font-bold mb-1" style={{ color: primaryColor }}>
              {companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {companyInfoParts.length > 0 && <span>{companyInfoParts.join(' • ')}</span>}
              {addressParts.length > 0 && <><br />{addressParts.join(', ')}</>}
              {contactParts.length > 0 && <><br />{contactParts.join(' • ')}</>}
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center py-2 px-4 mx-4 my-3 rounded" style={{ background: '#f0f4f8', borderLeft: `4px solid ${secondaryColor}` }}>
          <span className="text-lg font-bold" style={{ color: primaryColor }}>PAYSLIP - {getMonthName(payslip.month).toUpperCase()} {payslip.year}</span>
        </div>

        {/* Employee Info */}
        <div className="px-4 pb-3">
          <div className="p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">Employee Name:</span><span>{payslip.full_name}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">NRIC:</span><span>{payslip.nric || '-'}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">Employee ID:</span><span>{payslip.employee_id || '-'}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">Position:</span><span>{payslip.designation || '-'}</span></div>
              </div>
              <div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">Department:</span><span>{payslip.department || '-'}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">EPF No:</span><span>{payslip.epf_number || '-'}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">SOCSO No:</span><span>{payslip.socso_number || '-'}</span></div>
                <div className="flex mb-1"><span className="font-bold w-28 text-gray-600">Tax No:</span><span>{payslip.tax_number || '-'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '12px 16px', borderRight: '1px solid #ddd' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', paddingBottom: '4px', borderBottom: `2px solid ${secondaryColor}`, color: secondaryColor }}>EARNINGS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Basic Salary</span><span>{formatCurrency(payslip.basic_salary)}</span></div>
            {payslip.housing_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Housing Allowance</span><span>{formatCurrency(payslip.housing_allowance)}</span></div>}
            {payslip.transport_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Transport Allowance</span><span>{formatCurrency(payslip.transport_allowance)}</span></div>}
            {payslip.meal_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Meal Allowance</span><span>{formatCurrency(payslip.meal_allowance)}</span></div>}
            {payslip.phone_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Phone Allowance</span><span>{formatCurrency(payslip.phone_allowance)}</span></div>}
            {payslip.other_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Other Allowance</span><span>{formatCurrency(payslip.other_allowance)}</span></div>}
            {payslip.overtime > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Overtime</span><span>{formatCurrency(payslip.overtime)}</span></div>}
            {payslip.bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Bonus</span><span>{formatCurrency(payslip.bonus)}</span></div>}
            {payslip.commission > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Commission</span><span>{formatCurrency(payslip.commission)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 'bold', borderTop: '1px solid #ddd', marginTop: '8px', paddingTop: '8px', fontSize: '11px' }}><span>GROSS SALARY</span><span>{formatCurrency(payslip.gross_salary)}</span></div>
          </div>
          
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #dc2626', color: '#dc2626' }}>DEDUCTIONS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>EPF ({payslip.epf_employee_rate}%)</span><span>{formatCurrency(payslip.epf_employee)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>SOCSO</span><span>{formatCurrency(payslip.socso_employee)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>EIS</span><span>{formatCurrency(payslip.eis_employee)}</span></div>
            {payslip.pcb > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>PCB (Tax)</span><span>{formatCurrency(payslip.pcb)}</span></div>}
            {payslip.loan_deduction > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Loan Deduction</span><span>{formatCurrency(payslip.loan_deduction)}</span></div>}
            {payslip.other_deductions > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}><span>Other Deductions</span><span>{formatCurrency(payslip.other_deductions)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 'bold', borderTop: '1px solid #ddd', marginTop: '8px', paddingTop: '8px', fontSize: '11px' }}><span>TOTAL DEDUCTIONS</span><span>{formatCurrency(payslip.total_deductions)}</span></div>
          </div>
        </div>

        {/* Nett Pay */}
        <div style={{ background: secondaryColor, color: 'white', padding: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>NETT PAY</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(payslip.nett_pay)}</div>
        </div>

        {/* Employer Contributions */}
        <div style={{ padding: '12px 16px', background: `${primaryColor}08`, borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', paddingBottom: '4px', borderBottom: `2px solid ${primaryColor}`, color: primaryColor }}>EMPLOYER CONTRIBUTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '11px' }}>
            <div><strong>EPF:</strong> {formatCurrency(payslip.epf_employer)}</div>
            <div><strong>SOCSO:</strong> {formatCurrency(payslip.socso_employer)}</div>
            <div><strong>EIS:</strong> {formatCurrency(payslip.eis_employer)}</div>
          </div>
        </div>

        {/* YTD Section */}
        <div style={{ padding: '12px 16px', background: '#fef9c3', borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #ca8a04', color: '#ca8a04' }}>YEAR-TO-DATE ({payslip.year})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD Gross</div><div style={{ fontWeight: 'bold', fontSize: '11px' }}>{formatCurrency(payslip.ytd_gross)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD EPF (EE)</div><div style={{ fontWeight: 'bold', fontSize: '11px' }}>{formatCurrency(payslip.ytd_epf_employee)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD EPF (ER)</div><div style={{ fontWeight: 'bold', fontSize: '11px' }}>{formatCurrency(payslip.ytd_epf_employer)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD PCB</div><div style={{ fontWeight: 'bold', fontSize: '11px' }}>{formatCurrency(payslip.ytd_pcb)}</div></div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ddd' }}>
          This is a computer-generated payslip. No signature required.
          <br />Bank: {payslip.bank_name || '-'} | Account: {payslip.bank_account || '-'}
        </div>
      </div>
    </div>
  );
};

// Generate print styles
const getPrintStyles = (primaryColor = '#1e40af', secondaryColor = '#16a34a', logoWidth = 150, watermarkOpacity = 0.08) => `
  @page { size: A4; margin: 10mm; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; position: relative; }
  
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: ${watermarkOpacity}; z-index: -1; pointer-events: none; }
  .watermark img { width: 350px; height: auto; }
  
  .payslip { border: 2px solid ${primaryColor}; position: relative; }
  
  .header { display: flex; align-items: flex-start; gap: 15px; padding: 15px; border-bottom: 3px solid ${primaryColor}; }
  .header .logo-img { width: ${Math.max(logoWidth, 100)}px; max-width: 120px; height: auto; flex-shrink: 0; }
  .header .company-name { font-size: 14px; font-weight: bold; color: ${primaryColor}; margin-bottom: 4px; }
  .header .company-info { font-size: 10px; color: #444; line-height: 1.4; }
  
  .document-title { text-align: center; padding: 8px 16px; margin: 12px 16px; background: #f0f4f8; border-left: 4px solid ${secondaryColor}; border-radius: 4px; }
  .document-title span { font-size: 16px; font-weight: bold; color: ${primaryColor}; }
  
  .employee-info { padding: 0 16px 12px; }
  .employee-info .info-box { padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; }
  .employee-info .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; }
  .employee-info .info-row { display: flex; margin-bottom: 3px; }
  .employee-info .info-label { font-weight: bold; width: 100px; color: #666; }
  
  .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; }
  .earnings, .deductions { padding: 12px 16px; }
  .earnings { border-right: 1px solid #ddd; }
  .section-title { font-weight: bold; font-size: 11px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid; }
  .earnings .section-title { color: ${secondaryColor}; border-color: ${secondaryColor}; }
  .deductions .section-title { color: #dc2626; border-color: #dc2626; }
  .item-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
  .item-row.total { font-weight: bold; border-top: 1px solid #ddd; margin-top: 8px; padding-top: 8px; }
  
  .nett-pay { background: ${secondaryColor}; color: white; padding: 15px; text-align: center; }
  .nett-pay .label { font-size: 12px; margin-bottom: 3px; }
  .nett-pay .amount { font-size: 24px; font-weight: bold; }
  
  .employer-section { padding: 12px 16px; background: ${primaryColor}08; border-top: 1px solid #ddd; }
  .employer-section .section-title { color: ${primaryColor}; border-color: ${primaryColor}; }
  .employer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 10px; }
  
  .ytd-section { padding: 12px 16px; background: #fef9c3; border-top: 1px solid #ddd; }
  .ytd-section .section-title { color: #ca8a04; border-color: #ca8a04; }
  .ytd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .ytd-item { text-align: center; }
  .ytd-item .label { font-size: 8px; color: #666; }
  .ytd-item .value { font-weight: bold; font-size: 10px; }
  
  .footer { padding: 8px 16px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ddd; }
`;

const PayslipPrint = ({ payslip, companySettings, onClose }) => {
  const printRef = useRef(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoUrl = companySettings?.logo_url || '';
  const logoWidth = companySettings?.logo_width || 150;
  const showWatermark = companySettings?.show_watermark !== false;
  const watermarkOpacity = companySettings?.watermark_opacity || 0.08;
  
  const fullLogoUrl = logoUrl ? `${process.env.REACT_APP_BACKEND_URL || ''}${logoUrl}` : '';
  const printStyles = getPrintStyles(primaryColor, secondaryColor, logoWidth, watermarkOpacity);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${payslip.full_name} - ${payslip.period_name}</title>
          <style>${printStyles}</style>
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

  if (showFullPreview) {
    return (
      <DocumentPreview
        title={`Payslip - ${payslip.full_name} - ${getMonthName(payslip.month)} ${payslip.year}`}
        onClose={() => setShowFullPreview(false)}
        printStyles={printStyles}
        fileName={`Payslip_${payslip.full_name}_${payslip.month}_${payslip.year}`}
      >
        <PayslipContent payslip={payslip} companySettings={companySettings} fullLogoUrl={fullLogoUrl} showWatermark={showWatermark} watermarkOpacity={watermarkOpacity} />
      </DocumentPreview>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Payslip Preview</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowFullPreview(true)} variant="outline" title="Full Page Preview">
              <Maximize2 className="w-4 h-4 mr-2" /> Full Preview
            </Button>
            <Button onClick={handlePrint} style={{ backgroundColor: secondaryColor }} className="hover:opacity-90">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div ref={printRef} className="p-4">
          <PayslipContent payslip={payslip} companySettings={companySettings} fullLogoUrl={fullLogoUrl} showWatermark={showWatermark} watermarkOpacity={watermarkOpacity} />
        </div>
      </div>
    </div>
  );
};

export default PayslipPrint;
