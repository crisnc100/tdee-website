let dailyCount = 0;
let lastResetDate = new Date().toDateString();

export function incrementCounter(): number {
  const today = new Date().toDateString();
  
  // Reset counter if it's a new day
  if (lastResetDate !== today) {
    dailyCount = 0;
    lastResetDate = today;
  }
  
  dailyCount++;
  return dailyCount;
}

export function getTodaysCount(): number {
  const today = new Date().toDateString();
  
  // Reset counter if it's a new day
  if (lastResetDate !== today) {
    dailyCount = 0;
    lastResetDate = today;
  }
  
  return dailyCount;
}

// Helper function to generate realistic daily counts for demo
export function generateDemoCount(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
  
  // Simple pseudo-random number generator based on date
  let random = Math.sin(seed) * 10000;
  random = random - Math.floor(random);
  
  // Generate a number between 8,000 and 15,000
  return Math.floor(random * 7000) + 8000;
}