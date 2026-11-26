const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Well-known mailbox providers. A domain that is a near-miss of one of these (gamail.com, gmial.com,
// yaho.com) is almost certainly a typo; exact matches and unrelated company domains pass.
const KNOWN_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.in",
  "yahoo.co.in",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "mail.com",
  "email.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "rediffmail.com",
];

// Common misspellings of ".com" that are not real top-level domains.
const BAD_TLDS = ["con", "cmo", "ocm", "comm", "coom", "vom", "xom"];

const distance = (a: string, b: string) => {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
};

/** Why an email is unacceptable, or null when it looks fine. Catches bad format and common domain typos. */
export const emailError = (value: string): string | null => {
  const email = value.trim().toLowerCase();
  if (!EMAIL.test(email)) return "Enter a valid email, e.g. name@gmail.com";
  const domain = email.split("@")[1]!;
  if (KNOWN_DOMAINS.includes(domain)) return null;
  const suggestion = KNOWN_DOMAINS.find((d) => distance(domain, d) <= 2);
  if (suggestion) return `Invalid email domain — did you mean ${suggestion}?`;
  const tld = domain.split(".").pop()!;
  if (BAD_TLDS.includes(tld)) {
    return `Invalid email domain ".${tld}" — did you mean ".com"?`;
  }
  return null;
};

// Letters (any script) with single spaces, dots, apostrophes or hyphens between them — no digits or symbols.
const NAME = /^\p{L}+(?:[ .'-]+\p{L}+)*\.?$/u;
/** Characters stripped from name fields as the user types. */
export const NAME_INVALID_CHARS = /[^\p{L} .'-]/gu;

/** Why a name (staff, vendor) is unacceptable, or null when it looks fine. */
export const nameError = (value: string, label: string): string | null => {
  const name = value.trim();
  if (!name) return `${label} is required`;
  if (!NAME.test(name)) return `${label} can only contain letters, spaces, dots, apostrophes and hyphens`;
  return null;
};
