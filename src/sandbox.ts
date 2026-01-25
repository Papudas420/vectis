import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Logger } from './logger.js';

const execAsync = promisify(exec);

export class SandboxModule {
    private baseTempDir: string;
    private logger: Logger;

    constructor() {
        this.baseTempDir = path.join(os.tmpdir(), 'vectis-sandbox');
        this.logger = Logger.getInstance();
    }

    /**
     * Initializes the sandbox base directory.
     */
    async init(): Promise<void> {
        try {
            await fs.mkdir(this.baseTempDir, { recursive: true });
        } catch (error) {
            this.logger.error('Error creating base temp dir:', error);
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
            this.logger.info(`Installing skill: ${skillName} from ${repoUrl} into ${sessionDir}`);

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
                this.logger.info(`Successfully installed ${skillName} to ${skillPath}`);
                return { sessionDir, skillPath };
            } catch (e) {
                this.logger.warn(`${skillName} not found in .agent/skills, using session root`);
                return { sessionDir, skillPath: sessionDir };
            }
        } catch (error) {
            this.logger.error(`Failed to install skill ${skillName} from ${repoUrl}:`, error);
            throw new Error(`Installation failed: ${error}`);
        }
    }

    /**
     * Reads a skill's SKILL.md content.
     */
    async getSkillContent(skillDir: string): Promise<string> {
        try {
            this.logger.debug(`Reading skill content from: ${skillDir}`);
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
            this.logger.error('Error reading skill content:', error);
            return 'Could not read SKILL.md.';
        }
    }

    /**
     * Cleans up a specific session directory.
     */
    async cleanup(sessionDir: string): Promise<void> {
        try {
            this.logger.debug(`Cleaning up session directory: ${sessionDir}`);
            await fs.rm(sessionDir, { recursive: true, force: true });
        } catch (error) {
            this.logger.error(`Failed to cleanup ${sessionDir}:`, error);
        }
    }

    /**
     * Cleans up all sandboxes.
     */
    async cleanupAll(): Promise<void> {
        try {
            this.logger.info('Cleaning up all sandboxes...');
            await fs.rm(this.baseTempDir, { recursive: true, force: true });
            await this.init();
        } catch (error) {
            this.logger.error('Failed to cleanup all sandboxes:', error);
        }
    }
}
