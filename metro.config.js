const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Let Metro watch files outside the project root (the shared/ folder)
config.watchFolders = [workspaceRoot];

// Allow Metro to resolve modules from the workspace root as well
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Treat uppercase .MP3 as an audio asset (Metro only recognises lowercase by default)
config.resolver.assetExts = [...config.resolver.assetExts, 'MP3'];

module.exports = config;
