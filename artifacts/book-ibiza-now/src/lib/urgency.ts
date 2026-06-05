export function tablesLeftToday(): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rand = ((seed * 1103515245 + 12345) & 0x7fffffff) % 100;
  return (rand % 7) + 2;
}

export function isUrgent(count: number): boolean {
  return count <= 3;
}
