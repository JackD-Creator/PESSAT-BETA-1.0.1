export function getCurrentUserId(): string | null {
  try {
    const stored = localStorage.getItem('livestock_user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user?.id || null;
  } catch {
    return null;
  }
}
