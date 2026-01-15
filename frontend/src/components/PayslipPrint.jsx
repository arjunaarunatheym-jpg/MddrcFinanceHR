import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { X, Maximize2, Download } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

// Helper functions
const getMonthName = (month) => new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

// Payslip Content as a separate component
const PayslipContent = ({ payslip, companySettings, fullLogoUrl, showWatermark, watermarkOpacity }) => {
  // Get colors from company settings or use defaults
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoWidth = companySettings?.logo_width || 150;
  
  return (
    <div className="payslip relative" style={{ border: `2px solid ${primaryColor}` }}>
      {/* Watermark for preview */}
      {showWatermark && fullLogoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: watermarkOpacity, zIndex: 0 }}>
          <img src={fullLogoUrl} alt="" className="w-80 h-auto" />
        </div>
      )}
      
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header with Logo */}
        <div className="header" style={{ background: primaryColor, color: 'white', padding: '15px', textAlign: 'center' }}>
          {fullLogoUrl && (
            <img src={fullLogoUrl} alt="Company Logo" style={{ width: `${Math.max(logoWidth, 150)}px`, maxWidth: '220px', height: 'auto', marginBottom: '8px', background: 'white', padding: '5px', borderRadius: '4px' }} />
          )}
          <h1 style={{ fontSize: '16px', marginBottom: '5px' }}>{companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}</h1>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '4px' }}>
            PAYSLIP FOR {getMonthName(payslip.month).toUpperCase()} {payslip.year}
          </h2>
        </div>

        {/* Employee Info */}
        <div className="employee-info" style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f9fafb' }}>
          <div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>Employee Name:</span><span>{payslip.full_name}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>NRIC:</span><span>{payslip.nric || '-'}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>Employee ID:</span><span>{payslip.employee_id || '-'}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>Position:</span><span>{payslip.designation || '-'}</span></div>
          </div>
          <div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>Department:</span><span>{payslip.department || '-'}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>EPF No:</span><span>{payslip.epf_number || '-'}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>SOCSO No:</span><span>{payslip.socso_number || '-'}</span></div>
            <div style={{ display: 'flex', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', width: '120px', color: '#666' }}>Tax No:</span><span>{payslip.tax_number || '-'}</span></div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '15px', borderRight: '1px solid #ddd' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', paddingBottom: '5px', borderBottom: `2px solid ${secondaryColor}`, color: secondaryColor }}>EARNINGS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Basic Salary</span><span>{formatCurrency(payslip.basic_salary)}</span></div>
            {payslip.housing_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Housing Allowance</span><span>{formatCurrency(payslip.housing_allowance)}</span></div>}
            {payslip.transport_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Transport Allowance</span><span>{formatCurrency(payslip.transport_allowance)}</span></div>}
            {payslip.meal_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Meal Allowance</span><span>{formatCurrency(payslip.meal_allowance)}</span></div>}
            {payslip.phone_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Phone Allowance</span><span>{formatCurrency(payslip.phone_allowance)}</span></div>}
            {payslip.other_allowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Other Allowance</span><span>{formatCurrency(payslip.other_allowance)}</span></div>}
            {payslip.overtime > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Overtime</span><span>{formatCurrency(payslip.overtime)}</span></div>}
            {payslip.bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Bonus</span><span>{formatCurrency(payslip.bonus)}</span></div>}
            {payslip.commission > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Commission</span><span>{formatCurrency(payslip.commission)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 'bold', borderTop: '1px solid #ddd', marginTop: '10px', paddingTop: '10px' }}><span>GROSS SALARY</span><span>{formatCurrency(payslip.gross_salary)}</span></div>
          </div>
          
          <div style={{ padding: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '2px solid #dc2626', color: '#dc2626' }}>DEDUCTIONS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>EPF ({payslip.epf_employee_rate}%)</span><span>{formatCurrency(payslip.epf_employee)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>SOCSO</span><span>{formatCurrency(payslip.socso_employee)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>EIS</span><span>{formatCurrency(payslip.eis_employee)}</span></div>
            {payslip.pcb > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>PCB (Tax)</span><span>{formatCurrency(payslip.pcb)}</span></div>}
            {payslip.loan_deduction > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Loan Deduction</span><span>{formatCurrency(payslip.loan_deduction)}</span></div>}
            {payslip.other_deductions > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Other Deductions</span><span>{formatCurrency(payslip.other_deductions)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 'bold', borderTop: '1px solid #ddd', marginTop: '10px', paddingTop: '10px' }}><span>TOTAL DEDUCTIONS</span><span>{formatCurrency(payslip.total_deductions)}</span></div>
          </div>
        </div>

        {/* Nett Pay */}
        <div style={{ background: secondaryColor, color: 'white', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>NETT PAY</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(payslip.nett_pay)}</div>
        </div>

        {/* Employer Contributions */}
        <div style={{ padding: '15px', background: `${primaryColor}10`, borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', paddingBottom: '5px', borderBottom: `2px solid ${primaryColor}`, color: primaryColor }}>EMPLOYER CONTRIBUTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <div><strong>EPF:</strong> {formatCurrency(payslip.epf_employer)}</div>
            <div><strong>SOCSO:</strong> {formatCurrency(payslip.socso_employer)}</div>
            <div><strong>EIS:</strong> {formatCurrency(payslip.eis_employer)}</div>
          </div>
        </div>

        {/* YTD Section */}
        <div style={{ padding: '15px', background: '#fef9c3', borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '2px solid #ca8a04', color: '#ca8a04' }}>YEAR-TO-DATE ({payslip.year})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD Gross</div><div style={{ fontWeight: 'bold' }}>{formatCurrency(payslip.ytd_gross)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD EPF (EE)</div><div style={{ fontWeight: 'bold' }}>{formatCurrency(payslip.ytd_epf_employee)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD EPF (ER)</div><div style={{ fontWeight: 'bold' }}>{formatCurrency(payslip.ytd_epf_employer)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#666' }}>YTD PCB</div><div style={{ fontWeight: 'bold' }}>{formatCurrency(payslip.ytd_pcb)}</div></div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ddd' }}>
          This is a computer-generated payslip. No signature required.
          <br />Bank: {payslip.bank_name || '-'} | Account: {payslip.bank_account || '-'}
        </div>
      </div>
    </div>
  );
};

// Generate print styles dynamically based on company colors
const getPrintStyles = (primaryColor = '#1e40af', secondaryColor = '#16a34a', logoWidth = 150, watermarkOpacity = 0.08, fullLogoUrl = '') => `
  @page { size: A4; margin: 10mm; }
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
    width: 350px;
    height: auto;
  }
  
  .payslip { border: 2px solid ${primaryColor}; position: relative; }
  .header { background: ${primaryColor}; color: white; padding: 15px; text-align: center; }
  .header img { width: ${Math.max(logoWidth, 150)}px; max-width: 220px; height: auto; margin-bottom: 8px; background: white; padding: 5px; border-radius: 4px; }
  .header h1 { font-size: 16px; margin-bottom: 5px; }
  .header h2 { font-size: 14px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 5px; border-radius: 4px; }
  
  .employee-info { padding: 15px; border-bottom: 1px solid #ddd; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9fafb; }
  .info-row { display: flex; }
  .info-label { font-weight: bold; width: 120px; color: #666; }
  .info-value { flex: 1; }
  
  .main-content { display: grid; grid-template-columns: 1fr 1fr; }
  .earnings, .deductions { padding: 15px; }
  .earnings { border-right: 1px solid #ddd; }
  
  .section-title { font-weight: bold; font-size: 12px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid; }
  .earnings .section-title { color: ${secondaryColor}; border-color: ${secondaryColor}; }
  .deductions .section-title { color: #dc2626; border-color: #dc2626; }
  
  .item-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .item-row.total { font-weight: bold; border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; }
  
  .nett-pay { background: ${secondaryColor}; color: white; padding: 20px; text-align: center; }
  .nett-pay .label { font-size: 14px; margin-bottom: 5px; }
  .nett-pay .amount { font-size: 28px; font-weight: bold; }
  
  .employer-section { padding: 15px; background: ${primaryColor}10; border-top: 1px solid #ddd; }
  .employer-section .section-title { color: ${primaryColor}; border-color: ${primaryColor}; }
  .employer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
  
  .ytd-section { padding: 15px; background: #fef9c3; border-top: 1px solid #ddd; }
  .ytd-section .section-title { color: #ca8a04; border-color: #ca8a04; }
  .ytd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .ytd-item { text-align: center; }
  .ytd-item .label { font-size: 9px; color: #666; }
  .ytd-item .value { font-weight: bold; }
  
  .footer { padding: 10px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; }
`;

const PayslipPrint = ({ payslip, companySettings, onClose }) => {
  const printRef = useRef(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  
  // Get colors and settings from company settings
  const primaryColor = companySettings?.primary_color || '#1e40af';
  const secondaryColor = companySettings?.secondary_color || '#16a34a';
  const logoUrl = companySettings?.logo_url || '';
  const logoWidth = companySettings?.logo_width || 150;
  const showWatermark = companySettings?.show_watermark !== false;
  const watermarkOpacity = companySettings?.watermark_opacity || 0.08;
  
  // Build full logo URL
  const fullLogoUrl = logoUrl ? `${process.env.REACT_APP_BACKEND_URL || ''}${logoUrl}` : '';
  
  const printStyles = getPrintStyles(primaryColor, secondaryColor, logoWidth, watermarkOpacity, fullLogoUrl);

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

  // Full-page preview mode
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

  // Standard modal preview
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
