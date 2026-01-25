import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { DiscoveryModule } from "./discovery.js";
import { SandboxModule } from "./sandbox.js";
import { Logger } from "./logger.js";
import { z } from "zod";

class VectisServer {
    private server: Server;
    private discovery: DiscoveryModule;
    private sandbox: SandboxModule;
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
        this.logger.info("Initializing Vectis MCP Server...");

        this.server = new Server(
            {
                name: "vectis",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.discovery = new DiscoveryModule();
        this.sandbox = new SandboxModule();

        this.setupToolHandlers();

        // Error handling
        this.server.onerror = (error) => this.logger.error("MCP Protocol Error", error);

        process.on('SIGINT', async () => {
            this.logger.info("Server shutting down (SIGINT)...");
            await this.sandbox.cleanupAll();
            await this.logger.shutdown();
            process.exit(0);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error("Unhandled Rejection at Promise", { promise, reason });
        });

        process.on('uncaughtException', (error) => {
            this.logger.error("Uncaught Exception", error);
            process.exit(1);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.logger.debug("Handling list_tools request");
            return {
                tools: [
                    {
                        name: "search_skills",
                        description: "CRITICAL: Search skills.sh for professional blueprints, expert instructions, and best practices. Use this BEFORE starting any specialized task like 'creating a landing page', 'writing prompts', or 'architecting systems' to ensure output quality.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "Keywords for the blueprint/skill you need (e.g., 'landing page', 'react best practices')",
                                },
                            },
                            required: ["query"],
                        },
                    },
                    {
                        name: "execute_skill",
                        description: "MANDATORY: Fetches the full expert instructions for a specific skill found via search_skills. You MUST use this to read the detailed requirements and blueprints before generating any final code or design content.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                repoUrl: {
                                    type: "string",
                                    description: "The repository URL (e.g., 'vercel-labs/agent-skills')",
                                },
                                skillName: {
                                    type: "string",
                                    description: "The specific skill name (e.g., 'vercel-react-best-practices')",
                                },
                                keepSandbox: {
                                    type: "boolean",
                                    description: "Whether to keep the sandbox files after reading. Default is false.",
                                },
                            },
                            required: ["repoUrl", "skillName"],
                        },
                    },
                    {
                        name: "clear_cache",
                        description: "Deletes all downloaded skills and temporary sandbox directories.",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                ],
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const args = request.params.arguments;

            this.logger.info(`Executing tool: ${toolName}`, { arguments: args });

            try {
                let toolResult;
                switch (toolName) {
                    case "search_skills": {
                        const { query } = z.object({ query: z.string() }).parse(args);
                        const results = await this.discovery.searchSkills(query);
                        toolResult = {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(results, null, 2),
                                },
                            ],
                        };
                        break;
                    }

                    case "execute_skill": {
                        const { repoUrl, skillName, keepSandbox } = z.object({
                            repoUrl: z.string(),
                            skillName: z.string(),
                            keepSandbox: z.boolean().optional().default(false),
                        }).parse(args);

                        const { sessionDir, skillPath } = await this.sandbox.installSkill(repoUrl, skillName);
                        const content = await this.sandbox.getSkillContent(skillPath);

                        if (!keepSandbox) {
                            await this.sandbox.cleanup(sessionDir);
                        }

                        toolResult = {
                            content: [
                                {
                                    type: "text",
                                    text: `Skill Content for ${skillName} (${repoUrl}):\n\n${content}`,
                                },
                                {
                                    type: "text",
                                    text: keepSandbox ? `Sandbox kept at: ${sessionDir}` : "Sandbox cleaned up.",
                                }
                            ],
                        };
                        break;
                    }

                    case "clear_cache": {
                        await this.sandbox.cleanupAll();
                        toolResult = {
                            content: [
                                {
                                    type: "text",
                                    text: "All sandbox directories have been cleared.",
                                },
                            ],
                        };
                        break;
                    }

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${toolName}`
                        );
                }

                this.logger.info(`Tool ${toolName} completed successfully`);
                return toolResult;

            } catch (error: any) {
                this.logger.error(`Error executing tool: ${toolName}`, error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    async run() {
        await this.sandbox.init();
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info("Vectis MCP server running on stdio transport");
    }
}

const server = new VectisServer();
server.run().catch((err) => {
    Logger.getInstance().error("Fatal server error", err);
});
