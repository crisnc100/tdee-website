// Deterministic per-day number shown as "calculations today"; not a real count.
export function generateDemoCount(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();

  let random = Math.sin(seed) * 10000;
  random = random - Math.floor(random);

  // Between 8,000 and 15,000
  return Math.floor(random * 7000) + 8000;
}
