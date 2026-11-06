@echo off
chcp 65001 > nul
echo ===================================================
echo        COMPILADOR DO APLICATIVO ANDROID (APK)
echo                   ROMUS MOBILE
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Sincronizando arquivos nativos...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao sincronizar o projeto Android.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Compilando pacote nativo com Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] O Gradle precisa do Java JDK para compilar o APK localmente.
    echo Caso ainda nao tenha o JDK instalado no seu computador, voce pode instalar com:
    echo   winget install Microsoft.OpenJDK.21
    echo Ou abrir o projeto diretamente no Android Studio na pasta:
    echo   mobile\android
    echo.
    pause
    exit /b %ERRORLEVEL%
)

cd ..
echo.
echo [3/3] Copiando APK gerado para a pasta mobile...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "ROMUS.apk" > nul

echo.
echo ===================================================
echo  ✓ SUCESSO! APK GERADO COM EXITO:
echo    mobile\ROMUS.apk
echo.
echo  Envie esse arquivo ROMUS.apk para o seu celular
echo  (via WhatsApp, Google Drive ou cabo USB) e toque
echo  nele para instalar o aplicativo no celular!
echo ===================================================
pause
