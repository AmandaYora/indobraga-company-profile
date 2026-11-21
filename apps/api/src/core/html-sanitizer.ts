import { FilterXSS, type IFilterXSSOptions } from "xss";

/**
 * Allow-list sanitiser for admin-authored email HTML (templates and campaigns).
 *
 * QA IB-02: HTML typed into "Kirim Email" / "Kelola Template" used to be stored
 * verbatim and rendered with innerHTML in the admin panel, so an `onerror=`
 * handler ran in other admins' sessions. Stripping scripts, event handlers and
 * dangerous URL schemes here means neither the database nor the outgoing email
 * ever contains active content. The admin UI additionally renders previews inside
 * a sandboxed iframe as a second layer.
 *
 * `{{variable}}` placeholders are plain text and survive untouched.
 */

const GLOBAL_ATTRIBUTES = ["style", "class", "align", "valign", "dir", "lang", "title"];

const TAG_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "name", "target", "rel"],
  abbr: [],
  b: [],
  blockquote: [],
  br: [],
  caption: [],
  center: [],
  code: [],
  col: ["span", "width"],
  colgroup: ["span", "width"],
  dd: [],
  div: [],
  dl: [],
  dt: [],
  em: [],
  font: ["color", "face", "size"],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  hr: [],
  i: [],
  img: ["src", "alt", "width", "height"],
  li: [],
  mark: [],
  ol: [],
  p: [],
  pre: [],
  s: [],
  small: [],
  span: [],
  strike: [],
  strong: [],
  sub: [],
  sup: [],
  table: ["border", "cellpadding", "cellspacing", "width", "bgcolor"],
  tbody: [],
  td: ["colspan", "rowspan", "width", "height", "bgcolor"],
  tfoot: [],
  th: ["colspan", "rowspan", "width", "height", "bgcolor", "scope"],
  thead: [],
  tr: ["bgcolor"],
  u: [],
  ul: [],
};

const whiteList: NonNullable<IFilterXSSOptions["whiteList"]> = Object.fromEntries(
  Object.entries(TAG_ATTRIBUTES).map(([tag, attributes]) => [
    tag,
    [...attributes, ...GLOBAL_ATTRIBUTES],
  ]),
);

const filter = new FilterXSS({
  whiteList,
  // Remove disallowed tags entirely (keep their text), but drop the *content* of
  // tags that must never leak into an email body.
  stripIgnoreTag: true,
  // `embed` is a void tag with no body, so stripIgnoreTag alone removes it cleanly.
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "textarea", "noscript"],
  // Comments (including conditional comments) are not needed and can hide payloads.
  allowCommentTag: false,
  // Links/images may only use http(s)/mailto/tel (and relative/#anchors) - the
  // library's default `safeAttrValue` already rejects javascript:/vbscript:/data:text.
});

export function sanitizeEmailHtml(html: string): string {
  return filter.process(html).trim();
}

/** Same as {@link sanitizeEmailHtml} but passes through null/undefined. */
export function sanitizeOptionalEmailHtml<T extends string | null | undefined>(html: T): T {
  if (typeof html !== "string") {
    return html;
  }

  return sanitizeEmailHtml(html) as T;
}
