#!/usr/bin/env node
const https = require('https');

const site = process.env.DEPLOY_PRIME_URL || process.env.URL || '';
const token = process.env.BACKUP_TOKEN || '';

function callBackup(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const req = https.request(url, { method: 'GET', headers: token ? { 'x-backup-token': token } : {} }, (res) => {
      // consume
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', resolve);
    req.end();
  });
}

(async () => {
  const base = site.replace(/\/$/, '');
  if (!base) return;
  const backupUrl = `${base}/.netlify/functions/backup-trip`;
  await callBackup(backupUrl);
})();

