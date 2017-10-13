@echo off

if %APPVEYOR_REPO_BRANCH% == master (
  if %GITHUB_TOKEN% neq "" (
    npm run prebuild -- -u %GITHUB_TOKEN%
  )
)
