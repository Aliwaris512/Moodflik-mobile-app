export type LegalBlock =
  { t: 'h'; text: string } | { t: 'p'; text: string } | { t: 'list'; items: string[] };

export type LegalDoc = { title: string; blocks: LegalBlock[] };
