@echo off
echo Building Unitview Windows installer...

echo Installing dependencies...
call npm install
call npm run postinstall

echo Building application and NSIS installer...
call npm run dist:win

echo.
echo Installer: release\Unitview-Setup-<version>.exe  ^(see package.json^)
echo Portable:  release\win-unpacked\Unitview.exe
echo.
pause
