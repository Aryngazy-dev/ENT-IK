function tokens(value: string): Set<string> { return new Set(value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length > 2)); }
export function tokenSimilarity(left: string, right: string): number { const a = tokens(left); const b = tokens(right); const union = new Set([...a, ...b]); if (!union.size) return 0; return [...a].filter((word) => b.has(word)).length / union.size; }
export function isLikelyDuplicate(left: string, right: string, threshold = .45): boolean { return tokenSimilarity(left, right) >= threshold; }
