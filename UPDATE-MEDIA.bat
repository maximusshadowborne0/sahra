@echo off
cd /d "%~dp0"
echo Importing photos and videos from the Data folder...
where python >nul 2>nul && (python tools\import_data.py Data) || (py tools\import_data.py Data)
echo.
echo Done. Open index.html to see the result.
pause
