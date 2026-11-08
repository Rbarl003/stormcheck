// ============================================================
// StormCheck — share.js
// Share a message with a neighbor using a QR code. No internet needed:
// the QR code holds a StormCheck link with the message packed inside it.
// When the neighbor scans it, THEIR app re-checks the message on their
// own phone. The QR code carries the message, not the verdict, so nobody
// can make a fake "Verified" code.
// ============================================================

(function (root) {
  "use strict";

  const MAX_CHARS = 1000; // longer messages make QR codes too dense to scan

  // Text -> base64url (safe in a link, handles accents like ñ, è)
  function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(code) {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Build the link that goes inside the QR code
  function makeLink(baseUrl, text) {
    const shortened = text.length > MAX_CHARS;
    const body = shortened ? text.slice(0, MAX_CHARS) : text;
    return { url: baseUrl + "#c=" + toBase64Url(body), shortened };
  }

  // Read a shared message from the page address (returns null if none)
  function readFromHash(hash) {
    const m = /[#&]c=([A-Za-z0-9_-]+)/.exec(hash || "");
    if (!m) return null;
    try { return fromBase64Url(m[1]).slice(0, MAX_CHARS); } catch (e) { return null; }
  }

  // Draw a QR code matrix as an SVG image (crisp at any size)
  function svg(matrix) {
    const n = matrix.length, quiet = 4, size = n + quiet * 2;
    let path = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
      `<rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  }

  const api = { makeLink, readFromHash, svg, toBase64Url, fromBase64Url, MAX_CHARS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StormShare = api;
})(typeof self !== "undefined" ? self : this);
