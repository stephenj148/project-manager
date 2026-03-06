#!/bin/bash
export PATH="/tmp/node-install/bin:$PATH"
cd "$(dirname "$0")"
node /tmp/node-install/lib/node_modules/npm/bin/npm-cli.js run dev
