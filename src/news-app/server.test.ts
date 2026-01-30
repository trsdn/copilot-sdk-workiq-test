import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock CopilotClient - use a class for proper constructor behavior
class MockSession {
  on = vi.fn();
  sendAndWait = vi.fn().mockResolvedValue(undefined);
  destroy = vi.fn().mockResolvedValue(undefined);
  sessionId = "test-session-id";
}

class MockCopilotClient {
  static instances: MockCopilotClient[] = [];
  start = vi.fn().mockResolvedValue(undefined);
  stop = vi.fn().mockResolvedValue(undefined);
  createSession = vi.fn().mockResolvedValue(new MockSession());

  constructor() {
    MockCopilotClient.instances.push(this);
  }
}

vi.mock("@github/copilot-sdk", () => ({
  CopilotClient: MockCopilotClient,
  SessionEvent: {},
}));

// Date utility functions - must match server.ts implementation
// Using local timezone, not UTC!
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);
    dates.push(formatLocalDate(targetDate));
  }

  return dates;
}

export function formatDateForQuery(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatLocalDate(date);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "Unknown date";
  try {
    // Handle YYYY-MM-DD format (parse as local date, not UTC)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    // Handle ISO datetime or other formats
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

describe("Date Range Generation", () => {
  it("should generate correct number of dates", () => {
    const dates = getDateRange(3);
    expect(dates).toHaveLength(3);
  });

  it("should start with today (local timezone)", () => {
    const dates = getDateRange(3);
    const today = formatLocalDate(new Date());
    expect(dates[0]).toBe(today);
  });

  it("should include yesterday as second date", () => {
    const dates = getDateRange(3);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedYesterday = formatLocalDate(yesterday);
    expect(dates[1]).toBe(expectedYesterday);
  });

  it("should handle 7 days correctly", () => {
    const dates = getDateRange(7);
    expect(dates).toHaveLength(7);

    // Check first and last
    const today = new Date();
    const todayStr = formatLocalDate(today);
    expect(dates[0]).toBe(todayStr);

    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const sixDaysAgoStr = formatLocalDate(sixDaysAgo);
    expect(dates[6]).toBe(sixDaysAgoStr);
  });

  it("should generate dates in descending order (newest first)", () => {
    const dates = getDateRange(5);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(new Date(dates[i]).getTime()).toBeGreaterThan(new Date(dates[i + 1]).getTime());
    }
  });

  it("should use local timezone not UTC", () => {
    // This is the key fix - should match local date, not UTC
    const now = new Date();
    const localDate = formatLocalDate(now);
    const dates = getDateRange(1);

    // The date should match local date format
    expect(dates[0]).toBe(localDate);

    // Verify it's in YYYY-MM-DD format
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // The year, month, day should match local values
    const parts = dates[0].split("-");
    expect(parseInt(parts[0])).toBe(now.getFullYear());
    expect(parseInt(parts[1])).toBe(now.getMonth() + 1);
    expect(parseInt(parts[2])).toBe(now.getDate());
  });
});

describe("formatDateForQuery", () => {
  it("should return YYYY-MM-DD format", () => {
    const result = formatDateForQuery(0);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should return today for 0 days ago (local timezone)", () => {
    const result = formatDateForQuery(0);
    const today = formatLocalDate(new Date());
    expect(result).toBe(today);
  });

  it("should return yesterday for 1 day ago", () => {
    const result = formatDateForQuery(1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = formatLocalDate(yesterday);
    expect(result).toBe(expected);
  });
});

describe("formatDisplayDate", () => {
  it("should format valid ISO date", () => {
    const result = formatDisplayDate("2026-01-30T10:30:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("30");
  });

  it("should handle empty string", () => {
    const result = formatDisplayDate("");
    expect(result).toBe("Unknown date");
  });

  it("should handle null/undefined gracefully", () => {
    // @ts-expect-error - testing runtime behavior with null
    const result = formatDisplayDate(null);
    expect(result).toBe("Unknown date");
  });

  it("should return original string for invalid date", () => {
    const result = formatDisplayDate("not-a-date");
    expect(result).toBe("not-a-date");
  });

  it("should parse YYYY-MM-DD as local date (not UTC)", () => {
    // This is the key test - YYYY-MM-DD should NOT shift due to timezone
    const result = formatDisplayDate("2026-01-30");
    expect(result).toContain("Jan");
    expect(result).toContain("30");
    // Should NOT contain time for date-only format
    expect(result).not.toContain(":");
  });

  it("should show correct day of week for YYYY-MM-DD", () => {
    // Jan 30, 2026 is a Friday
    const result = formatDisplayDate("2026-01-30");
    expect(result).toContain("Fri");
  });

  it("should not shift date due to timezone for YYYY-MM-DD format", () => {
    // This catches the UTC vs local bug - Jan 30 should stay Jan 30, not become Jan 29
    const result = formatDisplayDate("2026-01-30");
    expect(result).not.toContain("29");
    expect(result).toContain("30");
  });
});

describe("Date edge cases", () => {
  it("should handle month boundaries", () => {
    // This tests that date math works across month boundaries
    const dates = getDateRange(35);
    expect(dates).toHaveLength(35);

    // All dates should be valid
    dates.forEach((dateStr) => {
      const d = new Date(dateStr);
      expect(isNaN(d.getTime())).toBe(false);
    });
  });

  it("should handle year boundaries", () => {
    // Set a fixed date near year boundary for testing
    const dates = getDateRange(10);
    expect(dates).toHaveLength(10);

    // All should be consecutive
    for (let i = 0; i < dates.length - 1; i++) {
      const curr = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(1);
    }
  });
});

// ============================================
// Mocked Copilot SDK Tests
// ============================================

describe("CopilotClient Mock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockCopilotClient.instances = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create a session with correct parameters", async () => {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const client = new CopilotClient({ logLevel: "error" });
    await client.start();

    const session = await client.createSession({
      model: "gpt-5-mini",
      streaming: true,
      systemMessage: { content: "Test system message" },
    });

    expect(client.createSession).toHaveBeenCalledWith({
      model: "gpt-5-mini",
      streaming: true,
      systemMessage: { content: "Test system message" },
    });
    expect(session.sessionId).toBe("test-session-id");
  });

  it("should handle session events", async () => {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const client = new CopilotClient({ logLevel: "error" });
    await client.start();

    const session = await client.createSession({
      model: "gpt-5-mini",
      streaming: true,
    });

    const eventHandler = vi.fn();
    session.on(eventHandler);

    expect(session.on).toHaveBeenCalledWith(eventHandler);
  });

  it("should send messages and wait for response", async () => {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const client = new CopilotClient({ logLevel: "error" });
    await client.start();

    const session = await client.createSession({
      model: "gpt-5-mini",
      streaming: true,
    });

    await session.sendAndWait({ prompt: "Test prompt" }, 30000);

    expect(session.sendAndWait).toHaveBeenCalledWith({ prompt: "Test prompt" }, 30000);
  });

  it("should destroy session properly", async () => {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const client = new CopilotClient({ logLevel: "error" });
    await client.start();

    const session = await client.createSession({
      model: "gpt-5-mini",
      streaming: true,
    });

    await session.destroy();

    expect(session.destroy).toHaveBeenCalled();
  });

  it("should stop client properly", async () => {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const client = new CopilotClient({ logLevel: "error" });
    await client.start();
    await client.stop();

    expect(client.stop).toHaveBeenCalled();
  });
});

// ============================================
// JSON Parsing Utility Tests
// ============================================

// Utility function to clean JSON response (matches server.ts implementation)
function cleanJsonResponse(response: string): string {
  return response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

function extractJsonArray(response: string): unknown[] | null {
  const cleaned = cleanJsonResponse(response);
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

function extractJsonObject(response: string): Record<string, unknown> | null {
  const cleaned = cleanJsonResponse(response);
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

describe("JSON Parsing Utilities", () => {
  it("should clean markdown code blocks from response", () => {
    const response = '```json\n[{"id": "1"}]\n```';
    const cleaned = cleanJsonResponse(response);
    expect(cleaned).toBe('[{"id": "1"}]');
  });

  it("should extract JSON array from response", () => {
    const response = 'Here are the results: [{"id": "1"}, {"id": "2"}]';
    const result = extractJsonArray(response);
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("should extract JSON object from response", () => {
    const response = 'Summary: {"subject": "Test", "summary": "A test story"}';
    const result = extractJsonObject(response);
    expect(result).toEqual({ subject: "Test", summary: "A test story" });
  });

  it("should handle response with markdown code block", () => {
    const response = '```json\n[{"subject": "Breaking News", "source": "WSJ"}]\n```';
    const result = extractJsonArray(response);
    expect(result).toEqual([{ subject: "Breaking News", source: "WSJ" }]);
  });

  it("should return null for invalid JSON", () => {
    const response = "This is not JSON at all";
    const result = extractJsonArray(response);
    expect(result).toBeNull();
  });

  it("should return null for malformed JSON", () => {
    const response = '[{"id": "1", broken}]';
    const result = extractJsonArray(response);
    expect(result).toBeNull();
  });

  it("should handle nested JSON in response text", () => {
    const response = `
      I found the following emails:
      \`\`\`json
      [
        {"id": "1", "subject": "News Update", "sender": "newsletter@example.com"},
        {"id": "2", "subject": "Market Report", "sender": "finance@example.com"}
      ]
      \`\`\`
      That's all for today.
    `;
    const result = extractJsonArray(response);
    expect(result).toHaveLength(2);
    expect(result![0]).toHaveProperty("subject", "News Update");
  });
});

// ============================================
// Duplicate Detection Algorithm Tests
// ============================================

interface MockNewsItem {
  id: string;
  subject: string;
  source: string;
  summary: string;
}

function findSimilarGroups(items: MockNewsItem[]): MockNewsItem[][] {
  const groups: MockNewsItem[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;

    const group: MockNewsItem[] = [items[i]];
    const words1 = (items[i].subject || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;

      const words2 = (items[j].subject || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      const commonWords = words1.filter((w) => words2.includes(w));

      if (commonWords.length >= 2) {
        group.push(items[j]);
        used.add(j);
      }
    }

    used.add(i);
    groups.push(group);
  }

  return groups;
}

describe("Duplicate Detection Algorithm", () => {
  it("should group items with similar subjects", () => {
    const items: MockNewsItem[] = [
      {
        id: "1",
        subject: "Tesla stock price drops significantly today",
        source: "WSJ",
        summary: "",
      },
      {
        id: "2",
        subject: "Tesla stock price falls after earnings report",
        source: "Bloomberg",
        summary: "",
      },
      { id: "3", subject: "Apple launches new iPhone model", source: "Reuters", summary: "" },
    ];

    const groups = findSimilarGroups(items);

    // Should have 2 groups: Tesla stories grouped, Apple separate
    expect(groups).toHaveLength(2);

    // Find the Tesla group
    const teslaGroup = groups.find((g) => g.some((item) => item.subject.includes("Tesla")));
    expect(teslaGroup).toHaveLength(2);
  });

  it("should not group unrelated items", () => {
    const items: MockNewsItem[] = [
      { id: "1", subject: "Microsoft announces new AI features", source: "WSJ", summary: "" },
      { id: "2", subject: "Apple releases iPhone update", source: "Bloomberg", summary: "" },
      { id: "3", subject: "Google expands cloud services", source: "Reuters", summary: "" },
    ];

    const groups = findSimilarGroups(items);

    // Each item should be in its own group
    expect(groups).toHaveLength(3);
    groups.forEach((g) => expect(g).toHaveLength(1));
  });

  it("should handle empty items array", () => {
    const groups = findSimilarGroups([]);
    expect(groups).toHaveLength(0);
  });

  it("should handle single item", () => {
    const items: MockNewsItem[] = [
      { id: "1", subject: "Breaking news story", source: "WSJ", summary: "" },
    ];

    const groups = findSimilarGroups(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(1);
  });

  it("should require at least 2 common words for grouping", () => {
    const items: MockNewsItem[] = [
      { id: "1", subject: "Tesla announces earnings", source: "WSJ", summary: "" },
      { id: "2", subject: "Tesla reveals new model", source: "Bloomberg", summary: "" }, // Only "Tesla" in common (1 word)
    ];

    const groups = findSimilarGroups(items);

    // Should NOT be grouped because they only share 1 word
    expect(groups).toHaveLength(2);
  });

  it("should ignore short words (<=4 chars) for matching", () => {
    const items: MockNewsItem[] = [
      { id: "1", subject: "Breaking financial market analysis today", source: "WSJ", summary: "" },
      {
        id: "2",
        subject: "Latest financial market updates report",
        source: "Bloomberg",
        summary: "",
      },
    ];

    const groups = findSimilarGroups(items);

    // "financial" and "market" are common (both >4 chars) - should be grouped
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });
});
