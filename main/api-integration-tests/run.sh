#!/bin/bash

echo "Strong suggestion #1: don't cancel a test run with Ctrl+C, this may lead to unstable state of the backend"
echo "Strong suggestion #2: tests were designed with an isolated state in mind, but it's not the case with shared backend. '--runInBand' option is advised to make sure tests run sequentially and wrap up after their execution and the next test hopefully starts with a clean slate."

pnpm run testApiMain -- $*
pnpm run testApiCore -- $*
