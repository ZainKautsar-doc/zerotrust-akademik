@echo off
title Backend Zero Trust Academic System
cd /d "%~dp0"
echo Starting Backend Services...
node startAll.js
pause
