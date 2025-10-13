#!/usr/bin/env node

/**
 * GitHub Actions Troubleshooting Script
 * This script helps diagnose common GitHub Actions and release issues
 */

const https = require('https');

async function checkGitHubAPI(owner, repo) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}`,
            method: 'GET',
            headers: {
                'User-Agent': 'MIC-Browser-Ultimate-Troubleshooter'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function checkWorkflowRuns(owner, repo) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/actions/runs`,
            method: 'GET',
            headers: {
                'User-Agent': 'MIC-Browser-Ultimate-Troubleshooter'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('🔍 GitHub Actions Troubleshooter for MIC Browser Ultimate\n');
    
    const owner = 'JLamance79';
    const repo = 'mic-browser-ultimate';
    
    try {
        console.log('📊 Checking repository status...');
        const repoCheck = await checkGitHubAPI(owner, repo);
        
        if (repoCheck.status === 200) {
            console.log('✅ Repository is accessible');
            console.log(`   📝 Name: ${repoCheck.data.name}`);
            console.log(`   👤 Owner: ${repoCheck.data.owner.login}`);
            console.log(`   🔒 Private: ${repoCheck.data.private}`);
            console.log(`   ⭐ Stars: ${repoCheck.data.stargazers_count}`);
        } else {
            console.log('❌ Repository not accessible');
            console.log(`   Status: ${repoCheck.status}`);
        }
        
        console.log('\n🔄 Checking workflow runs...');
        const workflowCheck = await checkWorkflowRuns(owner, repo);
        
        if (workflowCheck.status === 200) {
            const runs = workflowCheck.data.workflow_runs;
            console.log(`✅ Found ${runs.length} workflow runs`);
            
            if (runs.length > 0) {
                console.log('\n📋 Recent workflow runs:');
                runs.slice(0, 5).forEach((run, index) => {
                    const status = run.conclusion || run.status;
                    const emoji = status === 'success' ? '✅' : 
                                 status === 'failure' ? '❌' : 
                                 status === 'in_progress' ? '🔄' : '⚠️';
                    console.log(`   ${emoji} ${run.name}: ${status} (${run.created_at})`);
                });
            } else {
                console.log('⚠️  No workflow runs found yet');
            }
        } else {
            console.log('❌ Could not check workflow runs');
            console.log(`   Status: ${workflowCheck.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error checking GitHub:', error.message);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('');
    console.log('1. 🔑 Add GitHub Token Secret:');
    console.log('   • Go to: https://github.com/JLamance79/mic-browser-ultimate/settings/secrets/actions');
    console.log('   • Click "New repository secret"');
    console.log('   • Name: GH_TOKEN');
    console.log('   • Value: [Your Personal Access Token]');
    console.log('');
    console.log('2. ⚙️  Check Workflow Permissions:');
    console.log('   • Go to: https://github.com/JLamance79/mic-browser-ultimate/settings/actions');
    console.log('   • Select "Read and write permissions"');
    console.log('   • Enable "Allow GitHub Actions to create and approve pull requests"');
    console.log('');
    console.log('3. 🏷️  Trigger Release:');
    console.log('   • Run: git push origin v1.0.0');
    console.log('   • Monitor: https://github.com/JLamance79/mic-browser-ultimate/actions');
    console.log('');
    console.log('4. 📦 Check for Issues:');
    console.log('   • Review workflow logs for errors');
    console.log('   • Verify electron-builder configuration');
    console.log('   • Check build dependencies');
    console.log('');
    console.log('🔗 Useful Links:');
    console.log(`   Repository: https://github.com/${owner}/${repo}`);
    console.log(`   Actions: https://github.com/${owner}/${repo}/actions`);
    console.log(`   Settings: https://github.com/${owner}/${repo}/settings`);
    console.log(`   Releases: https://github.com/${owner}/${repo}/releases`);
}

main().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
});