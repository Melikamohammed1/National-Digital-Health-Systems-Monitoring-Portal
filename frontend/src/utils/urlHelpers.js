/** Turns free-typed input into a browsable URL. A bare domain/URL is used
 *  as-is; anything else is treated as a search query. Defaults to
 *  DuckDuckGo rather than Google — it tolerates automated/headless
 *  browser traffic far better, so live demo sessions are much less likely
 *  to hit a CAPTCHA or bot-detection wall mid-demonstration. */
export function toBrowseUrl(input) {
  const trimmed = input.trim();
  const looksLikeUrl = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed) && !trimmed.includes(' ');
  if (looksLikeUrl) return /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}