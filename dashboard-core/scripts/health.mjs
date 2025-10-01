#!/usr/bin/env node
import { collectHealth } from '../modules/agent/health.js';

const data = collectHealth();
process.stdout.write(JSON.stringify(data, null, 2) + '\n');
