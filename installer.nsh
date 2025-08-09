!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro customInit
  ; Custom initialization for database path selection
  !define DB_PATH_REG_KEY "Software\3DP Commander"
  !define DB_PATH_REG_VALUE "DatabasePath"
  
  ; Set default database path to Documents folder
  StrCpy $R0 "$DOCUMENTS\3DP Commander"
  
  ; Try to read existing database path from registry
  ReadRegStr $R1 HKLM "${DB_PATH_REG_KEY}" "${DB_PATH_REG_VALUE}"
  ${If} $R1 != ""
    StrCpy $R0 $R1
  ${EndIf}
  
  ; Store database path for later use
  StrCpy $DB_PATH $R0
!macroend

!macro customInstall
  ; Create database directory if it doesn't exist
  CreateDirectory "$DB_PATH"
  
  ; Write database path to registry
  WriteRegStr HKLM "${DB_PATH_REG_KEY}" "${DB_PATH_REG_VALUE}" "$DB_PATH"
  
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\3DP Commander.lnk" "$INSTDIR\3DP Commander.exe" "" "$INSTDIR\3DP Commander.exe" 0
  
  ; Create start menu shortcut
  CreateDirectory "$SMPROGRAMS\3DP Commander"
  CreateShortCut "$SMPROGRAMS\3DP Commander\3DP Commander.lnk" "$INSTDIR\3DP Commander.exe" "" "$INSTDIR\3DP Commander.exe" 0
  CreateShortCut "$SMPROGRAMS\3DP Commander\Uninstall.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey HKLM "${DB_PATH_REG_KEY}"
  
  ; Remove shortcuts
  Delete "$DESKTOP\3DP Commander.lnk"
  RMDir /r "$SMPROGRAMS\3DP Commander"
!macroend

; Custom pages for installation
!macro customInstallPages
  ; Database location page
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "LICENSE"
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_CUSTOMFUNCTION_PRE DatabaseLocationPage
  !insertmacro MUI_PAGE_CUSTOMFUNCTION_LEAVE DatabaseLocationPageLeave
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
!macroend

; Database location page function
Function DatabaseLocationPage
  !insertmacro MUI_HEADER_TEXT "Database Location" "Choose where to store the application database"
  
  nsDialogs::Create 1018
  Pop $R0
  
  ${If} $R0 == error
    Abort
  ${EndIf}
  
  ; Create group box
  ${NSD_CreateGroupBox} 0 0 100% 60% "Database Location"
  
  ; Create label
  ${NSD_CreateLabel} 10 20 100% 12 "Choose the location where the application database will be stored:"
  
  ; Create directory input
  ${NSD_CreateDirRequest} 10 40 70% 12 $DB_PATH
  Pop $R1
  
  ; Create browse button
  ${NSD_CreateButton} 85% 40 15% 12 "Browse..."
  Pop $R2
  
  ; Set browse button function
  ${NSD_OnClick} $R2 BrowseDatabasePath
  
  nsDialogs::Show
FunctionEnd

Function DatabaseLocationPageLeave
  ; Get the selected database path
  ${NSD_GetText} $R1 $DB_PATH
  
  ; Validate path
  ${If} $DB_PATH == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "Please select a database location."
    Abort
  ${EndIf}
  
  ; Create directory if it doesn't exist
  CreateDirectory "$DB_PATH"
FunctionEnd

Function BrowseDatabasePath
  nsDialogs::SelectFolderDialog "Select Database Location" $DB_PATH
  Pop $R0
  
  ${If} $R0 == "OK"
    ${NSD_SetText} $R1 $R0
  ${EndIf}
FunctionEnd
