const STORAGE_KEY = 'portfolio-suggestions-admin-token';

export function getStoredAdminToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeAdminToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredAdminToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function adminAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
