// lib/quick-performance-score.ts
export function quickPerfScore({
  htmlKb,
  domNodes,
  avgImageKb,
}: {
  htmlKb: number;
  domNodes: number;
  avgImageKb: number;
}) {
  // Crude but fast: smaller is better
  const htmlPenalty   = Math.min(htmlKb / 50, 1);      // ≥50 kB = full penalty
  const domPenalty    = Math.min(domNodes / 1500, 1);  // ≥1500 nodes = full penalty
  const imagePenalty  = Math.min(avgImageKb / 200, 1); // ≥200 kB avg = full penalty

  const raw           = 1 - (0.4*htmlPenalty + 0.3*domPenalty + 0.3*imagePenalty);
  return Math.round(raw * 100); // 0-100 score
} 