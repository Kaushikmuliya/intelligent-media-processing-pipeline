/**
 * Indian Vehicle Plate Analyzer
 *
 * Strategy:
 *   1. Split OCR text into candidate tokens (words, lines, and
 *      sliding windows of 2–3 adjacent tokens) rather than matching
 *      against one giant concatenated string.
 *   2. Apply OCR confusion correction on each candidate before matching
 *      (e.g. O↔0, I↔1, S↔5, B↔8).
 *   3. Try the strict regex first. If it matches, return immediately.
 *   4. If no strict match, try a lenient regex that allows 1–3 chars in
 *      the series position to catch partial OCR drops.
 *   5. Score every candidate and return the best one with a confidence
 *      indicator so the caller knows how certain the result is.
 *
 * Supported plate formats:
 *   Standard: <STATE(2)><DIST(2)><SERIES(1-3)><NUM(4)>
 *             e.g. MH12AB1234, KA05C9999, DL1CAB1234
 *   BH series: <YEAR(2)>BH<NUM(4)><SERIES(2)>
 *             e.g. 22BH1234AA
 */

// All 36 Indian state / UT registration prefixes
const STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN",
  "GA", "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD",
  "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ",
  "SK", "TN", "TR", "TS", "UK", "UP", "WB",
];

const STATE_PATTERN = STATE_CODES.join("|");

// Standard format: STATE(2) + DIST(2) + SERIES(1-3 alpha) + NUM(4)
const STRICT_REGEX = new RegExp(
  `^(${STATE_PATTERN})(\\d{2})([A-Z]{1,3})(\\d{4})$`
);

// Lenient: allows 1-digit district and 1-4 digit number for partial reads
const LENIENT_REGEX = new RegExp(
  `(${STATE_PATTERN})(\\d{1,2})([A-Z]{1,3})(\\d{1,4})`
);

// BH (Bharat) series: YY + BH + 4 digits + 2 alpha
const BH_REGEX = /^(\d{2})BH(\d{4})([A-Z]{2})$/;

/**
 * OCR confusion map — maps commonly misread characters to their correct form.
 * Applied in both directions: when correcting digits in alpha positions and
 * alpha in digit positions.
 */
const ALPHA_TO_DIGIT = { O: "0", I: "1", L: "1", S: "5", B: "8", G: "6", Z: "2", T: "7" };
const DIGIT_TO_ALPHA = { 0: "O", 1: "I", 5: "S", 8: "B", 6: "G", 2: "Z" };

/**
 * Corrects OCR confusion errors in a candidate string that has already
 * been stripped to alphanumeric uppercase.
 *
 * Indian plate structure is well-defined, so we know exactly which
 * positions should be alpha and which should be digits.
 * For a standard plate of length 9-10:
 *   [0-1]   = state code  → alpha
 *   [2-3]   = district    → digit
 *   [4-6]   = series      → alpha (1-3 chars)
 *   [7-10]  = number      → digit (4 chars)
 */
const correctOcrConfusion = (candidate) => {
  // First pass: try to detect structure and fix per-position
  const len = candidate.length;
  if (len < 8 || len > 11) return candidate; // not plate-shaped, skip

  // Positions 0-1: must be alpha (state code)
  let result = "";
  result += candidate[0].replace(/[0-9]/, (d) => DIGIT_TO_ALPHA[d] || d);
  result += candidate[1].replace(/[0-9]/, (d) => DIGIT_TO_ALPHA[d] || d);

  // Positions 2-3: must be digits (district)
  result += candidate[2].replace(/[A-Z]/, (c) => ALPHA_TO_DIGIT[c] || c);
  result += candidate[3].replace(/[A-Z]/, (c) => ALPHA_TO_DIGIT[c] || c);

  // Remaining characters: alternating alpha block then digit block
  const rest = candidate.slice(4);

  // Find where the trailing 4-digit number starts by scanning from the right
  let numStart = rest.length;
  let digitCount = 0;
  for (let i = rest.length - 1; i >= 0 && digitCount < 4; i--) {
    const corrected = rest[i].replace(/[A-Z]/, (c) => ALPHA_TO_DIGIT[c] || c);
    if (/\d/.test(corrected)) {
      digitCount++;
      numStart = i;
    } else {
      break;
    }
  }

  const seriesPart = rest.slice(0, numStart);
  const numPart = rest.slice(numStart);

  // Series: fix digit-in-alpha-position
  for (const ch of seriesPart) {
    result += ch.replace(/[0-9]/, (d) => DIGIT_TO_ALPHA[d] || d);
  }

  // Number: fix alpha-in-digit-position
  for (const ch of numPart) {
    result += ch.replace(/[A-Z]/, (c) => ALPHA_TO_DIGIT[c] || c);
  }

  return result;
};

