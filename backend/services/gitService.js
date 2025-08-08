const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const repoRoot = path.resolve(__dirname, '..');

function resolveSafe(relPath = '') {
  const fullPath = path.resolve(repoRoot, relPath);
  if (!fullPath.startsWith(repoRoot)) {
    throw new Error('Invalid path');
  }
  return fullPath;
}

async function listTree(relPath = '') {
  const dirPath = resolveSafe(relPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const entryRel = path.join(relPath, entry.name);
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: entryRel,
        type: 'dir',
        children: await listTree(entryRel)
      });
    } else {
      result.push({ name: entry.name, path: entryRel, type: 'file' });
    }
  }
  return result;
}

async function readFile(relPath) {
  const filePath = resolveSafe(relPath);
  const data = await fs.readFile(filePath, 'utf8');
  return data.replace(/\r\n/g, '\n');
}

async function writeFile(relPath, content) {
  const filePath = resolveSafe(relPath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content.replace(/\r\n/g, '\n'), 'utf8');
}

function runGit(args) {
  return new Promise((resolve, reject) => {
    exec(`git ${args}`, { cwd: repoRoot }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr.trim() || err.message));
      resolve(stdout.trim());
    });
  });
}

async function commit(message) {
  await runGit('add .');
  return await runGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
}

async function branch(name) {
  return await runGit(`checkout -b ${name}`);
}

async function push(remote, branchName) {
  return await runGit(`push ${remote} ${branchName}`);
}

async function createPullRequest({ title, body, head, base }) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');
  const remoteUrl = await runGit('config --get remote.origin.url');
  const match = remoteUrl.match(/github.com[:\/](.+?)\/(.+)\.git/);
  if (!match) throw new Error('Cannot parse remote URL');
  const [_, owner, repo] = match;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  const response = await axios.post(
    url,
    { title, body, head, base },
    { headers: { Authorization: `token ${token}`, 'User-Agent': 'graphrag-bot' } }
  );
  return response.data;
}

module.exports = {
  listTree,
  readFile,
  writeFile,
  commit,
  branch,
  push,
  createPullRequest
};
