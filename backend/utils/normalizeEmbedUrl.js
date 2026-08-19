/** Some platforms block their normal page from being framed but publish a
 *  dedicated, officially-embeddable player URL. Detect and rewrite to that
 *  instead of relying on the proxy (which can't fix these — see README). */
function normalizeEmbedUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v');
      if (id) return { url: `https://www.youtube.com/embed/${id}`, note: "Converted to YouTube's official embeddable player URL." };
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return { url: `https://www.youtube.com/embed/${id}`, note: "Converted to YouTube's official embeddable player URL." };
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return { url: `https://player.vimeo.com/video/${id}`, note: "Converted to Vimeo's official embeddable player URL." };
    }
    return { url: rawUrl, note: null };
  } catch {
    return { url: rawUrl, note: null };
  }
}

module.exports = { normalizeEmbedUrl };
