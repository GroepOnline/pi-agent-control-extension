#!/usr/bin/env bash
set -e

echo "Running E2E Extension Check..."
npm run check

echo "Running Python Validation..."
npm run validate

echo "E2E Tests Passed!"
