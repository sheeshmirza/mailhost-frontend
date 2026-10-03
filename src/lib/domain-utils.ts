/**
 * domain-utils.ts
 *
 * Shared utilities for enforcing the "emails can only be sent from
 * registered + verified domains" rule on the frontend.
 *
 * The backend is the authoritative source of truth and also validates
 * every send. These helpers provide consistent, early client-side feedback.
 */

import { DomainView } from "@/lib/api";

/** Returns only domains with status === "verified". */
export function getVerifiedDomains(domains: DomainView[]): DomainView[] {
  return domains.filter((d) => d.status === "verified");
}

/**
 * Extracts the domain part from an email address (supports "name <email@domain>" as well as "email@domain").
 * Returns an empty string if the address has no "@".
 */
export function domainOfEmail(email: string): string {
  if (!email) return "";
  const match = email.match(/<([^>]+)>/);
  const raw = (match ? match[1] : email).trim();
  const at = raw.lastIndexOf("@");
  return at >= 0 ? raw.slice(at + 1).toLowerCase() : "";
}

/**
 * Builds a standardized RFC 5322 sender address from prefix, domain, and optional display name.
 */
export function buildSenderAddress(prefix: string, domain: string, name?: string): string {
  const cleanPrefix = prefix.trim().replace(/@.*$/, "") || "notifications";
  const cleanDomain = domain.trim().toLowerCase();
  if (!cleanDomain) return "";
  const namePart = name?.trim() ? `"${name.trim()}" ` : "";
  return namePart ? `${namePart}<${cleanPrefix}@${cleanDomain}>` : `${cleanPrefix}@${cleanDomain}`;
}

/**
 * Validates that at least one verified domain exists and that the sender
 * address belongs to one of those verified domains.
 *
 * Throws an Error with a human-readable message on any violation.
 * Returns silently if everything is valid.
 */
export function assertVerifiedSender(
  verifiedDomains: DomainView[],
  from: string
): void {
  if (verifiedDomains.length === 0) {
    throw new Error(
      "No verified domains found. Please add and verify your domain before sending emails."
    );
  }
  const emailDomain = domainOfEmail(from);
  if (!emailDomain || !verifiedDomains.some((d) => d.name.toLowerCase() === emailDomain)) {
    throw new Error(
      `The domain "${emailDomain || "unknown"}" is not verified yet. Emails can only be sent from domains you have added and verified.`
    );
  }
}

/**
 * Like assertVerifiedSender but for a list of sender addresses (batch sends).
 * Reports which address failed and at which index.
 */
export function assertVerifiedSenders(
  verifiedDomains: DomainView[],
  froms: { index: number; from: string }[]
): void {
  if (verifiedDomains.length === 0) {
    throw new Error(
      "No verified domains found. Please add and verify your domain before sending emails."
    );
  }
  for (const { index, from } of froms) {
    const emailDomain = domainOfEmail(from);
    if (!emailDomain || !verifiedDomains.some((d) => d.name.toLowerCase() === emailDomain)) {
      throw new Error(
        `Email #${index + 1} sender domain "${emailDomain || "unknown"}" is not verified yet.`
      );
    }
  }
}
