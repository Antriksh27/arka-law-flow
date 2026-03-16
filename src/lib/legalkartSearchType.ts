export type LegalkartSearchType =
  | 'high_court'
  | 'district_court'
  | 'supreme_court'
  | 'gujarat_high_court';

export const normalizeLegalkartCnr = (cnr?: string | null): string =>
  (cnr ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export const resolveLegalkartSearchType = ({
  cnr,
  courtType,
  fallback = 'district_court',
}: {
  cnr?: string | null;
  courtType?: string | null;
  fallback?: LegalkartSearchType;
}): LegalkartSearchType => {
  const normalizedCnr = normalizeLegalkartCnr(cnr);

  if (normalizedCnr.startsWith('SCIN')) return 'supreme_court';
  if (normalizedCnr.startsWith('GJHC') || normalizedCnr.includes('GJHC')) return 'gujarat_high_court';
  if (normalizedCnr.length >= 4 && normalizedCnr.substring(2, 4) === 'HC') return 'high_court';

  const normalizedCourtType = (courtType ?? '').toLowerCase();
  if (normalizedCourtType.includes('gujarat')) return 'gujarat_high_court';
  if (normalizedCourtType.includes('supreme')) return 'supreme_court';
  if (normalizedCourtType.includes('district')) return 'district_court';
  if (normalizedCourtType.includes('high')) return 'high_court';

  return fallback;
};
