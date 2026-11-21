import { sanitizeEmailHtml, sanitizeOptionalEmailHtml } from "@/core/html-sanitizer";

describe("sanitizeEmailHtml (QA IB-02)", () => {
  it("strips event-handler attributes - the exact payload from the QA report", () => {
    const html = sanitizeEmailHtml("<img src=x onerror=window.__qaXss=1>");

    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toContain("__qaXss");
  });

  it("removes script blocks including their content", () => {
    const html = sanitizeEmailHtml("<p>Halo</p><script>alert(1)</script>");

    expect(html).toBe("<p>Halo</p>");
  });

  it("removes dangerous containers entirely", () => {
    expect(sanitizeEmailHtml('<iframe src="//evil.example"></iframe><p>ok</p>')).toBe("<p>ok</p>");
    expect(sanitizeEmailHtml("<svg onload=alert(1)><circle/></svg>")).not.toMatch(/onload|<svg/i);
    expect(sanitizeEmailHtml('<object data="x"></object><embed src="x">')).toBe("");
    expect(sanitizeEmailHtml("<style>body{display:none}</style><p>ok</p>")).toBe("<p>ok</p>");
  });

  it("blocks javascript: URLs but keeps safe links", () => {
    const html = sanitizeEmailHtml(
      '<a href="javascript:alert(1)">x</a><a href="https://indobraga.com">y</a>',
    );

    expect(html).not.toMatch(/javascript:/i);
    expect(html).toContain('href="https://indobraga.com"');
  });

  it("neutralises javascript: inside inline styles", () => {
    const html = sanitizeEmailHtml('<p style="background:url(javascript:alert(1))">x</p>');

    expect(html).not.toMatch(/javascript:/i);
  });

  it("drops comments", () => {
    expect(sanitizeEmailHtml("<p>a</p><!-- <script>x</script> -->")).toBe("<p>a</p>");
  });

  it("keeps ordinary email layout and {{variables}} intact", () => {
    const source =
      '<table border="0" width="100%"><tr><td bgcolor="#fff"><h1>Halo {{nama}}</h1>' +
      '<p style="color:#111">Terima kasih, <b>{{perusahaan}}</b></p></td></tr></table>';

    const html = sanitizeEmailHtml(source);

    expect(html).toContain("{{nama}}");
    expect(html).toContain("{{perusahaan}}");
    expect(html).toContain("<table");
    expect(html).toContain("<h1>");
    expect(html).toContain("<b>");
    expect(html).toContain("color:#111");
  });

  it("passes null/undefined through the optional helper", () => {
    expect(sanitizeOptionalEmailHtml(null)).toBeNull();
    expect(sanitizeOptionalEmailHtml(undefined)).toBeUndefined();
    expect(sanitizeOptionalEmailHtml("<p onclick=x>a</p>")).toBe("<p>a</p>");
  });
});
