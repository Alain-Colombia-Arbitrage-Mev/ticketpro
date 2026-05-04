const POSTGREST_SEARCH_MAX_LENGTH = 100;

/**
 * PostgREST `.or()` receives raw filter syntax. Keep search terms as plain text
 * so user input cannot alter the filter expression or inject wildcards.
 */
export function sanitizePostgrestSearchTerm(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s@._+\-/#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, POSTGREST_SEARCH_MAX_LENGTH);
}
