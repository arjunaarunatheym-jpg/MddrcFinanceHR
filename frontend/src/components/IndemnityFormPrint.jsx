import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, X, Download } from 'lucide-react';

const IndemnityFormPrint = ({ record, sessionInfo, companySettings, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    const styling = companySettings?.document_styling || {};
    const primaryColor = styling.primary_color || '#1e40af';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Indemnity Form - ${record.full_name}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; padding: 20px; }
            
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
            .logo { max-width: 120px; max-height: 60px; object-fit: contain; margin-bottom: 10px; }
            .company-name { font-size: 16px; font-weight: bold; color: ${primaryColor}; }
            .form-title { font-size: 18px; font-weight: bold; margin-top: 10px; text-transform: uppercase; }
            
            .section { margin-bottom: 20px; }
            .section-title { background: ${primaryColor}; color: white; padding: 8px 12px; font-weight: bold; margin-bottom: 10px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .info-item { display: flex; flex-direction: column; }
            .info-label { font-weight: bold; font-size: 10px; color: #666; text-transform: uppercase; }
            .info-value { border-bottom: 1px solid #ccc; padding: 5px 0; min-height: 25px; }
            
            .indemnity-text { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; text-align: justify; }
            .indemnity-text p { margin-bottom: 10px; }
            
            .signature-section { margin-top: 30px; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
            .signature-box { text-align: center; }
            .signature-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px; }
            .signature-label { font-size: 10px; color: #666; }
            
            .acceptance-badge { 
              display: inline-block; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold; 
              margin: 15px 0;
            }
            .accepted { background: #c8e6c9; color: #2e7d32; }
            .not-accepted { background: #ffcdd2; color: #c62828; }
            
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        {/* Action Bar */}
        <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Indemnity Form - {record.full_name}</h2>
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
        <div ref={printRef} className="p-8 bg-white">
          {/* Header */}
          <div className="header">
            {companySettings?.logo_url && (
              <img src={companySettings.logo_url} alt="Logo" className="logo" style={{ margin: '0 auto', display: 'block' }} />
            )}
            <div className="company-name">{companySettings?.company_name || 'MDDRC'}</div>
            <div className="form-title">Indemnity Form</div>
          </div>

          {/* Session Information */}
          <div className="section">
            <div className="section-title">Session Information</div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Training Program</span>
                <span className="info-value">{sessionInfo?.session_name || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Company</span>
                <span className="info-value">{sessionInfo?.company_name || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Training Date</span>
                <span className="info-value">{sessionInfo?.training_date || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{sessionInfo?.location || '-'}</span>
              </div>
            </div>
          </div>

          {/* Participant Information */}
          <div className="section">
            <div className="section-title">Participant Information</div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{record.full_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">IC/Passport Number</span>
                <span className="info-value">{record.id_number || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{record.phone_number || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{record.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {record.emergency_contact_name && (
            <div className="section">
              <div className="section-title">Emergency Contact</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Contact Name</span>
                  <span className="info-value">{record.emergency_contact_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Relationship</span>
                  <span className="info-value">{record.emergency_contact_relationship || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contact Number</span>
                  <span className="info-value">{record.emergency_contact_phone || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Indemnity Declaration */}
          <div className="section">
            <div className="section-title">Indemnity Declaration</div>
            <div className="indemnity-text">
              <p>
                I, <strong>{record.full_name}</strong>, hereby declare that I am participating in the above training program voluntarily and at my own risk.
              </p>
              <p>
                I understand that the training involves physical activities and exercises that may result in injury. I hereby release and discharge {companySettings?.company_name || 'the training provider'}, its employees, agents, and representatives from any and all claims, demands, damages, rights of action, or causes of action arising from my participation in this training program.
              </p>
              <p>
                I confirm that I am in good physical condition and have no medical conditions that would prevent me from participating in the training activities. I agree to follow all safety instructions provided by the trainers.
              </p>
              <p>
                I have read and understood this indemnity form and agree to its terms and conditions.
              </p>
            </div>
          </div>

          {/* Acceptance Status */}
          <div className="section" style={{ textAlign: 'center' }}>
            <span className={`acceptance-badge ${record.indemnity_accepted ? 'accepted' : 'not-accepted'}`}>
              {record.indemnity_accepted ? '✓ ACCEPTED & SIGNED' : '✗ NOT YET ACCEPTED'}
            </span>
          </div>

          {/* Signature Section */}
          <div className="signature-section">
            <div className="signature-grid">
              <div className="signature-box">
                <div className="signature-line">
                  {record.indemnity_signed_name && (
                    <p style={{ paddingTop: '35px', fontStyle: 'italic' }}>{record.indemnity_signed_name}</p>
                  )}
                </div>
                <div className="signature-label">Participant Signature</div>
                <div style={{ marginTop: '5px' }}>
                  <strong>{record.full_name}</strong>
                </div>
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Date</div>
                <div style={{ marginTop: '5px' }}>
                  <strong>{record.indemnity_signed_date ? formatDate(record.indemnity_signed_date) : '-'}</strong>
                </div>
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

export default IndemnityFormPrint;
