// Metro config for the pnpm monorepo — lets Metro watch the workspace root
// and resolve the hoisted node_modules (and packages/core, once extracted).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Keep hierarchical lookup ON: pnpm nests some transitive deps (e.g.
// @expo/metro-runtime under expo-router) and Metro must walk up to find them.

module.exports = config;
