const { HttpError } = require('../utils/HttpError');

/**
 * Live Embed mode.
 *
 * Fetches the target page server-side (stripping the framing-restriction
 * headers a browser would otherwise honor) and injects a small client-side
 * script so the page stays fully navigable *inside the iframe* instead of
 * breaking out to a bare cross-origin document the moment the visitor
 * touches a link, submits a form, or the page's own JS makes a background
 * request:
 *
 *   - <base href> so relative CSS/JS/image URLs resolve against the real
 *     origin.
 *   - A click/submit interceptor that rewrites same-page navigation back
 *     through this proxy, so it keeps rendering inside the slot.
 *   - A window.fetch / XMLHttpRequest override so SPA-style background
 *     requests are routed through /api/proxy-resource, which preserves
 *     interactive state changes triggered by touch (loading a tab,
 *     submitting a search box, paginating a table, etc.) without ever
 *     leaving the slot.
 *
 * This is a best-effort HTML-rewriting approach — it doesn't fix JS
 * frame-busting or sites that fingerprint navigation in unusual ways. For
 * those, use Interactive Remote Session instead (see README) — it renders
 * the target in a real headless browser and streams pixels, so nothing is
 * ever framed and no rewriting is needed.
 */

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NDHS-Monitoring-Portal-Proxy/1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

function assertValidUrl(targetUrl) {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    throw new HttpError(400, 'Missing or invalid "url" query parameter.');
  }
}

/** Pulls a few passthrough-safe headers from the visitor's own request so
 *  the upstream site sees a normal browser request (their real
 *  Accept-Language, etc.) while never forwarding cookies/auth meant for
 *  our own backend. */
function upstreamHeadersFrom(reqHeaders = {}) {
  return {
    'User-Agent': reqHeaders['user-agent'] || BROWSER_HEADERS['User-Agent'],
    Accept: reqHeaders['accept'] || BROWSER_HEADERS.Accept,
    'Accept-Language': reqHeaders['accept-language'] || BROWSER_HEADERS['Accept-Language']
  };
}

/** The injected interception script. Kept dependency-free and defensive —
 *  it runs inside arbitrary third-party pages, so a bug in it must never
 *  throw and break the host page. */