/**
 * Score a candidate match — used to rank multiple candidates when several
 * partial matches are found. Higher is better.
 */
const scorePlate = (plate, matchType) => {
  let score = 0;
  if (matchType === "strict") score += 100;
  else if (matchType === "bh") score += 90;
  else if (matchType === "lenient") score += 50;

  // Bonus for expected length (standard plate is 9–10 chars)
  if (plate.length >= 9 && plate.length <= 10) score += 20;

  // Bonus for recognised state code at the start
  const prefix = plate.slice(0, 2);
  if (STATE_CODES.includes(prefix)) score += 30;

  return score;
};

/**
 * Generate candidate strings from OCR output.
 * Works on individual words, lines, and sliding windows of 2–3 tokens
 * to handle plates where Tesseract inserted spaces inside the plate text.
 */
const generateCandidates = (ocrText) => {
  const candidates = new Set();

  // Clean and split into tokens
  const tokens = ocrText
    .toUpperCase()
    .split(/[\s\n\r,.|_\-:;]+/)
    .map((t) => t.replace(/[^A-Z0-9]/g, ""))
    .filter((t) => t.length >= 2);

  // Individual tokens
  for (const token of tokens) {
    candidates.add(token);
  }

  // Sliding window: join 2 adjacent tokens
  for (let i = 0; i < tokens.length - 1; i++) {
    candidates.add(tokens[i] + tokens[i + 1]);
  }

  // Sliding window: join 3 adjacent tokens
  for (let i = 0; i < tokens.length - 2; i++) {
    candidates.add(tokens[i] + tokens[i + 1] + tokens[i + 2]);
  }

  // Also try the fully concatenated string for regex scanning
  const fullConcat = [...tokens].join("");
  if (fullConcat.length > 0) candidates.add(fullConcat);

  return [...candidates];
};

/**
 * Try all match strategies on a single candidate string.
 * Returns { plate, matchType, score } or null.
 */
const tryMatch = (raw) => {
  const corrected = correctOcrConfusion(raw);
  const variants = [...new Set([raw, corrected])];

  for (const variant of variants) {
    // BH series
    const bhMatch = variant.match(BH_REGEX);
    if (bhMatch) {
      return { plate: bhMatch[0], matchType: "bh", score: scorePlate(bhMatch[0], "bh") };
    }

    // Strict standard
    const strictMatch = variant.match(STRICT_REGEX);
    if (strictMatch) {
      return { plate: strictMatch[0], matchType: "strict", score: scorePlate(strictMatch[0], "strict") };
    }

    // Lenient — scan for embedded plate in longer string
    const lenientMatch = variant.match(LENIENT_REGEX);
    if (lenientMatch) {
      return { plate: lenientMatch[0], matchType: "lenient", score: scorePlate(lenientMatch[0], "lenient") };
    }
  }

  return null;
};

const analyzePlate = (ocrText) => {
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      detectedPlate: null,
      isValid: false,
      matchType: null,
      confidence: "none",
      candidates: [],
    };
  }

  const candidates = generateCandidates(ocrText);
  const results = [];

  for (const candidate of candidates) {
    const match = tryMatch(candidate);
    if (match) results.push(match);
  }

  if (results.length === 0) {
    return {
      detectedPlate: null,
      isValid: false,
      matchType: null,
      confidence: "none",
      candidates: [],
    };
  }

  // Pick the highest-scoring result
  results.sort((a, b) => b.score - a.score);
  const best = results[0];

  // Deduplicate candidates list for the response
  const uniquePlates = [...new Set(results.map((r) => r.plate))];

  return {
    detectedPlate: best.plate,
    isValid: best.matchType === "strict" || best.matchType === "bh",
    matchType: best.matchType,
    // confidence: high = strict/BH match, medium = lenient match
    confidence: best.matchType === "strict" || best.matchType === "bh"
      ? "high"
      : "medium",
    candidates: uniquePlates,
  };
};

module.exports = analyzePlate;
