/** Turns free-typed input into a browsable URL. A bare domain/URL is used
 *  as-is; anything else is treated as a search query on DuckDuckGo, which
 *  tolerates automated browser traffic far better than Google for this
 *  kind of live demo use. */
export function toBrowseUrl(input) {
  const trimmed = input.trim();
  const looksLikeUrl = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed) && !trimmed.includes(' ');
  if (looksLikeUrl) return /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}