function buildInjectedScript() {
  return `
<script>(function(){
  var PROXY_PAGE = ${JSON.stringify('/api/proxy')};
  var PROXY_RESOURCE = ${JSON.stringify('/api/proxy-resource')};
  var ORIGIN = window.location.origin;
  var ABS_PROXY_PAGE = ORIGIN + PROXY_PAGE;
  var ABS_PROXY_RESOURCE = ORIGIN + PROXY_RESOURCE;

  function toAbsolute(url) {
    try { return new URL(url, document.baseURI).href; } catch (e) { return url; }
  }
  function isProxied(absUrl) {
    return absUrl.indexOf(ABS_PROXY_PAGE) === 0 || absUrl.indexOf(ABS_PROXY_RESOURCE) === 0;
  }
  function toResourceProxyUrl(url) {
    var abs = toAbsolute(url);
    if (isProxied(abs)) return abs;
    return ABS_PROXY_RESOURCE + '?url=' + encodeURIComponent(abs);
  }
  function toPageProxyUrl(url) {
    var abs = toAbsolute(url);
    if (isProxied(abs)) return abs;
    return ABS_PROXY_PAGE + '?url=' + encodeURIComponent(abs);
  }

  /* Each interceptor below is independently wrapped — a bug triggered by
     one page's unusual markup must not silently take the others down
     too (that's what made whole pages look "dead" to touch before). */

  try {
    /* ---- Link clicks: keep same-slot navigation inside the proxy ---- */
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href) return;
        if (/^(javascript:|mailto:|tel:|#)/i.test(href)) return;
        if (a.hasAttribute('download')) return;
        e.preventDefault();
        window.location.href = toPageProxyUrl(href);
      } catch (err) { console.warn('[ndhs-proxy] click interceptor error', err); }
    }, true);
  } catch (e) { console.warn('[ndhs-proxy] failed to attach click interceptor', e); }

  try {
    /* ---- Form submits: GET forms become a proxied navigation, POST
       forms are resubmitted (cloned, preserving field state) directly
       at the proxy so file uploads / multipart bodies still work. ---- */
    document.addEventListener('submit', function (e) {
      try {
        var form = e.target;
        if (!form || form.tagName !== 'FORM') return;
        e.preventDefault();
        var action = form.getAttribute('action') || document.baseURI;
        var absAction = toAbsolute(action);
        var method = (form.getAttribute('method') || 'GET').toUpperCase();

        if (method === 'GET') {
          var params = new URLSearchParams(new FormData(form));
          var qs = params.toString();
          var target = absAction.split('#')[0].split('?')[0] + (qs ? '?' + qs : '');
          window.location.href = ABS_PROXY_PAGE + '?url=' + encodeURIComponent(target);
          return;
        }

        var clone = form.cloneNode(true);
        var origEls = form.elements, cloneEls = clone.elements;
        for (var i = 0; i < origEls.length; i++) {
          var oe = origEls[i], ce = cloneEls[i];
          if (!oe || !ce) continue;
          if (oe.type === 'checkbox' || oe.type === 'radio') ce.checked = oe.checked;
          else if (oe.tagName === 'SELECT') ce.selectedIndex = oe.selectedIndex;
          else if (oe.type !== 'file') ce.value = oe.value;
        }
        clone.setAttribute('method', 'POST');
        clone.setAttribute('action', ABS_PROXY_PAGE + '?url=' + encodeURIComponent(absAction));
        clone.style.display = 'none';
        document.body.appendChild(clone);
        clone.submit();
      } catch (err) { console.warn('[ndhs-proxy] submit interceptor error', err); }
    }, true);
  } catch (e) { console.warn('[ndhs-proxy] failed to attach submit interceptor', e); }

  try {
    /* ---- Background fetch(): route through the resource proxy so
       SPA/dashboard-style state updates keep working from touch. ---- */
    var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        try {
          if (typeof input === 'string') return nativeFetch(toResourceProxyUrl(input), init);
          if (input && typeof input.url === 'string') {
            return nativeFetch(new Request(toResourceProxyUrl(input.url), input), init);
          }
        } catch (e) {}
        return nativeFetch(input, init);
      };
    }
  } catch (e) { console.warn('[ndhs-proxy] failed to override fetch', e); }

  try {
    /* ---- Background XHR: same idea as fetch above. ---- */
    var NativeXHR = window.XMLHttpRequest;
    if (NativeXHR) {
      window.XMLHttpRequest = function () {
        var xhr = new NativeXHR();
        var nativeOpen = xhr.open.bind(xhr);
        xhr.open = function (method, url) {
          var rest = Array.prototype.slice.call(arguments, 2);
          try { url = toResourceProxyUrl(url); } catch (e) {}
          return nativeOpen.apply(xhr, [method, url].concat(rest));
        };
        return xhr;
      };
    }
  } catch (e) { console.warn('[ndhs-proxy] failed to override XMLHttpRequest', e); }
})();</script>`;
}

/** Strips <meta http-equiv="Content-Security-Policy" ...> (and the
 *  legacy X-Content-Security-Policy/X-WebKit-CSP variants) from the
 *  fetched HTML. A page's own meta CSP tag is enforced by the browser
 *  regardless of what headers *we* send — many sites (government portals
 *  especially) ship one, and left in place it silently blocks our
 *  injected interceptor script from ever running, which makes every
 *  link/button look dead. We don't forward the upstream's CSP header
 *  either, for the same reason. */
