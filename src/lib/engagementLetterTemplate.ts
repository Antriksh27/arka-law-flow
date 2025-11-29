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
            padding-top: 60mm;
            padding-bottom: 40mm;
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
          padding-top: 80px;
          padding-bottom: 60px;
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
          text-align: center;
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
        .content ul {
          list-style-type: disc;
          margin-left: 40px;
          margin-bottom: 15px;
        }
        .content ol {
          margin-left: 40px;
          margin-bottom: 15px;
        }
        .content li {
          margin-bottom: 10px;
        }
        .signature {
          margin-top: 40px;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 250px;
          margin-top: 60px;
        }
        .acknowledgment {
          margin-top: 60px;
          border-top: 2px solid #000;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LEGAL ENGAGEMENT LETTER</h1>
      </div>

      <div class="date">
        ${formattedDate}
      </div>

      <div class="recipient">
        ${data.clientName}${data.clientAddress ? '<br>' + data.clientAddress.split('\n').join('<br>') : ''}
      </div>

      <div class="subject">
        Subject: Engagement for Legal Services
      </div>

      <div class="content">
        <p>Dear ${data.clientName},</p>

        <p>
          This letter confirms that ${data.clientName} ("the Client") has engaged ${data.firmName} ("the Firm") to provide legal services in connection with ${data.matterDescription}.
        </p>

        <p>
          This Engagement Letter, and the attached Engagement Agreement, which is incorporated herein by reference, set forth the terms of our engagement. Please review these documents carefully and contact us if you have any questions.
        </p>

        <div class="section-title">1. Scope of Work</div>
        <p>The Firm will provide the following legal services:</p>
        <ul>
          <li>
            <strong>Legal Consultation and advice:</strong><br>
            Offering guidance to clients on their legal rights, responsibilities and options in various situations.
          </li>
          <li>
            <strong>Documentation preparation and review:</strong><br>
            Drafting, reviewing and negotiating various legal documents, including contracts, wills leases, agreements and corporate documents like articles of association or incorporation etc.
          </li>
          <li>
            <strong>Clients' representation:</strong><br>
            Acting on behalf of the clients in legal proceedings which includes negotiations, mediation, arbitration and court appearances for litigations.
          </li>
          <li>
            <strong>Legal Research and Analysis:</strong><br>
            Conducting in depth research in to relevant laws, regulations and case precedents to support clients matters and develops sound legal strategies.
          </li>
          <li>
            <strong>Alternative Dispute Resolution (ADR):</strong><br>
            Assisting clients in resolving disputes outside the Courts through the methods like mediation and arbitration.
          </li>
          <li>
            Any additional services that may be ancillary to the aforestated services, which shall be necessary to resolve the case of the clients. The Law firm also shall provide any other separate additional services that may be required by the clients, however, the same shall be subject to a separate written agreement based on separately agreed terms and conditions for the said scop.
          </li>
        </ul>

        <div class="section-title">2. Fees and Billing</div>
        <ul>
          <li>
            The fee structure module that our law firm adopts varied fee structure to suit the need of every client and the same is subjective. The same is over and above our terms and conditions shall be as under:
            <ol>
              <li>50% Advance</li>
              <li>25% upon filing of the matter</li>
              <li>25% on first hearing.</li>
            </ol>
          </li>
          <li>
            Irrespective of this fees structure, that may be adopted out of the aforestated options, the client shall be bound by the aforesaid payment structure that shall pe adopted qua the professional fees and the said terms and conditions qua the payment structure is to be agreed upon by the client unconditionally.
          </li>
          <li>
            In addition to the aforesaid professional fees, the actual expenses that shall be charged on actual basis over and above professional fees shall be payable by the client immediately on raising the invoice quarterly.
          </li>
        </ul>

        <div class="section-title">3. Client Responsibilities</div>
        <p>To effectively represent you, we require your full cooperation. You agree to:</p>
        <ul>
          <li>Provide all necessary information and documentation promptly.</li>
          <li>Communicate with us openly and honestly.</li>
          <li>Attend any required meetings, court appearances, or depositions.</li>
          <li>Make timely payments for our services as outlined above.</li>
        </ul>
        <p>Failure to meet these responsibilities may result in delays or termination of our representation.</p>

        <div class="section-title">4. Termination</div>
        <ul>
          <li>
            You may terminate our services at any time by providing 7 days advance written notice. In the event of termination by you, the firm shall not be responsible and liable for refund of any of the payments made to the firm as against either professional fees or against the expenses. The firm also shall be entitled to withdraw from the representation towards the clients under certain circumstances, such non-payment of fees, a breakdown in communication or any other reasons listed under the Advocate's Act or Bar Council of India or Professional Conduct Rules.
          </li>
          <li>
            In the event of termination, we will provide reasonable notice and ensure that you have the opportunity to secure alternative representation.
          </li>
          <li>
            Upon termination, any unpaid fees or costs will be due immediately. We will return all original documents to you, and you may request copies of your case file for your records.
          </li>
        </ul>

        <div class="section-title">5. Conclusion</div>
        <p>
          We are committed to providing you with high-quality legal services and clear communication throughout the course of our representation. Please sign and return a copy of this engagement letter to indicate your agreement with these terms.
        </p>
        <p>
          If you have any questions or concerns, feel free to reach out to me${data.lawyerPhone ? ' at ' + data.lawyerPhone : ''}${data.lawyerEmail ? (data.lawyerPhone ? ' or ' : ' at ') + data.lawyerEmail : ''}. We look forward to working with you.
        </p>

        <div class="signature">
          <p>Sincerely,</p>
          <br>
          <p>
            <strong>${data.lawyerName}</strong><br>
            ${data.firmName}<br>
            ${data.firmAddress ? data.firmAddress.split('\n').join('<br>') + '<br>' : ''}
            ${data.lawyerPhone ? 'Phone: ' + data.lawyerPhone + '<br>' : ''}${data.lawyerEmail ? 'Email: ' + data.lawyerEmail : ''}
          </p>
        </div>

        <div class="acknowledgment">
          <p><strong>Acknowledgment of Agreement</strong></p>
          <p>
            I, ${data.clientName}, have read, understand, and agree to the terms outlined in this engagement letter.
          </p>
          <br>
          <p>
            Signature: ___________________________
          </p>
          <p>
            Date: ___________________________
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
