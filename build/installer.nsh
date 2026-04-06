; NSIS — 요양병원용 바로가기 (실행 파일: 오토시럽요양병원.exe)

!macro customInstall
  StrCpy $R1 "$INSTDIR\오토시럽요양병원.exe"
  IfFileExists $R1 0 +2
  Goto FoundExe
  StrCpy $R1 "$INSTDIR\auto-syrup-hospital.exe"
  FoundExe:

  StrCpy $R0 "$INSTDIR\resources\icon.ico"
  StrCpy $R2 "$INSTDIR\resources\assets\icon.ico"
  StrCpy $R3 "$INSTDIR\icon.ico"

  Delete "$DESKTOP\오토시럽 요양병원.lnk"
  Delete "$SMPROGRAMS\오토시럽 요양병원\오토시럽 요양병원.lnk"
  RMDir /r "$SMPROGRAMS\오토시럽 요양병원"

  CreateDirectory "$SMPROGRAMS\오토시럽 요양병원"

  StrCpy $R4 $R1

  IfFileExists $R0 UseIcon0
  IfFileExists $R2 UseIcon2
  IfFileExists $R3 UseIcon3
  Goto CreateShortcuts

  UseIcon0:
    StrCpy $R4 $R0
    Goto CreateShortcuts
  UseIcon2:
    StrCpy $R4 $R2
    Goto CreateShortcuts
  UseIcon3:
    StrCpy $R4 $R3

  CreateShortcuts:
    CreateShortCut "$DESKTOP\오토시럽 요양병원.lnk" $R1 "" $R4 0 SW_SHOWNORMAL "" "오토시럽 요양병원"
    CreateShortCut "$SMPROGRAMS\오토시럽 요양병원\오토시럽 요양병원.lnk" $R1 "" $R4 0 SW_SHOWNORMAL "" "오토시럽 요양병원"
    System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  Delete "$DESKTOP\오토시럽 요양병원.lnk"
  Delete "$SMPROGRAMS\오토시럽 요양병원\오토시럽 요양병원.lnk"
  RMDir  "$SMPROGRAMS\오토시럽 요양병원"
!macroend
