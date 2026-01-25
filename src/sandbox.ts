import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class SandboxModule {
    private baseTempDir: string;

    constructor() {
        this.baseTempDir = path.join(os.tmpdir(), 'vectis-sandbox');
    }

    /**
     * Initializes the sandbox base directory.
     */
    async init(): Promise<void> {
        try {
            await fs.mkdir(this.baseTempDir, { recursive: true });
        } catch (error) {
            console.error('Error creating base temp dir:', error);
        }
    }

    /**
   * Installs a skill into a session-specific sandbox.
   */
    async installSkill(repoUrl: string, skillName: string): Promise<{ sessionDir: string; skillPath: string }> {
        const sessionId = Math.random().toString(36).substring(7);
        const sessionDir = path.join(this.baseTempDir, sessionId);

        await fs.mkdir(sessionDir, { recursive: true });

        try {
            // Run npx skills add <repoUrl> -y in the session directory
            // -y will install all skills in that repo non-interactively
            await execAsync(`npx skills add ${repoUrl} -y`, {
                cwd: sessionDir,
            });

            // The skills are installed in .agent/skills/<skillName>
            const skillPath = path.join(sessionDir, '.agent', 'skills', skillName);

            // Check if it exists in .agent/skills
            try {
                await fs.access(skillPath);
                return { sessionDir, skillPath };
            } catch (e) {
                return { sessionDir, skillPath: sessionDir };
            }
        } catch (error) {
            console.error(`Failed to install skill ${skillName} from ${repoUrl}:`, error);
            throw new Error(`Installation failed: ${error}`);
        }
    }

    /**
     * Reads a skill's SKILL.md content.
     */
    async getSkillContent(skillDir: string): Promise<string> {
        try {
            // If we got the skill directory directly
            const skillMdPath = path.join(skillDir, 'SKILL.md');
            try {
                const content = await fs.readFile(skillMdPath, 'utf8');
                return content;
            } catch (e) {
                // Search recursively if not at root
                const items = await fs.readdir(skillDir, { recursive: true });
                const found = (items as string[]).find(item => item.endsWith('SKILL.md'));
                if (found) {
                    return await fs.readFile(path.join(skillDir, found), 'utf8');
                }
                return 'SKILL.md not found in sandbox.';
            }
        } catch (error) {
            console.error('Error reading skill content:', error);
            return 'Could not read SKILL.md.';
        }
    }

    /**
     * Cleans up a specific session directory.
     */
    async cleanup(sessionDir: string): Promise<void> {
        try {
            await fs.rm(sessionDir, { recursive: true, force: true });
        } catch (error) {
            console.error(`Failed to cleanup ${sessionDir}:`, error);
        }
    }

    /**
     * Cleans up all sandboxes.
     */
    async cleanupAll(): Promise<void> {
        try {
            await fs.rm(this.baseTempDir, { recursive: true, force: true });
            await this.init();
        } catch (error) {
            console.error('Failed to cleanup all sandboxes:', error);
        }
    }
}
