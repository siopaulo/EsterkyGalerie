/**
 * Jednoduchá sanitizace HTML pro rich_text block.
 * Není to plnohodnotný sanitizer (nepoužíváme knihovnu), ale minimalizuje XSS
 * tím, že:
 *  - odstraňuje <script>, <style>, <iframe>, <object>, <embed>
 *  - odstraňuje on* atributy
 *  - odstraňuje javascript: v href/src
 *
 * Do editace přes admin nepouštíme nedůvěryhodné uživatele – přesto defenzivně.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  let out = input;

  // remove dangerous tags (with content)
  out = out.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // remove self-closing variants
  out = out.replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?>/gi, "");

  // remove event handlers
  out = out.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // neutralize javascript: URLs
  out = out.replace(/(href|src)\s*=\s*"(\s*javascript:[^"]*)"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'(\s*javascript:[^']*)'/gi, "$1='#'");

  return out;
}
