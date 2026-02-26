const KEY = "login_return";

/** Save the current page so LoginPage can redirect back after auth */
export function saveLoginReturn(page: string, data?: any) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ page, data }));
  } catch { /* ignore */ }
}
