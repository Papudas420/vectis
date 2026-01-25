import { DiscoveryModule } from './discovery.js';
import { SandboxModule } from './sandbox.js';

async function test() {
    console.log('Testing Discovery Module...');
    const discovery = new DiscoveryModule();

    console.log('Fetching sitemap...');
    const urls = await discovery.getAllSkillUrls();
    console.log(`Found ${urls.length} skills in sitemap.`);

    if (urls.length > 0) {
        console.log('Searching for "react"...');
        const searchResults = await discovery.searchSkills('react');
        console.log('Search Results:', JSON.stringify(searchResults, null, 2));

        if (searchResults.length > 0) {
            console.log('\nTesting Sandbox Module...');
            const sandbox = new SandboxModule();
            await sandbox.init();

            const { repoUrl, skillName } = searchResults[0];
            console.log(`Installing skill: ${skillName} from ${repoUrl}`);

            const { sessionDir, skillPath } = await sandbox.installSkill(repoUrl, skillName);
            console.log(`Installed to: ${skillPath}`);

            const content = await sandbox.getSkillContent(skillPath);
            console.log('Skill Content Preview:', content.substring(0, 200) + '...');

            console.log('Cleaning up...');
            await sandbox.cleanup(sessionDir);
            console.log('Cleanup done.');
        }
    }
}

test().catch(console.error);
