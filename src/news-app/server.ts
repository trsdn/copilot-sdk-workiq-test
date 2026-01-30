import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";
import path from "path";
import { fileURLToPath } from "url";
import { withRetry, CircuitBreaker } from "../utils/retry.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const startTime = Date.now();
const version = process.env.npm_package_version || "1.0.0";

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Swagger UI for API documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "News Aggregator API Docs",
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  const log = logger.child({ requestId, method: req.method, path: req.path });
  log.info("Request received");

  const start = Date.now();
  res.on("finish", () => {
    log.info({ status: res.statusCode, duration: Date.now() - start }, "Request completed");
  });

  next();
});

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const streamLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute for streaming endpoint
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Circuit breaker for Work IQ calls
const workIqCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  onOpen: () => logger.warn("Circuit breaker opened - Work IQ temporarily unavailable"),
  onClose: () => logger.info("Circuit breaker closed - Work IQ available again"),
});

// Work IQ MCP Server configuration
const workIqMcpServers = {
  workiq: {
    type: "local" as const,
    command: "npx",
    args: ["-y", "@microsoft/workiq", "mcp"],
    tools: ["*"],
  },
};

let client: CopilotClient | null = null;

async function getClient(): Promise<CopilotClient> {
  if (!client) {
    client = new CopilotClient({ logLevel: "error" });
    await client.start();
  }
  return client;
}

// Format date as YYYY-MM-DD using local timezone (not UTC!)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get array of dates for the last N days (including today)
function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);
    dates.push(formatLocalDate(targetDate));
  }

  return dates;
}

// Type definitions
interface RawEmail {
  id: string;
  subject: string;
  sender: string;
  date: string;
  emailUrl: string;
  source: string;
}

interface NewsItem {
  id: string;
  subject: string;
  sender: string;
  date: string;
  summary: string;
  source: string;
  emailUrl: string;
  originalEmailId?: string;
}

interface MergedNewsItem {
  id: string;
  subject: string;
  date: string;
  summary: string;
  sources: string[];
  emailUrls: string[];
  originalItems: NewsItem[];
}

// ============================================
// Health Check Endpoints
// ============================================

// Health check endpoint - basic liveness probe
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// Ready check endpoint - checks if dependencies are available
app.get("/api/ready", async (_req, res) => {
  try {
    const copilotConnected = client !== null;
    const circuitBreakerState = workIqCircuitBreaker.getState();

    if (circuitBreakerState.isOpen) {
      res.status(503).json({
        status: "degraded",
        message: "Work IQ circuit breaker is open",
        copilotClient: copilotConnected ? "connected" : "disconnected",
        circuitBreaker: "open",
      });
      return;
    }

    res.json({
      status: "ready",
      copilotClient: copilotConnected ? "connected" : "disconnected",
      circuitBreaker: "closed",
    });
  } catch (error) {
    logger.error({ error }, "Ready check failed");
    res.status(503).json({
      status: "not ready",
      error: String(error),
    });
  }
});

