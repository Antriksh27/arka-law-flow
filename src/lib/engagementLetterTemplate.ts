import { format } from 'date-fns';

export interface EngagementLetterData {
  date: Date;
  clientName: string;
  clientAddress: string;
  matterDescription: string;
  lawyerName: string;
  lawyerPhone: string;
  lawyerEmail: string;
  firmName: string;
  firmAddress: string;
}

export function generateEngagementLetter(data: EngagementLetterData): string {
  const formattedDate = format(data.date, 'MMMM dd, yyyy');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Legal Engagement Letter</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20mm;
          }
          .no-print {
            display: none;
          }
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #000;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
        }
        .date {
          text-align: right;
          margin-bottom: 20px;
        }
        .recipient {
          margin-bottom: 20px;
        }
        .subject {
          font-weight: bold;
          margin: 20px 0;
          text-decoration: underline;
        }
        .content {
          text-align: justify;
        }
        .content p {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .signature {
          margin-top: 40px;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-top: 60px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LEGAL ENGAGEMENT LETTER</h1>
      </div>

      <div class="date">
        <strong>Date:</strong> ${formattedDate}
      </div>

      <div class="recipient">
        <strong>To:</strong><br>
        ${data.clientName}<br>
        ${data.clientAddress.split('\n').join('<br>')}
      </div>

      <div class="subject">
        Subject: Engagement Letter for Legal Services
      </div>

      <div class="content">
        <p>Dear ${data.clientName},</p>

        <p>
          Thank you for choosing ${data.firmName} to represent you in your legal matter. 
          This letter confirms our agreement and outlines the terms and conditions of our engagement.
        </p>

        <div class="section-title">1. Scope of Work</div>
        <p>
          We agree to represent you in connection with: <strong>${data.matterDescription}</strong>. 
          Our services will include, but are not limited to, legal advice, document preparation, court appearances, 
          and negotiation on your behalf as required for this matter.
        </p>

        <div class="section-title">2. Fees and Billing</div>
        <p>
          Our fees will be based on the time spent on your matter, the complexity of the issues involved, 
          and the results achieved. We will provide you with detailed invoices on a regular basis. 
          Payment is due within 30 days of the invoice date.
        </p>
        <p>
          In addition to professional fees, you will be responsible for reimbursing us for any out-of-pocket 
          expenses incurred on your behalf, including court filing fees, expert witness fees, travel expenses, 
          and other necessary costs related to your case.
        </p>

        <div class="section-title">3. Client Responsibilities</div>
        <p>
          To enable us to represent you effectively, we ask that you:
        </p>
        <ul>
          <li>Provide us with all relevant information and documents promptly</li>
          <li>Respond to our communications in a timely manner</li>
          <li>Keep us informed of any changes in your circumstances that may affect your case</li>
          <li>Be truthful and accurate in all information provided to us</li>
        </ul>

        <div class="section-title">4. Communication</div>
        <p>
          We will keep you informed about the progress of your matter and will respond to your inquiries promptly. 
          You may contact us at any time during business hours at ${data.lawyerPhone} or via email at ${data.lawyerEmail}.
        </p>

        <div class="section-title">5. Termination of Services</div>
        <p>
          Either party may terminate this engagement at any time by providing written notice. 
          Upon termination, you will be responsible for payment of all fees and expenses incurred up to the date of termination.
        </p>

        <div class="section-title">6. Confidentiality</div>
        <p>
          All information you provide to us will be kept strictly confidential in accordance with professional 
          ethics and applicable laws. We will not disclose any information about your case without your express consent, 
          except as required by law or court order.
        </p>

        <div class="section-title">7. Agreement</div>
        <p>
          If the terms outlined in this letter are acceptable to you, please sign and return a copy of this letter 
          to confirm your agreement. If you have any questions or concerns, please do not hesitate to contact us.
        </p>

        <p>We look forward to working with you on this matter.</p>

        <div class="signature">
          <p>Sincerely,</p>
          <div class="signature-line"></div>
          <p>
            <strong>${data.lawyerName}</strong><br>
            ${data.firmName}<br>
            ${data.firmAddress.split('\n').join('<br>')}<br>
            Phone: ${data.lawyerPhone}<br>
            Email: ${data.lawyerEmail}
          </p>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px;">
          <p><strong>Client Acknowledgment</strong></p>
          <p>
            I have read and understood the terms of this engagement letter and agree to be bound by them.
          </p>
          <div class="signature">
            <div class="signature-line"></div>
            <p>
              <strong>Client Signature</strong><br>
              Name: ${data.clientName}<br>
              Date: _________________
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
