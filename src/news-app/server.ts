import express from "express";
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
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

// SSE endpoint for streaming news fetch with live updates
app.get("/api/news-stream", async (req, res) => {
    const days = parseInt(req.query.days as string) || 3;
    const maxNews = parseInt(req.query.max as string) || 50;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (type: string, data: any) => {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
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
        
        // Parallel fetch for all days
        const fetchDay = async (dateStr: string): Promise<RawEmail[]> => {
            const session = await copilot.createSession({
                model: "gpt-5-mini",
                streaming: true,
                mcpServers: workIqMcpServers,
                systemMessage: {
                    content: `You fetch emails and return ONLY basic metadata as JSON.
Return ONLY a JSON array with these fields for each email:
[{"id":"1","subject":"...","sender":"...","date":"YYYY-MM-DD","emailUrl":"https://outlook.office365.com/...","source":"WSJ"}]
Extract the source name from sender (e.g., "WSJ" from "The Wall Street Journal").
No summaries yet. No markdown. Just the JSON array.`,
                },
            });

            let response = "";
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    response += event.data.deltaContent;
                }
            });

            try {
                await session.sendAndWait({
                    prompt: `Call mcp_workiq_ask_work_iq: "Show ALL emails in the \\"Inbox/news\\" folder received on ${dateStr}. Return complete list."
Return JSON array with: id, subject, sender, date, emailUrl, source. No summaries.`,
                }, 90000);
            } finally {
                await session.destroy();
            }

            try {
                const cleanResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    const dayEmails = JSON.parse(arrayMatch[0]);
                    sendEvent("status", { message: `✅ Found ${dayEmails.length} emails for ${dateStr}` });
                    return dayEmails.map((e: any, idx: number) => ({
                        ...e,
                        id: `${dateStr}-${idx}`,
                    }));
                }
            } catch (e) {
                sendEvent("status", { message: `⚠️ Parse error for ${dateStr}` });
            }
            return [];
        };

        const dayResults = await Promise.all(datesToFetch.map(fetchDay));
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
                    content: `You split newsletter emails into individual news stories with detailed summaries.
For each email, determine if it contains MULTIPLE news stories (like a digest/newsletter).
If yes, create SEPARATE entries for each story. If no, create one entry.
Return JSON array:
[{
  "id": "unique-id",
  "subject": "Story headline",
  "sender": "original sender",
  "date": "YYYY-MM-DD",
  "summary": "Detailed 3-5 sentence summary with key facts, context, and implications",
  "source": "Publication name",
  "emailUrl": "keep original URL",
  "originalEmailId": "id of source email"
}]
No markdown. Just JSON array.`,
                },
            });

            let response = "";
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    response += event.data.deltaContent;
                }
            });

            try {
                await session.sendAndWait({
                    prompt: `Process these emails. For multi-story newsletters, split into separate items. For each story, write a detailed 3-5 sentence summary.

Emails to process:
${JSON.stringify(batch)}

Return JSON array with all extracted news items.`,
                }, 90000);
            } finally {
                await session.destroy();
            }

            try {
                const cleanResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    const items = JSON.parse(arrayMatch[0]);
                    sendEvent("status", { message: `✅ Batch ${batchNum + 1}: ${items.length} stories` });
                    return items;
                }
            } catch (e) {
                sendEvent("status", { message: `⚠️ Parse error for batch ${batchNum + 1}` });
            }
            return [];
        };

        const batchResults = await Promise.all(batches.map((batch, i) => processBatch(batch, i)));
        const allNewsItems: NewsItem[] = batchResults.flat();

        sendEvent("status", { message: `📊 STEP 2 Complete: ${allNewsItems.length} news stories extracted` });

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
                }
            } 
        });
        res.end();

    } catch (error) {
        console.error("Error:", error);
        sendEvent("error", { message: String(error) });
        res.end();
    }
});

