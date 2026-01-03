import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, X, Download } from 'lucide-react';

const PayslipPrint = ({ payslip, companySettings, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${payslip.full_name} - ${payslip.period_name}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            
            .payslip { border: 2px solid #1e40af; }
            .header { background: #1e40af; color: white; padding: 15px; text-align: center; }
            .header h1 { font-size: 16px; margin-bottom: 5px; }
            .header h2 { font-size: 12px; font-weight: normal; }
            
            .employee-info { padding: 15px; border-bottom: 1px solid #ddd; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-row { display: flex; }
            .info-label { font-weight: bold; width: 120px; color: #666; }
            .info-value { flex: 1; }
            
            .main-content { display: grid; grid-template-columns: 1fr 1fr; }
            .earnings, .deductions { padding: 15px; }
            .earnings { border-right: 1px solid #ddd; }
            
            .section-title { font-weight: bold; font-size: 12px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid; }
            .earnings .section-title { color: #16a34a; border-color: #16a34a; }
            .deductions .section-title { color: #dc2626; border-color: #dc2626; }
            
            .item-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .item-row.total { font-weight: bold; border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; }
            
            .nett-pay { background: #16a34a; color: white; padding: 15px; text-align: center; }
            .nett-pay .label { font-size: 12px; }
            .nett-pay .amount { font-size: 24px; font-weight: bold; }
            
            .employer-section { padding: 15px; background: #eff6ff; border-top: 1px solid #ddd; }
            .employer-section .section-title { color: #1e40af; border-color: #1e40af; }
            .employer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            
            .ytd-section { padding: 15px; background: #fef9c3; border-top: 1px solid #ddd; }
            .ytd-section .section-title { color: #ca8a04; border-color: #ca8a04; }
            .ytd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            .ytd-item { text-align: center; }
            .ytd-item .label { font-size: 9px; color: #666; }
            .ytd-item .value { font-weight: bold; }
            
            .footer { padding: 10px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; }
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

  const getMonthName = (month) => new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  const formatCurrency = (val) => `RM ${(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Payslip Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div ref={printRef} className="p-4">
          <div className="payslip">
            {/* Header */}
            <div className="header">
              <h1>{companySettings?.company_name || 'MALAYSIAN DEFENSIVE DRIVING AND RIDING CENTRE SDN BHD'}</h1>
              <h2>PAYSLIP FOR {getMonthName(payslip.month).toUpperCase()} {payslip.year}</h2>
            </div>

            {/* Employee Info */}
            <div className="employee-info">
              <div>
                <div className="info-row"><span className="info-label">Employee Name:</span><span className="info-value">{payslip.full_name}</span></div>
                <div className="info-row"><span className="info-label">NRIC:</span><span className="info-value">{payslip.nric || '-'}</span></div>
                <div className="info-row"><span className="info-label">Employee ID:</span><span className="info-value">{payslip.employee_id || '-'}</span></div>
                <div className="info-row"><span className="info-label">Position:</span><span className="info-value">{payslip.designation || '-'}</span></div>
              </div>
              <div>
                <div className="info-row"><span className="info-label">Department:</span><span className="info-value">{payslip.department || '-'}</span></div>
                <div className="info-row"><span className="info-label">EPF No:</span><span className="info-value">{payslip.epf_number || '-'}</span></div>
                <div className="info-row"><span className="info-label">SOCSO No:</span><span className="info-value">{payslip.socso_number || '-'}</span></div>
                <div className="info-row"><span className="info-label">Tax No:</span><span className="info-value">{payslip.tax_number || '-'}</span></div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="main-content">
              <div className="earnings">
                <div className="section-title">EARNINGS</div>
                <div className="item-row"><span>Basic Salary</span><span>{formatCurrency(payslip.basic_salary)}</span></div>
                {payslip.housing_allowance > 0 && <div className="item-row"><span>Housing Allowance</span><span>{formatCurrency(payslip.housing_allowance)}</span></div>}
                {payslip.transport_allowance > 0 && <div className="item-row"><span>Transport Allowance</span><span>{formatCurrency(payslip.transport_allowance)}</span></div>}
                {payslip.meal_allowance > 0 && <div className="item-row"><span>Meal Allowance</span><span>{formatCurrency(payslip.meal_allowance)}</span></div>}
                {payslip.phone_allowance > 0 && <div className="item-row"><span>Phone Allowance</span><span>{formatCurrency(payslip.phone_allowance)}</span></div>}
                {payslip.other_allowance > 0 && <div className="item-row"><span>Other Allowance</span><span>{formatCurrency(payslip.other_allowance)}</span></div>}
                {payslip.overtime > 0 && <div className="item-row"><span>Overtime</span><span>{formatCurrency(payslip.overtime)}</span></div>}
                {payslip.bonus > 0 && <div className="item-row"><span>Bonus</span><span>{formatCurrency(payslip.bonus)}</span></div>}
                {payslip.commission > 0 && <div className="item-row"><span>Commission</span><span>{formatCurrency(payslip.commission)}</span></div>}
                <div className="item-row total"><span>GROSS SALARY</span><span>{formatCurrency(payslip.gross_salary)}</span></div>
              </div>
              
              <div className="deductions">
                <div className="section-title">DEDUCTIONS</div>
                <div className="item-row"><span>EPF ({payslip.epf_employee_rate}%)</span><span>{formatCurrency(payslip.epf_employee)}</span></div>
                <div className="item-row"><span>SOCSO</span><span>{formatCurrency(payslip.socso_employee)}</span></div>
                <div className="item-row"><span>EIS</span><span>{formatCurrency(payslip.eis_employee)}</span></div>
                {payslip.pcb > 0 && <div className="item-row"><span>PCB (Tax)</span><span>{formatCurrency(payslip.pcb)}</span></div>}
                {payslip.loan_deduction > 0 && <div className="item-row"><span>Loan Deduction</span><span>{formatCurrency(payslip.loan_deduction)}</span></div>}
                {payslip.other_deductions > 0 && <div className="item-row"><span>Other Deductions</span><span>{formatCurrency(payslip.other_deductions)}</span></div>}
                <div className="item-row total"><span>TOTAL DEDUCTIONS</span><span>{formatCurrency(payslip.total_deductions)}</span></div>
              </div>
            </div>

            {/* Nett Pay */}
            <div className="nett-pay">
              <div className="label">NETT PAY</div>
              <div className="amount">{formatCurrency(payslip.nett_pay)}</div>
            </div>

            {/* Employer Contributions */}
            <div className="employer-section">
              <div className="section-title">EMPLOYER CONTRIBUTIONS</div>
              <div className="employer-grid">
                <div><strong>EPF:</strong> {formatCurrency(payslip.epf_employer)}</div>
                <div><strong>SOCSO:</strong> {formatCurrency(payslip.socso_employer)}</div>
                <div><strong>EIS:</strong> {formatCurrency(payslip.eis_employer)}</div>
              </div>
            </div>

            {/* YTD Section */}
            <div className="ytd-section">
              <div className="section-title">YEAR-TO-DATE ({payslip.year})</div>
              <div className="ytd-grid">
                <div className="ytd-item"><div className="label">YTD Gross</div><div className="value">{formatCurrency(payslip.ytd_gross)}</div></div>
                <div className="ytd-item"><div className="label">YTD EPF (EE)</div><div className="value">{formatCurrency(payslip.ytd_epf_employee)}</div></div>
                <div className="ytd-item"><div className="label">YTD EPF (ER)</div><div className="value">{formatCurrency(payslip.ytd_epf_employer)}</div></div>
                <div className="ytd-item"><div className="label">YTD PCB</div><div className="value">{formatCurrency(payslip.ytd_pcb)}</div></div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              This is a computer-generated payslip. No signature required.
              <br />Bank: {payslip.bank_name || '-'} | Account: {payslip.bank_account || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipPrint;
