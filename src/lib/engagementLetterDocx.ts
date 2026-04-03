import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface EngagementLetterDocxData {
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

export async function downloadEngagementLetterDocx(data: EngagementLetterDocxData) {
  const formattedDate = format(data.date, 'MMMM dd, yyyy');

  const numbering = {
    config: [
      {
        reference: 'scope-bullets',
        levels: [
          {
            level: 0,
            format: 'bullet' as const,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'fee-bullets',
        levels: [
          {
            level: 0,
            format: 'bullet' as const,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'fee-numbers',
        levels: [
          {
            level: 0,
            format: 'decimal' as const,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'client-bullets',
        levels: [
          {
            level: 0,
            format: 'bullet' as const,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'termination-bullets',
        levels: [
          {
            level: 0,
            format: 'bullet' as const,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    numbering,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'LEGAL ENGAGEMENT LETTER', bold: true, size: 40, font: 'Times New Roman' }),
            ],
          }),

          // Date
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [new TextRun({ text: formattedDate })],
          }),

          // Recipient
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: data.clientName })],
          }),
          ...(data.clientAddress
            ? data.clientAddress.split('\n').map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun({ text: line })],
                  })
              )
            : []),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // Subject
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
            children: [new TextRun({ text: 'Subject: Engagement for Legal Services', bold: true })],
          }),

          // Dear
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Dear ${data.clientName},` })],
          }),

          // Intro paragraphs
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `This letter confirms that ${data.clientName} ("the Client") has engaged ${data.firmName} ("the Firm") to provide legal services in connection with ${data.matterDescription}.`,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'This Engagement Letter, and the attached Engagement Agreement, which is incorporated herein by reference, set forth the terms of our engagement. Please review these documents carefully and contact us if you have any questions.',
              }),
            ],
          }),

          // Section 1 - Scope of Work
          new Paragraph({
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '1. Scope of Work', bold: true })],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [new TextRun({ text: 'The Firm will provide the following legal services:' })],
          }),

          // Scope bullets
          ...createScopeBullets(),

          // Section 2 - Fees and Billing
          new Paragraph({
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '2. Fees and Billing', bold: true })],
          }),
          ...createFeeBullets(),

          // Section 3 - Client Responsibilities
          new Paragraph({
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '3. Client Responsibilities', bold: true })],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: 'To effectively represent you, we require your full cooperation. You agree to:',
              }),
            ],
          }),
          ...createClientBullets(),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Failure to meet these responsibilities may result in delays or termination of our representation.',
              }),
            ],
          }),

          // Section 4 - Termination
          new Paragraph({
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '4. Termination', bold: true })],
          }),
          ...createTerminationBullets(),

          // Section 5 - Conclusion
          new Paragraph({
            spacing: { before: 300, after: 150 },
            children: [new TextRun({ text: '5. Conclusion', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'We are committed to providing you with high-quality legal services and clear communication throughout the course of our representation. Please sign and return a copy of this engagement letter to indicate your agreement with these terms.',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `If you have any questions or concerns, feel free to reach out to me${data.lawyerPhone ? ' at ' + data.lawyerPhone : ''}${data.lawyerEmail ? (data.lawyerPhone ? ' or ' : ' at ') + data.lawyerEmail : ''}. We look forward to working with you.`,
              }),
            ],
          }),

          // Signature
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Sincerely,' })],
          }),
          new Paragraph({ spacing: { after: 600 }, children: [] }),
          new Paragraph({
            children: [new TextRun({ text: data.lawyerName, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: data.firmName })],
          }),
          ...(data.firmAddress
            ? data.firmAddress.split('\n').map(
                (line) => new Paragraph({ children: [new TextRun({ text: line })] })
              )
            : []),
          ...(data.lawyerPhone
            ? [new Paragraph({ children: [new TextRun({ text: `Phone: ${data.lawyerPhone}` })] })]
            : []),
          ...(data.lawyerEmail
            ? [new Paragraph({ children: [new TextRun({ text: `Email: ${data.lawyerEmail}` })] })]
            : []),

          // Acknowledgment
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 8 } },
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: 'Acknowledgment of Agreement', bold: true })],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `I, ${data.clientName}, have read, understand, and agree to the terms outlined in this engagement letter.`,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Signature: ___________________________' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Date: ___________________________' })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `Engagement_Letter_${data.clientName.replace(/\s+/g, '_')}.docx`);
}

function createScopeBullets(): Paragraph[] {
  const items = [
    { title: 'Legal Consultation and advice:', desc: 'Offering guidance to clients on their legal rights, responsibilities and options in various situations.' },
    { title: 'Documentation preparation and review:', desc: 'Drafting, reviewing and negotiating various legal documents, including contracts, wills leases, agreements and corporate documents like articles of association or incorporation etc.' },
    { title: 'Clients\u2019 representation:', desc: 'Acting on behalf of the clients in legal proceedings which includes negotiations, mediation, arbitration and court appearances for litigations.' },
    { title: 'Legal Research and Analysis:', desc: 'Conducting in depth research in to relevant laws, regulations and case precedents to support clients matters and develops sound legal strategies.' },
    { title: 'Alternative Dispute Resolution (ADR):', desc: 'Assisting clients in resolving disputes outside the Courts through the methods like mediation and arbitration.' },
  ];

  const bullets: Paragraph[] = [];
  for (const item of items) {
    bullets.push(
      new Paragraph({
        numbering: { reference: 'scope-bullets', level: 0 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 150 },
        children: [
          new TextRun({ text: item.title, bold: true }),
          new TextRun({ text: ' ' + item.desc }),
        ],
      })
    );
  }

  bullets.push(
    new Paragraph({
      numbering: { reference: 'scope-bullets', level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Any additional services that may be ancillary to the aforestated services, which shall be necessary to resolve the case of the clients.',
        }),
      ],
    })
  );

  return bullets;
}

function createFeeBullets(): Paragraph[] {
  return [
    new Paragraph({
      numbering: { reference: 'fee-bullets', level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'The fee structure module that our law firm adopts varied fee structure to suit the need of every client and the same is subjective:',
        }),
      ],
    }),
    new Paragraph({
      numbering: { reference: 'fee-numbers', level: 0 },
      spacing: { after: 50 },
      children: [new TextRun({ text: '50% Advance' })],
    }),
    new Paragraph({
      numbering: { reference: 'fee-numbers', level: 0 },
      spacing: { after: 50 },
      children: [new TextRun({ text: '25% upon filing of the matter' })],
    }),
    new Paragraph({
      numbering: { reference: 'fee-numbers', level: 0 },
      spacing: { after: 150 },
      children: [new TextRun({ text: '25% on first hearing.' })],
    }),
    new Paragraph({
      numbering: { reference: 'fee-bullets', level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Irrespective of this fees structure, that may be adopted out of the aforestated options, the client shall be bound by the aforesaid payment structure.',
        }),
      ],
    }),
    new Paragraph({
      numbering: { reference: 'fee-bullets', level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'In addition to the aforesaid professional fees, the actual expenses shall be charged on actual basis over and above professional fees and shall be payable by the client immediately on raising the invoice quarterly.',
        }),
      ],
    }),
  ];
}

function createClientBullets(): Paragraph[] {
  const items = [
    'Provide all necessary information and documentation promptly.',
    'Communicate with us openly and honestly.',
    'Attend any required meetings, court appearances, or depositions.',
    'Make timely payments for our services as outlined above.',
  ];
  return items.map(
    (text) =>
      new Paragraph({
        numbering: { reference: 'client-bullets', level: 0 },
        spacing: { after: 100 },
        children: [new TextRun({ text })],
      })
  );
}

function createTerminationBullets(): Paragraph[] {
  const items = [
    'You may terminate our services at any time by providing 7 days advance written notice. In the event of termination by you, the firm shall not be responsible and liable for refund of any of the payments made to the firm.',
    'In the event of termination, we will provide reasonable notice and ensure that you have the opportunity to secure alternative representation.',
    'Upon termination, any unpaid fees or costs will be due immediately. We will return all original documents to you, and you may request copies of your case file for your records.',
  ];
  return items.map(
    (text) =>
      new Paragraph({
        numbering: { reference: 'termination-bullets', level: 0 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 150 },
        children: [new TextRun({ text })],
      })
  );
}