// SSE endpoint for streaming news fetch with live updates
app.get("/api/news-stream", streamLimiter, async (req, res) => {
  const days = parseInt(req.query.days as string) || 3;
  const maxNews = parseInt(req.query.max as string) || 50;

  // Disable request timeout for SSE
  req.setTimeout(0);
  res.setTimeout(0);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering if proxied
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  let isClientConnected = true;

  // Heartbeat to keep connection alive (every 5 seconds - more frequent)
  const heartbeatInterval = setInterval(() => {
    if (isClientConnected) {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        isClientConnected = false;
        clearInterval(heartbeatInterval);
      }
    }
  }, 5000);

  // Clean up on client disconnect
  req.on("close", () => {
    isClientConnected = false;
    clearInterval(heartbeatInterval);
    logger.info("SSE client disconnected");
  });

  req.on("error", () => {
    isClientConnected = false;
    clearInterval(heartbeatInterval);
  });

  const sendEvent = (type: string, data: Record<string, unknown>) => {
    if (isClientConnected) {
      try {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
      } catch {
        isClientConnected = false;
      }
    }
  };

  try {
    sendEvent("status", { message: "🔄 Connecting to Copilot..." });
    const copilot = await getClient();

    // ============================================
    // STEP 1: Fetch all emails (basic metadata only)
    // ============================================
    sendEvent("status", { message: "📬 STEP 1: Fetching emails from Inbox/news (parallel)..." });

    const datesToFetch = getDateRange(days);
    sendEvent("status", { message: `📬 Fetching ${datesToFetch.length} days in parallel...` });

    // Parallel fetch for all days with retry and circuit breaker
    const fetchDay = async (dateStr: string): Promise<RawEmail[]> => {
      return workIqCircuitBreaker.execute(async () => {
        return withRetry(
          async () => {
            const session = await copilot.createSession({
              model: "gpt-5-mini",
              streaming: true,
              mcpServers: workIqMcpServers,
              systemMessage: {
                content: `You are a precise email metadata extractor. Your ONLY job is to call Work IQ and return email metadata as a clean JSON array.

## CRITICAL RULES
1. Output MUST be a raw JSON array - NO markdown, NO code fences, NO explanatory text
2. If no emails found, return: []
3. Extract source abbreviation from sender name ("The Wall Street Journal" → "WSJ", "The New York Times" → "NYT", "Bloomberg" → "Bloomberg")

## OUTPUT SCHEMA (strict)
[
  {
    "id": "string - use email ID or generate unique",
    "subject": "string - exact email subject line",
    "sender": "string - sender display name or email",
    "date": "YYYY-MM-DD format only",
    "emailUrl": "string - Outlook web URL if available, or empty string",
    "source": "string - abbreviated publication name (WSJ, NYT, BBC, etc.)"
  }
]

## EXAMPLE OUTPUT
[{"id":"AAMk123","subject":"Markets Rally on Fed News","sender":"WSJ Markets","date":"2026-01-30","emailUrl":"https://outlook.office365.com/mail/id/AAMk123","source":"WSJ"}]`,
              },
            });

            let response = "";
            session.on((event: SessionEvent) => {
              if (event.type === "assistant.message_delta") {
                response += event.data.deltaContent;
              }
            });

            try {
              await session.sendAndWait(
                {
                  prompt: `TASK: Retrieve all emails from the "Inbox/news" subfolder for date: ${dateStr}

STEPS:
1. Call mcp_workiq_ask_work_iq with query: "List all emails in the 'Inbox/news' folder (this is a subfolder named 'news' inside Inbox) received on ${dateStr}. Include email ID, subject, sender, and web URL for each email."
2. Parse the response and extract metadata for each email
3. Return ONLY a JSON array (no other text)

IMPORTANT: Search ONLY in "Inbox/news" - this is a subfolder of Inbox called "news", NOT the main Inbox!

If the folder is empty or no emails match, return: []
Do NOT include any explanation - just the JSON array.`,
                },
                90000
              );
            } finally {
              await session.destroy();
            }

            const cleanResponse = response
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              const dayEmails = JSON.parse(arrayMatch[0]) as RawEmail[];
              sendEvent("status", {
                message: `✅ Found ${dayEmails.length} emails for ${dateStr}`,
              });
              return dayEmails.map((e: RawEmail, idx: number) => ({
                ...e,
                id: `${dateStr}-${idx}`,
              }));
            }
            return [];
          },
          {
            maxRetries: 2,
            baseDelayMs: 1000,
            onRetry: (attempt, _err, delay) => {
              sendEvent("status", {
                message: `⏳ Retry ${attempt} for ${dateStr} (waiting ${Math.round(delay / 1000)}s)...`,
              });
            },
          }
        );
      });
    };

    // Fetch days with individual error handling
    const dayResults = await Promise.all(
      datesToFetch.map(async (dateStr) => {
        try {
          return await fetchDay(dateStr);
        } catch (err) {
          logger.error({ error: err, date: dateStr }, "Failed to fetch day");
          sendEvent("status", { message: `⚠️ Failed to fetch ${dateStr}, continuing...` });
          return [];
        }
      })
    );
    const rawEmails: RawEmail[] = dayResults.flat();

    sendEvent("status", { message: `📊 STEP 1 Complete: ${rawEmails.length} emails fetched` });

    // ============================================
    // STEP 2: Split into stories and summarize each (PARALLEL)
    // ============================================
    sendEvent("status", { message: "📝 STEP 2: Extracting stories (parallel)..." });

    const batchSize = 5;
    const batches: RawEmail[][] = [];
    for (let i = 0; i < rawEmails.length; i += batchSize) {
      batches.push(rawEmails.slice(i, i + batchSize));
    }

    sendEvent("status", { message: `📝 Processing ${batches.length} batches in parallel...` });

    const processBatch = async (batch: RawEmail[], batchNum: number): Promise<NewsItem[]> => {
      const session = await copilot.createSession({
        model: "gpt-5-mini",
        streaming: true,
        systemMessage: {
          content: `You are a news story extractor and summarizer. You analyze newsletter emails and extract individual news stories.

## YOUR TASK
Analyze each email and determine:
- Is this a DIGEST (multiple stories)? → Extract EACH story as separate entry
- Is this a SINGLE story? → Create one entry

## SUMMARY GUIDELINES
Write summaries that are:
- 3-5 sentences covering WHO, WHAT, WHEN, WHERE, WHY
- Include specific numbers, names, and facts
- Explain significance and potential impact
- Use active voice and clear language

## OUTPUT FORMAT (strict JSON array, no markdown)
[
  {
    "id": "originalEmailId-storyIndex (e.g., '2026-01-30-0-1' for second story)",
    "subject": "Compelling headline capturing the story essence",
    "sender": "Keep original sender from input",
    "date": "YYYY-MM-DD from input",
    "summary": "Detailed 3-5 sentence summary with key facts, context, and implications",
    "source": "Publication abbreviation from input",
    "emailUrl": "Keep original URL from input",
    "originalEmailId": "Original email ID from input"
  }
]

## RULES
1. Output ONLY the JSON array - no explanations, no markdown fences
2. Preserve ALL metadata from input (sender, date, emailUrl, source)
3. Generate unique IDs by appending story index to original ID
4. If email subject is vague, create a descriptive headline from content`,
        },
      });

      let response = "";
      session.on((event: SessionEvent) => {
        if (event.type === "assistant.message_delta") {
          response += event.data.deltaContent;
        }
      });

      try {
        await session.sendAndWait(
          {
            prompt: `ANALYZE AND EXTRACT NEWS STORIES

Input emails (batch ${batchNum + 1}):
${JSON.stringify(batch, null, 2)}

INSTRUCTIONS:
1. For each email, analyze if it's a digest (multiple stories) or single story
2. Extract each distinct news story as a separate entry
3. Write a compelling 3-5 sentence summary for each story including:
   - The main event or development
   - Key people, companies, or organizations involved
   - Relevant numbers, dates, or statistics
   - Why this matters (impact/significance)
4. Create descriptive headlines that capture the story essence

RETURN: JSON array only, no markdown, no explanations.`,
          },
          90000
        );
      } finally {
        await session.destroy();
      }

      try {
        const cleanResponse = response
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const items = JSON.parse(arrayMatch[0]);
          sendEvent("status", { message: `✅ Batch ${batchNum + 1}: ${items.length} stories` });
          return items;
        }
      } catch (_e) {
        sendEvent("status", { message: `⚠️ Parse error for batch ${batchNum + 1}` });
      }
      return [];
    };

    // Process batches with individual error handling
    const batchResults = await Promise.all(
      batches.map(async (batch, i) => {
        try {
          return await processBatch(batch, i);
        } catch (err) {
          logger.error({ error: err, batch: i }, "Failed to process batch");
          sendEvent("status", { message: `⚠️ Batch ${i + 1} failed, continuing...` });
          return [];
        }
      })
    );
    const allNewsItems: NewsItem[] = batchResults.flat();

    sendEvent("status", {
      message: `📊 STEP 2 Complete: ${allNewsItems.length} news stories extracted`,
    });

    // ============================================
    // STEP 3: Merge duplicates with combined sources
    // ============================================
    sendEvent("status", { message: "🔗 STEP 3: Merging duplicate stories..." });

    const mergedNews = await mergeDuplicates(allNewsItems, copilot, sendEvent, workIqMcpServers);

    sendEvent("status", { message: `📊 STEP 3 Complete: ${mergedNews.length} unique stories` });

    // Sort by date and limit
    const sortedNews = mergedNews
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, maxNews);

    sendEvent("status", { message: `✨ Done! ${sortedNews.length} stories ready` });
    sendEvent("complete", {
      data: {
        news: sortedNews,
        stats: {
          emailsFetched: rawEmails.length,
          storiesExtracted: allNewsItems.length,
          afterMerge: mergedNews.length,
          displayed: sortedNews.length,
        },
      },
    });
    clearInterval(heartbeatInterval);
    res.end();
  } catch (error) {
    logger.error({ error }, "SSE streaming error");
    sendEvent("error", { message: String(error) });
    clearInterval(heartbeatInterval);
    res.end();
  }
});

