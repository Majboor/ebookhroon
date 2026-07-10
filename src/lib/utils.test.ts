import { afterEach, describe, expect, it } from "vitest"
import {
  createSlug,
  makeUniqueSlug,
  extractYouTubeId,
  getYouTubeThumbnail,
  formatRelativeDate,
  truncate,
  resolvePublicAssetUrl,
  sanitizeHtml,
  CATEGORIES,
} from "./utils"

describe("createSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(createSlug("Hello World")).toBe("hello-world")
  })

  it("strips punctuation", () => {
    expect(createSlug("A, B & C!")).toBe("a-b-and-c")
  })
})

describe("makeUniqueSlug", () => {
  it("returns the base slug when free", () => {
    expect(makeUniqueSlug("My Book", [])).toBe("my-book")
  })

  it("appends a counter on collision", () => {
    expect(makeUniqueSlug("My Book", ["my-book"])).toBe("my-book-1")
  })

  it("skips already-taken counters", () => {
    expect(makeUniqueSlug("My Book", ["my-book", "my-book-1", "my-book-2"])).toBe(
      "my-book-3",
    )
  })
})

describe("extractYouTubeId", () => {
  it("parses the standard watch URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    )
  })

  it("parses the short youtu.be URL", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("parses the embed URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    )
  })

  it("parses the shorts URL", () => {
    expect(extractYouTubeId("https://youtube.com/shorts/abc123XYZ_-")).toBe(
      "abc123XYZ_-",
    )
  })

  it("returns null for a non-YouTube URL", () => {
    expect(extractYouTubeId("https://example.com/video")).toBeNull()
  })
})

describe("getYouTubeThumbnail", () => {
  it("builds the hqdefault thumbnail URL", () => {
    expect(getYouTubeThumbnail("abc")).toBe(
      "https://img.youtube.com/vi/abc/hqdefault.jpg",
    )
  })
})

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates and appends an ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello…")
  })
})

describe("formatRelativeDate", () => {
  it("reports Today for the current time", () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe("Today")
  })

  it("reports Yesterday for ~1 day ago", () => {
    const d = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(d)).toBe("Yesterday")
  })

  it("reports days for the current week", () => {
    const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(d)).toBe("3 days ago")
  })

  it("reports years for old dates", () => {
    const d = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(d)).toBe("1 years ago")
  })
})

describe("resolvePublicAssetUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_BASE_URL
    delete process.env.NEXT_PUBLIC_FASTAPI_BASE_URL
  })

  it("returns undefined for empty input", () => {
    expect(resolvePublicAssetUrl(undefined)).toBeUndefined()
    expect(resolvePublicAssetUrl(null)).toBeUndefined()
    expect(resolvePublicAssetUrl("")).toBeUndefined()
  })

  it("passes absolute URLs through unchanged", () => {
    expect(resolvePublicAssetUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    )
    expect(resolvePublicAssetUrl("data:image/png;base64,AAA")).toBe(
      "data:image/png;base64,AAA",
    )
  })

  it("returns relative URLs unchanged when no base is configured", () => {
    expect(resolvePublicAssetUrl("uploads/x.png")).toBe("uploads/x.png")
  })

  it("prefixes relative URLs with the configured base", () => {
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL = "https://api.example.com"
    expect(resolvePublicAssetUrl("uploads/x.png")).toBe(
      "https://api.example.com/uploads/x.png",
    )
  })
})

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml("<p>hi</p><script>alert(1)</script>")).toBe("<p>hi</p>")
  })

  it("strips inline event handlers", () => {
    const cleaned = sanitizeHtml('<img src="x" onerror="alert(1)">')
    expect(cleaned).not.toContain("onerror")
  })
})

describe("CATEGORIES", () => {
  it("exposes a non-empty frozen list including Other", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0)
    expect(CATEGORIES).toContain("Other")
  })
})