function stripMetaCsp(html) {
  return html.replace(
    /<meta\s+[^>]*http-equiv=["']?(content-security-policy|x-content-security-policy|x-webkit-csp)["']?[^>]*>/gi,
    ''
  );
}

function injectIntoHead(html, targetUrl) {
  html = stripMetaCsp(html);
  const tags = `<base href="${targetUrl}">` + buildInjectedScript();
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${tags}`);
  }
  // No <head> — if there's at least an <html> tag, inject right after it
  // so the tags land inside the document instead of before it (browsers
  // relocate anything placed before <html> into <body>, which would
  // silently defeat the <base> tag and the interceptor script).
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${tags}</head>`);
  }
  return tags + html;
}

/** Friendly, styled placeholder shown *inside the slot* when a target
 *  fails to load — never raw JSON/stack traces, since this renders
 *  straight into an iframe a viewer is looking at on a live display. */
function renderErrorPage(message, status) {
  const safeMessage = String(message || 'The page could not be loaded.').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Unable to load</title>
<style>
  html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B1220;color:#E6EAF5;}
  .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:32px;box-sizing:border-box;}
  .icon{width:56px;height:56px;border-radius:50%;background:#1B2440;display:flex;align-items:center;justify-content:center;font-size:26px;}
  h1{font-size:16px;font-weight:800;margin:0;}
  p{font-size:13px;color:#8B96B8;margin:0;max-width:420px;line-height:1.5;}
  .code{font-size:11px;color:#4A5876;letter-spacing:.04em;text-transform:uppercase;}
</style></head>
<body><div class="wrap">
  <div class="icon">&#9888;</div>
  <h1>This source couldn't be loaded</h1>
  <p>${safeMessage}</p>
  <span class="code">${status ? 'HTTP ' + status : 'Proxy error'}</span>
</div></body></html>`;
}

/** Live Embed mode — full page load / navigation. Supports both the
 *  initial GET and the POST that the injected script issues on behalf of
 *  a form submit inside the framed page. */
async function fetchForEmbedding(targetUrl, { method = 'GET', reqHeaders = {}, body = null, bodyContentType = null } = {}) {
  assertValidUrl(targetUrl);

  const upstreamHeaders = upstreamHeadersFrom(reqHeaders);
  if (bodyContentType) upstreamHeaders['Content-Type'] = bodyContentType;

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : body,
      redirect: 'follow'
    });
  } catch (err) {
    return { contentType: 'text/html; charset=utf-8', body: renderErrorPage(err.message), status: 502 };
  }

  const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8';

  if (!upstream.ok && !contentType.includes('text/html')) {
    return { contentType: 'text/html; charset=utf-8', body: renderErrorPage('Upstream returned an error response.', upstream.status), status: upstream.status };
  }

  if (contentType.includes('text/html')) {
    let html;
    try {
      html = await upstream.text();
    } catch (err) {
      return { contentType: 'text/html; charset=utf-8', body: renderErrorPage(err.message), status: 502 };
    }
    return { contentType, body: injectIntoHead(html, targetUrl), status: upstream.status };
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  return { contentType, buffer, status: upstream.status };
}

/** Resource proxy — background fetch()/XHR calls made by the page after
 *  it has loaded. Pure passthrough: no HTML rewriting, just forwards
 *  method/headers/body and relays the response bytes + content-type/
 *  status back untouched, so JSON APIs, images, etc. all keep working. */
async function fetchResource(targetUrl, { method = 'GET', reqHeaders = {}, body = null, bodyContentType = null } = {}) {
  assertValidUrl(targetUrl);

  const upstreamHeaders = upstreamHeadersFrom(reqHeaders);
  if (bodyContentType) upstreamHeaders['Content-Type'] = bodyContentType;
  if (reqHeaders['x-requested-with']) upstreamHeaders['X-Requested-With'] = reqHeaders['x-requested-with'];

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : body,
      redirect: 'follow'
    });
  } catch (err) {
    throw new HttpError(502, 'Resource proxy fetch failed: ' + err.message);
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await upstream.arrayBuffer());
  return { contentType, buffer, status: upstream.status };
}

module.exports = { fetchForEmbedding, fetchResource, renderErrorPage };
