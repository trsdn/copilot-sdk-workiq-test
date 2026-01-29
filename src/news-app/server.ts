import express from "express";
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Work IQ MCP Server configuration - using local command as defined in .mcp.json
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
        client = new CopilotClient({ logLevel: "error" }); // Reduce logging for speed
        await client.start();
    }
    return client;
}

// SSE endpoint for streaming news fetch with live updates
app.get("/api/news-stream", async (req, res) => {
    // Get query parameters for filtering
    const days = parseInt(req.query.days as string) || 3;
    const maxNews = parseInt(req.query.max as string) || 50;

    // Set up Server-Sent Events
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
        
        sendEvent("status", { message: "🔗 Starting Work IQ session..." });

        // Collect all news items across multiple queries
        let allNewsItems: any[] = [];
        
        // Loop through each day to get all emails
        for (let dayOffset = 0; dayOffset < days; dayOffset++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - dayOffset);
            const dateStr = targetDate.toISOString().split('T')[0];
            
            sendEvent("status", { message: `📬 Fetching emails for ${dateStr} (day ${dayOffset + 1}/${days})...` });
            
            const session = await copilot.createSession({
                model: "gpt-4.1",
                streaming: true,
                mcpServers: workIqMcpServers,
                systemMessage: {
                    content: `You are a news aggregation assistant. You MUST use the mcp_workiq_ask_work_iq tool.
Process EVERY email returned. For newsletters with MULTIPLE stories, create SEPARATE entries.
Return ONLY a JSON array. Each item must have:
{
  "id": "unique-id",
  "subject": "headline/title",
  "sender": "source email",
  "date": "ISO date string",
  "summary": "A detailed 3-5 sentence summary covering key facts, context, and implications",
  "source": "Publication name",
  "emailUrl": "the outlook.office365.com/owa URL from Work IQ"
}
CRITICAL: Extract ALL emailUrl links. Write comprehensive 3-5 sentence summaries.
No markdown. Output the complete JSON array.`,
                },
            });

            let response = "";
            
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    response += event.data.deltaContent;
                    sendEvent("chunk", { content: event.data.deltaContent });
                }
                if (event.type === "tool.execution_start") {
                    sendEvent("status", { message: `📧 Querying M365 for ${dateStr}...` });
                }
                if (event.type === "tool.execution_complete") {
                    sendEvent("status", { message: `✅ Got data for ${dateStr}` });
                }
            });

            await session.sendAndWait({
                prompt: `Call mcp_workiq_ask_work_iq with: "Show ALL emails in the \\"Inbox/news\\" folder in my mailbox received on ${dateStr}. Return the complete list with all details."

Process EVERY email returned. Create a JSON entry for each.
For newsletters with multiple stories, create separate entries for each story.
Write detailed 3-5 sentence summaries for each news item.
Include the emailUrl (outlook.office365.com links) for each item.
Output ONLY the JSON array.`,
            }, 180000);

            await session.destroy();

            // Parse this day's results and add to collection
            try {
                let cleanResponse = response
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();
                
                const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    const dayItems = JSON.parse(arrayMatch[0]);
                    allNewsItems = allNewsItems.concat(dayItems);
                    sendEvent("status", { message: `📊 Found ${dayItems.length} items for ${dateStr} (total: ${allNewsItems.length})` });
                }
            } catch (parseError) {
                sendEvent("status", { message: `⚠️ Could not parse results for ${dateStr}` });
            }
        }

        // Process all collected items
        sendEvent("status", { message: `🔍 Processing ${allNewsItems.length} total items...` });
        
        let newsData;
        const totalFound = allNewsItems.length;
        
        // Sort by date (newest first) and limit to max
        allNewsItems = allNewsItems
            .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, maxNews);
        
        sendEvent("status", { message: `📊 Found ${totalFound} items, showing ${allNewsItems.length} (max: ${maxNews})` });
        newsData = { news: allNewsItems, duplicateGroups: findDuplicates(allNewsItems) };

        sendEvent("complete", { data: newsData });
        res.end();

    } catch (error) {
        console.error("Error:", error);
        sendEvent("error", { message: String(error) });
        res.end();
    }
});

// Find duplicate stories based on similar subjects
function findDuplicates(news: any[]): any[] {
    const groups: any[] = [];
    const seen = new Set<number>();
    
    for (let i = 0; i < news.length; i++) {
        if (seen.has(i)) continue;
        
        const similar: string[] = [news[i].id || String(i)];
        const words1 = (news[i].subject || "").toLowerCase().split(/\s+/);
        
        for (let j = i + 1; j < news.length; j++) {
            if (seen.has(j)) continue;
            
            const words2 = (news[j].subject || "").toLowerCase().split(/\s+/);
            const commonWords = words1.filter(w => w.length > 4 && words2.includes(w));
            
            // If more than 3 significant words in common, likely duplicate
            if (commonWords.length >= 3) {
                similar.push(news[j].id || String(j));
                news[j].isDuplicate = true;
                news[j].duplicateOf = news[i].id || String(i);
                seen.add(j);
            }
        }
        
        if (similar.length > 1) {
            groups.push({
                topic: news[i].subject,
                items: similar,
            });
        }
    }
    
    return groups;
}

// API endpoint to fetch and summarize news
app.get("/api/news", async (req, res) => {
    try {
        const copilot = await getClient();

        const session = await copilot.createSession({
            model: "gpt-4.1",
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
            model: "gpt-4.1",
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
