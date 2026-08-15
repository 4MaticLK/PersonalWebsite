export interface Certificate {
  name: string;
  issuer: string;
  date: string;
  /** PDF certificate to open in the viewer modal. Omit for a badge-only credential. */
  fileUrl?: string;
  /** Badge image to display directly on the card (e.g. a LinkedIn-style credential badge). */
  badgeImage?: string;
  verifyUrl?: string;
}

export const CERTIFICATES: Certificate[] = [
  {
    name: 'Bloomberg Market Concepts (BMC)',
    issuer: 'Bloomberg for Education',
    date: 'February 2023',
    fileUrl: '/pdfs/Bloomberg_Market_Concepts_Certificate.pdf',
  },
  {
    name: 'Essential Financial Modelling',
    issuer: 'Gridlines',
    date: 'August 2023',
    fileUrl: '/pdfs/Gridlines_Essential_Financial_Modelling_Certificate.pdf',
    verifyUrl: 'https://app.diplomasafe.com/en-US/s/d73c90e4/0284f780',
  },
  {
    name: 'Financial Markets',
    issuer: 'Yale University (Coursera)',
    date: 'August 2025',
    fileUrl: '/pdfs/Yale_Financial_Markets_Certificate.pdf',
    verifyUrl: 'https://coursera.org/verify/8O6LFF9A49DB',
  },
  {
    name: 'FMI Foundations',
    issuer: 'Financial Modeling Institute',
    date: 'April 2026',
    badgeImage: '/images/fmi-foundations-badge.png',
  },
];
