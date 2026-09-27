@echo off
echo Building UnitView 5.3.0-c Windows installer...

echo Installing dependencies...
call npm install
call npm run postinstall

echo Building application and NSIS installer...
call npm run dist:win

echo.
echo Installer: release\UnitView-Setup-5.3.0-c.exe
echo Portable:  release\win-unpacked\UnitView.exe
echo.
pause
