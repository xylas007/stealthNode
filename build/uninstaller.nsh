!macro customUnInstall
  ; Force kill the app to ensure no files are locked during uninstallation
  ExecWait "taskkill /F /IM StealthNode.exe /T"
!macroend
