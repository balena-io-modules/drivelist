#!/bin/bash

if [[ $GITHUB_TOKEN ]]; then
  npm run prebuild -- -u "$GITHUB_TOKEN"
fi
