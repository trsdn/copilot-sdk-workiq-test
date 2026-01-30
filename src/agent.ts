import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import { z } from "zod";
import * as readline from "readline";

// Define custom tools for your agent
const getSecretNumberTool = defineTool("get_secret_number", {
    description: "Gets a secret number based on a key",
    parameters: {
        key: { type: "string", description: "The key to look up" },
    },
    handler: (args: { key: string }) => {
        const secrets: Record<string, number> = {
            ALPHA: 54321,
            BETA: 12345,
            GAMMA: 99999,
        };
        return secrets[args.key.toUpperCase()] ?? 0;
    },
});

const getCurrentTimeTool = defineTool("get_current_time", {
    description: "Gets the current date and time",
    parameters: {},
    handler: () => {
        return new Date().toISOString();
    },
});

// Work IQ MCP Server configuration for Microsoft 365 integration
const workIqMcpServer = {
    "work-iq": {
        type: "http" as const,
        url: "https://api.githubcopilot.com/mcp/workiq",
        tools: ["*"],
    },
};

async function main() {
    console.log("🚀 Starting Work IQ Agent with Copilot SDK\n");
    console.log("📧 This agent can access your Microsoft 365 data (emails, meetings, files)\n");

    // Create the Copilot client
    const client = new CopilotClient({ logLevel: "info" });
    await client.start();

    // Create a session with custom agents, tools, and Work IQ MCP integration
    const session = await client.createSession({
        model: "gpt-4.1",
        streaming: true,
        tools: [getSecretNumberTool, getCurrentTimeTool],
        mcpServers: workIqMcpServer,
        customAgents: [
            {
                name: "workiq-agent",
                displayName: "Work IQ Agent",
                description: "A helpful assistant that can access Microsoft 365 data including emails, meetings, files, and calendar",
                prompt: `You are a helpful productivity assistant with access to Microsoft 365 data through Work IQ.
You can help users with:
- Finding and summarizing emails
- Checking calendar and upcoming meetings
- Searching for files and documents
- Providing insights about their work communications
Be concise, friendly, and respect user privacy.`,
                infer: true,
            },
        ],
    });

    console.log(`✅ Session created: ${session.sessionId}\n`);

    // Set up event handling for streaming
    session.on((event: SessionEvent) => {
        switch (event.type) {
            case "assistant.message_delta":
                process.stdout.write(event.data.deltaContent);
                break;
            case "assistant.message":
                console.log(); // New line after message
                break;
            case "tool.execution_start":
                console.log(`  ⚙️ Running: ${event.data.toolName}`);
                break;
            case "tool.execution_complete":
                console.log(`  ✓ Tool completed`);
                break;
        }
    });

    // Create interactive CLI
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log("🤖 Work IQ Agent ready! Type your questions (or 'exit' to quit)\n");
    console.log("Try asking:");
    console.log('  - "What emails did I receive today?"');
    console.log('  - "Do I have any meetings this week?"');
    console.log('  - "Summarize my recent emails from [person]"');
    console.log('  - "What files have I worked on recently?"');
    console.log('  - "What time is it?" (uses local tool)');
    console.log("");

    const prompt = () => {
        rl.question("You: ", async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
                console.log("👋 Goodbye!");
                await session.destroy();
                await client.stop();
                rl.close();
                return;
            }

            if (trimmed) {
                process.stdout.write("Agent: ");
                await session.sendAndWait({ prompt: trimmed });
                console.log("");
            }

            prompt();
        });
    };

    prompt();
}

main().catch(console.error);
