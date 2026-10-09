#!/usr/bin/env node
import { ensureServer } from './bootstrap.js';
await ensureServer();
await import('./mcp.js');
