#!/usr/bin/env node

/**
 * This script opens the appropriate React DevTools download page based on the user's browser
 * Run with: node scripts/install-devtools.js
 */

const { exec } = require('child_process');
const os = require('os');
const platform = os.platform();

// React DevTools URLs for various browsers
const devToolsUrls = {
  chrome: 'https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi',
  firefox: 'https://addons.mozilla.org/en-US/firefox/addon/react-devtools/',
  edge: 'https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil'
};

// Try to detect default browser and open the appropriate URL
function openDevToolsPage() {
  let command;
  
  if (platform === 'darwin') {
    command = `open "${devToolsUrls.chrome}"`;
  } else if (platform === 'win32') {
    command = `start "${devToolsUrls.chrome}"`;
  } else if (platform === 'linux') {
    command = `xdg-open "${devToolsUrls.chrome}"`;
  } else {
    console.log('Unable to detect platform. Please visit one of these URLs manually:');
    Object.entries(devToolsUrls).forEach(([browser, url]) => {
      console.log(`${browser}: ${url}`);
    });
    return;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error('Error opening browser:', error);
      console.log('Please visit one of these URLs manually:');
      Object.entries(devToolsUrls).forEach(([browser, url]) => {
        console.log(`${browser}: ${url}`);
      });
    } else {
      console.log('Opening React DevTools installation page...');
      console.log('If you prefer a different browser, visit one of these URLs:');
      Object.entries(devToolsUrls).forEach(([browser, url]) => {
        console.log(`${browser}: ${url}`);
      });
    }
  });
}

openDevToolsPage(); 