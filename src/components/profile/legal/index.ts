import { about } from './about';
import { cookies } from './cookies';
import { csae } from './csae';
import { guidelines } from './guidelines';
import { policy } from './policy';
import { terms } from './terms';
import type { LegalDoc } from './types';

export const legalDocs = { terms, policy, cookies, csae, guidelines, about } satisfies Record<
  string,
  LegalDoc
>;

export type LegalSlug = keyof typeof legalDocs;

export const legalSlugs = Object.keys(legalDocs) as LegalSlug[];

export const isLegalSlug = (s: string): s is LegalSlug => s in legalDocs;
