@echo off
cd /d "%~dp0"
echo Fetching hotel pictures from the links in js\hotels.js (needs internet)...
where python >nul 2>nul && (python tools\fetch_images.py) || (py tools\fetch_images.py)
echo.
echo Done. Open index.html to see the result.
pause