// Merge duplicate stories using LLM for similarity detection
async function mergeDuplicates(
  items: NewsItem[],
  copilot: CopilotClient,
  sendEvent: (type: string, data: Record<string, unknown>) => void,
  _mcpServers?: Record<string, unknown>
): Promise<MergedNewsItem[]> {
  if (items.length === 0) return [];

  // First, group similar stories using word matching
  const groups: NewsItem[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;

    const group: NewsItem[] = [items[i]];
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

  sendEvent("status", {
    message: `🔗 Found ${groups.filter((g) => g.length > 1).length} duplicate groups to merge (parallel)...`,
  });

  // Process groups in parallel
  const processGroup = async (group: NewsItem[], idx: number): Promise<MergedNewsItem> => {
    if (group.length === 1) {
      // Single item, no merge needed
      return {
        id: group[0].id,
        subject: group[0].subject,
        date: group[0].date,
        summary: group[0].summary,
        sources: [group[0].source],
        emailUrls: [group[0].emailUrl],
        originalItems: group,
      };
    }

    // Multiple items - merge with LLM
    const session = await copilot.createSession({
      model: "gpt-5-mini",
      streaming: true,
      systemMessage: {
        content: `You are a news synthesis expert. You merge multiple articles covering the SAME story into one comprehensive entry.

## YOUR TASK
Combine multiple source perspectives into a single, authoritative summary that:
- Synthesizes facts from ALL sources
- Notes any differences in reporting or emphasis
- Provides fuller context than any single source
- Creates a headline that captures the unified story

## OUTPUT FORMAT (strict JSON object, no markdown)
{
  "subject": "Unified headline that captures the complete story",
  "summary": "Comprehensive 4-6 sentence synthesis combining all perspectives. Include: main facts agreed upon by all sources, any additional details from specific sources (attributed), notable differences in coverage or interpretation, and overall significance."
}

## RULES
1. Output ONLY the JSON object - no markdown fences, no explanations
2. The summary should be BETTER than any individual source
3. If sources disagree, note it: "While [Source A] emphasizes X, [Source B] focuses on Y"
4. Attribute unique facts: "According to WSJ, ..." or "NYT reports that..."`,
      },
    });

    let response = "";
    session.on((event: SessionEvent) => {
      if (event.type === "assistant.message_delta") {
        response += event.data.deltaContent;
      }
    });

    const sourcesInfo = group.map((item) => ({
      source: item.source,
      subject: item.subject,
      summary: item.summary,
    }));

    try {
      await session.sendAndWait(
        {
          prompt: `MERGE ${group.length} ARTICLES ABOUT THE SAME STORY

Sources to synthesize:
${JSON.stringify(sourcesInfo, null, 2)}

TASK:
1. Identify the core story these articles share
2. Create a unified headline that's more informative than any individual headline
3. Write a 4-6 sentence synthesis that:
   - States the main facts all sources agree on
   - Adds unique details from specific sources (with attribution)
   - Notes any differences in framing or emphasis
   - Explains why this story matters

Sources represented: ${group.map((g) => g.source).filter((s, i, arr) => arr.indexOf(s) === i).join(", ")}

RETURN: JSON object only {"subject": "...", "summary": "..."}`,
        },
        45000
      );
    } finally {
      await session.destroy();
    }

    try {
      const cleanResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const match = cleanResponse.match(/\{[\s\S]*\}/);
      if (match) {
        const merged = JSON.parse(match[0]);
        sendEvent("status", { message: `✅ Merged: ${merged.subject?.substring(0, 40)}...` });
        return {
          id: `merged-${idx}`,
          subject: merged.subject || group[0].subject,
          date: group[0].date,
          summary: merged.summary || group.map((g) => g.summary).join(" "),
          sources: group.map((g) => g.source).filter((s, i, arr) => arr.indexOf(s) === i),
          emailUrls: group.map((g) => g.emailUrl).filter(Boolean),
          originalItems: group,
        };
      }
    } catch (_e) {
      // Fallback
    }

    return {
      id: `merged-${idx}`,
      subject: group[0].subject,
      date: group[0].date,
      summary: group[0].summary,
      sources: group.map((g) => g.source).filter((s, i, arr) => arr.indexOf(s) === i),
      emailUrls: group.map((g) => g.emailUrl).filter(Boolean),
      originalItems: group,
    };
  };

  // Process groups with individual error handling
  const mergedItems = await Promise.all(
    groups.map(async (group, i) => {
      try {
        return await processGroup(group, i);
      } catch (err) {
        logger.error({ error: err, group: i }, "Failed to merge group");
        sendEvent("status", { message: `⚠️ Merge group ${i + 1} failed, using first item` });
        // Fallback to first item in group
        return {
          id: group[0].id,
          subject: group[0].subject,
          date: group[0].date,
          summary: group[0].summary,
          sources: [group[0].source],
          emailUrls: [group[0].emailUrl],
          originalItems: group,
        };
      }
    })
  );

  return mergedItems;
}

// API endpoint to fetch and summarize news
app.get("/api/news", apiLimiter, async (_req, res) => {
  try {
    const copilot = await getClient();

    const session = await copilot.createSession({
      model: "gpt-4.1-mini",
      streaming: true,
      mcpServers: workIqMcpServers,
      systemMessage: {
        content: `You are an intelligent news aggregation assistant with access to Microsoft 365 email data via Work IQ tools.

## WORKFLOW
1. Use mcp_workiq_ask_work_iq to query the user's newsletter emails
2. Extract and summarize each news story
3. Identify duplicate coverage (same story from multiple sources)
4. Return structured JSON

## OUTPUT SCHEMA (strict JSON, no markdown)
{
  "news": [
    {
      "id": "unique identifier",
      "subject": "News headline/subject",
      "sender": "Publication or sender name",
      "date": "YYYY-MM-DD",
      "summary": "2-3 sentence summary with key facts and significance",
      "source": "Abbreviated source name (WSJ, NYT, BBC, etc.)",
      "isDuplicate": false,
      "duplicateOf": null
    }
  ],
  "duplicateGroups": [
    {
      "topic": "Brief description of the shared topic",
      "items": ["id1", "id2"]
    }
  ]
}

## DUPLICATE DETECTION
Mark stories as duplicates when they cover the SAME event/topic from different sources:
- Set isDuplicate: true on secondary items
- Set duplicateOf: "id of primary item"
- Create a duplicateGroup entry

## RULES
1. Output ONLY valid JSON - no markdown code fences, no explanatory text
2. Always include both "news" and "duplicateGroups" keys
3. If no news found, return: {"news": [], "duplicateGroups": []}`,
      },
    });

    let response = "";

    logger.info("Starting news fetch...");

    session.on((event: SessionEvent) => {
      if (event.type === "assistant.message_delta") {
        response += event.data.deltaContent;
        process.stdout.write(event.data.deltaContent);
      }
      if (event.type === "assistant.message") {
        logger.debug("Message complete");
      }
      if (event.type === "tool.execution_start") {
        logger.debug({ tool: event.data.toolName }, "Tool execution started");
      }
    });

    await session.sendAndWait(
      {
        prompt: `TASK: Aggregate news from my Inbox/news folder

STEP 1 - SEARCH
Query Work IQ: "List ALL emails in my 'Inbox/news' folder from the last 7 days. This is a subfolder of Inbox called 'news'. Include emails from sources like WSJ, NY Times, Bloomberg, Reuters, BBC, The Guardian, Financial Times, The Economist, and any other news publications."

IMPORTANT: Only search the "Inbox/news" folder - NOT the main Inbox!

STEP 2 - EXTRACT
For each email found:
- Extract subject, sender, date
- Write a 2-3 sentence summary capturing the key facts
- Identify the publication source

STEP 3 - DEDUPLICATE
Group stories covering the same topic/event from different sources.
Mark secondary coverage as duplicates referencing the primary story.

STEP 4 - RETURN
Output the structured JSON with all news items and duplicate groups.
No markdown formatting - raw JSON only.`,
      },
      180000
    ); // 3 minute timeout for Work IQ queries

    await session.destroy();

    logger.debug({ responseLength: response.length }, "Raw response received");

    // Try to parse the response as JSON
    let newsData;
    try {
      // Remove markdown code blocks if present
      const cleanResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Extract JSON from the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (_parseError) {
      logger.warn("Failed to parse response as JSON");
      // Return the raw response so the UI can display it
      newsData = {
        news: [],
        duplicateGroups: [],
        rawResponse:
          response ||
          "No response received from the AI. The Work IQ integration may not be available in this context.",
      };
    }

    res.json(newsData);
  } catch (error) {
    logger.error({ error }, "Error fetching news");
    res.status(500).json({ error: "Failed to fetch news", details: String(error) });
  }
});

// API endpoint to get summary of a specific topic
app.post("/api/summarize-topic", apiLimiter, async (req, res) => {
  try {
    const { topic } = req.body;
    const copilot = await getClient();

    const session = await copilot.createSession({
      model: "gpt-4.1-mini",
      streaming: true,
      mcpServers: workIqMcpServers,
      systemMessage: {
        content: `You are a research analyst synthesizing news coverage on specific topics. You have access to the user's email via Work IQ.

## OUTPUT FORMAT
Provide a well-structured analysis with:
1. **Overview**: 2-3 sentence summary of the topic
2. **Key Developments**: Bullet points of major facts/events
3. **Multiple Perspectives**: How different sources frame the story
4. **Implications**: What this means going forward

Use clear, professional language. Cite sources when attributing specific claims.`,
      },
    });

    let response = "";

    session.on((event: SessionEvent) => {
      if (event.type === "assistant.message_delta") {
        response += event.data.deltaContent;
      }
    });

    await session.sendAndWait(
      {
        prompt: `RESEARCH TASK: Analyze coverage of "${topic}"

STEPS:
1. Search my "Inbox/news" folder (subfolder of Inbox called 'news') using Work IQ for any emails mentioning "${topic}"
2. Identify all relevant sources and their perspectives
3. Synthesize a comprehensive summary that:
   - Captures the main facts and developments
   - Notes how different publications cover the topic
   - Highlights any conflicting information or viewpoints
   - Provides context on why this topic matters

IMPORTANT: Only search the "Inbox/news" folder - NOT the main Inbox!

Provide a thorough, well-organized analysis.`,
      },
      180000
    ); // 3 minute timeout

    await session.destroy();

    res.json({ summary: response });
  } catch (error) {
    logger.error({ error }, "Error summarizing topic");
    res.status(500).json({ error: "Failed to summarize topic" });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  if (client) {
    await client.stop();
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info({ port: PORT }, "🗞️ News Aggregator running");
});