// Merge duplicate stories using LLM for similarity detection
async function mergeDuplicates(
    items: NewsItem[], 
    copilot: CopilotClient, 
    sendEvent: (type: string, data: any) => void,
    mcpServers: any
): Promise<MergedNewsItem[]> {
    if (items.length === 0) return [];
    
    // First, group similar stories using word matching
    const groups: NewsItem[][] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < items.length; i++) {
        if (used.has(i)) continue;
        
        const group: NewsItem[] = [items[i]];
        const words1 = (items[i].subject || "").toLowerCase().split(/\s+/).filter(w => w.length > 4);
        
        for (let j = i + 1; j < items.length; j++) {
            if (used.has(j)) continue;
            
            const words2 = (items[j].subject || "").toLowerCase().split(/\s+/).filter(w => w.length > 4);
            const commonWords = words1.filter(w => words2.includes(w));
            
            if (commonWords.length >= 2) {
                group.push(items[j]);
                used.add(j);
            }
        }
        
        used.add(i);
        groups.push(group);
    }
    
    sendEvent("status", { message: `🔗 Found ${groups.filter(g => g.length > 1).length} duplicate groups to merge (parallel)...` });
    
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
                content: `You merge multiple news articles about the same story into one unified summary.
Return JSON: {"subject":"unified headline","summary":"comprehensive 3-5 sentence summary synthesizing all sources"}
Combine perspectives from all sources. Highlight any differences in reporting.`,
            },
        });

        let response = "";
        session.on((event: SessionEvent) => {
            if (event.type === "assistant.message_delta") {
                response += event.data.deltaContent;
            }
        });

        const sourcesInfo = group.map(item => ({
            source: item.source,
            subject: item.subject,
            summary: item.summary,
        }));

        try {
            await session.sendAndWait({
                prompt: `Merge these ${group.length} articles about the same story into ONE unified entry:
${JSON.stringify(sourcesInfo, null, 2)}

Create: 1) A unified headline, 2) A comprehensive 3-5 sentence summary combining all perspectives.
Return JSON only.`,
            }, 45000);
        } finally {
            await session.destroy();
        }

        try {
            const cleanResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const match = cleanResponse.match(/\{[\s\S]*\}/);
            if (match) {
                const merged = JSON.parse(match[0]);
                sendEvent("status", { message: `✅ Merged: ${merged.subject?.substring(0, 40)}...` });
                return {
                    id: `merged-${idx}`,
                    subject: merged.subject || group[0].subject,
                    date: group[0].date,
                    summary: merged.summary || group.map(g => g.summary).join(" "),
                    sources: group.map(g => g.source).filter((s, i, arr) => arr.indexOf(s) === i),
                    emailUrls: group.map(g => g.emailUrl).filter(Boolean),
                    originalItems: group,
                };
            }
        } catch (e) {
            // Fallback
        }
        
        return {
            id: `merged-${idx}`,
            subject: group[0].subject,
            date: group[0].date,
            summary: group[0].summary,
            sources: group.map(g => g.source).filter((s, i, arr) => arr.indexOf(s) === i),
            emailUrls: group.map(g => g.emailUrl).filter(Boolean),
            originalItems: group,
        };
    };
    
    const mergedItems = await Promise.all(groups.map((group, i) => processGroup(group, i)));
    
    return mergedItems;
}

// API endpoint to fetch and summarize news
app.get("/api/news", async (req, res) => {
    try {
        const copilot = await getClient();

        const session = await copilot.createSession({
            model: "gpt-4.1-mini",
            streaming: true,
            mcpServers: workIqMcpServers,
            systemMessage: {
                content: `You are a news aggregation assistant. You have access to Microsoft 365 data through Work IQ tools.
When asked to fetch news, use the ask_work_iq tool to search for newsletter emails.
Then format the results as JSON with this structure:
{
  "news": [
    {
      "id": "unique-id",
      "subject": "Email subject",
      "sender": "Sender name/email", 
      "date": "Date received",
      "summary": "Brief summary of the news",
      "source": "News source name",
      "isDuplicate": false,
      "duplicateOf": null
    }
  ],
  "duplicateGroups": [
    {
      "topic": "Topic description",
      "items": ["id1", "id2"]
    }
  ]
}
IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanation text.`,
            },
        });

        let response = "";
        
        console.log("Starting news fetch...");

        session.on((event: SessionEvent) => {
            if (event.type === "assistant.message_delta") {
                response += event.data.deltaContent;
                process.stdout.write(event.data.deltaContent);
            }
            if (event.type === "assistant.message") {
                console.log("\n[Message complete]");
            }
            if (event.type === "tool.execution_start") {
                console.log(`\n[Tool: ${event.data.toolName}]`);
            }
        });

        await session.sendAndWait({
            prompt: `Use Work IQ to search my inbox for newsletter emails and news updates from the last 7 days. 
Look for emails from news sources like NY Times, WSJ, Bloomberg, Reuters, BBC, The Guardian, or any other news newsletters.
For each news item found, extract the subject, sender, date and create a 1-2 sentence summary.
Identify any duplicate stories (same news topic covered by multiple sources).
Return the results as JSON only.`,
        }, 180000); // 3 minute timeout for Work IQ queries

        await session.destroy();
        
        console.log("\nRaw response length:", response.length);

        // Try to parse the response as JSON
        let newsData;
        try {
            // Remove markdown code blocks if present
            let cleanResponse = response
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
        } catch (parseError) {
            console.error("Failed to parse response as JSON");
            // Return the raw response so the UI can display it
            newsData = { 
                news: [], 
                duplicateGroups: [], 
                rawResponse: response || "No response received from the AI. The Work IQ integration may not be available in this context."
            };
        }

        res.json(newsData);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news", details: String(error) });
    }
});

// API endpoint to get summary of a specific topic
app.post("/api/summarize-topic", async (req, res) => {
    try {
        const { topic } = req.body;
        const copilot = await getClient();

        const session = await copilot.createSession({
            model: "gpt-4.1-mini",
            streaming: true,
            mcpServers: workIqMcpServers,
        });

        let response = "";

        session.on((event: SessionEvent) => {
            if (event.type === "assistant.message_delta") {
                response += event.data.deltaContent;
            }
        });

        await session.sendAndWait({
            prompt: `Use Work IQ to search my emails for news about "${topic}" and provide a comprehensive summary combining information from all sources. Include key points and any differing perspectives.`,
        }, 180000); // 3 minute timeout

        await session.destroy();

        res.json({ summary: response });
    } catch (error) {
        console.error("Error summarizing topic:", error);
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
    console.log(`🗞️  News Aggregator running at http://localhost:${PORT}`);
});
