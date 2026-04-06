const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const APP_ID = 'kr.pharmcoder.prescription.hospital'; // package.json build.appId와 반드시 동일 (기본 오토시럽과 분리)

// ⚠️ Windows 작업표시줄 아이콘/토스트/점프리스트 일관성을 위해 AppID를 가장 먼저 지정
app.setAppUserModelId(APP_ID);

let mainWindow;
const isDev = !app.isPackaged;

const DEVICE_UID_FILE = path.join(app.getPath('userData'), 'device-uid.txt');
let deviceUid = '';

// 디바이스 UID (로컬 기기 식별용 — 요양병원 빌드는 서버 로그인 없음)
async function getOrCreateDeviceUid() {
  if (deviceUid) return deviceUid;

  try {
    if (fs.existsSync(DEVICE_UID_FILE)) {
      deviceUid = fs.readFileSync(DEVICE_UID_FILE, 'utf8').trim();
    } else {
      deviceUid = uuidv4();
      fs.writeFileSync(DEVICE_UID_FILE, deviceUid, 'utf8');
    }
    return deviceUid;
  } catch (error) {
    console.error('디바이스 UID 생성/로드 오류:', error);
    deviceUid = uuidv4();
    return deviceUid;
  }
}

// 아이콘 절대경로 도우미
function getIconPath() {
  if (isDev) {
    // 개발 모드: 현재 디렉토리의 assets 폴더 사용
    return path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  } else {
    // 프로덕션 모드: process.resourcesPath/assets 사용
    return path.join(process.resourcesPath, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  }
}

// 자동 업데이트 설정
autoUpdater.autoDownload = false; // 자동 다운로드 비활성화 (사용자 선택하게)
autoUpdater.autoInstallOnAppQuit = true; // 앱 종료 시 자동 설치

// 효율적인 업데이트를 위한 설정
autoUpdater.allowDowngrade = false; // 다운그레이드 방지
autoUpdater.allowPrerelease = false; // 프리릴리즈 버전 방지

// 개발 환경에서는 업데이트 확인 안 함
if (!app.isPackaged) {
  autoUpdater.forceDevUpdateConfig = false;
}

// 업데이트 관련 이벤트 핸들러
autoUpdater.on('checking-for-update', () => {
  console.log('업데이트 확인 중...');
});

autoUpdater.on('update-available', (info) => {
  console.log('업데이트 사용 가능:', info.version);
  // 렌더러 프로세스로 업데이트 정보 전달
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('최신 버전입니다.');
});

autoUpdater.on('error', (err) => {
  console.error('업데이트 오류:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`다운로드 진행: ${progressObj.percent}%`);
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('업데이트 다운로드 완료');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

function createWindow() {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    // ⬇⬇⬇ 작업표시줄 아이콘은 여기 icon 값으로 결정됨(Windows는 .ico 강력 권장)
    icon: getIconPath(),
    title: '오토시럽 병원용',
    show: false,
    autoHideMenuBar: true,
    menuBarVisible: false
  });

  // 윈도우가 준비되면 표시하고 최대화
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize(); // 앱 시작 시 최대화
    
    // Windows 작업표시줄 아이콘 강제 설정
    if (process.platform === 'win32') {
      mainWindow.setIcon(getIconPath());
    }
  });

  // HTML 파일 로드
  mainWindow.loadFile('index.html');

  // 외부 링크는 브라우저로
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 개발 모드에서 DevTools 열기
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(async () => {
  // 메뉴바 완전 제거
  Menu.setApplicationMenu(null);
  
  // Windows 작업표시줄 아이콘 강제 설정 (앱 시작 시)
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
  }
  
  // 디바이스 UID 초기화
  await getOrCreateDeviceUid();
  
  // 메인 윈도우 생성 (즉시 표시)
  createWindow();
});

// 앱 시작 5초 후 업데이트 확인 (패키징된 앱에서만)
setTimeout(() => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
}, 5000);

// 모든 윈도우가 닫히면 앱 종료
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 핸들러들
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// 모든 네트워크 인터페이스 가져오기
ipcMain.handle('get-all-network-info', async () => {
  try {
    const interfaces = os.networkInterfaces();
    const availableNetworks = [];
    
    // 모든 네트워크 인터페이스 수집
    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        // IPv4이고 로컬호스트가 아닌 인터페이스 찾기
        if (net.family === 'IPv4' && !net.internal) {
          const ipParts = net.address.split('.');
          const prefix = ipParts.slice(0, 3).join('.') + '.';
          availableNetworks.push({
            interface: name,
            address: net.address,
            prefix: prefix,
            netmask: net.netmask
          });
        }
      }
    }
    
    return availableNetworks;
  } catch (error) {
    console.error('네트워크 정보 가져오기 실패:', error);
    return [];
  }
});

ipcMain.handle('get-network-info', async () => {
  try {
    const interfaces = os.networkInterfaces();
    const availableNetworks = [];
    
    // 모든 네트워크 인터페이스 수집
    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        // IPv4이고 로컬호스트가 아닌 인터페이스 찾기
        if (net.family === 'IPv4' && !net.internal) {
          const ipParts = net.address.split('.');
          const prefix = ipParts.slice(0, 3).join('.') + '.';
          availableNetworks.push({
            interface: name,
            address: net.address,
            prefix: prefix,
            netmask: net.netmask
          });
        }
      }
    }
    
    if (availableNetworks.length === 0) {
      return null;
    }
    
    // 우선순위에 따라 정렬:
    // 1. Wi-Fi 인터페이스 우선
    // 2. 이더넷 인터페이스
    // 3. 기타 인터페이스
    // 4. 가상 어댑터나 특수 인터페이스는 낮은 우선순위 (VMware, VirtualBox, Hyper-V 등)
    const priorityOrder = (net) => {
      const name = net.interface.toLowerCase();
      // 가상 어댑터는 낮은 우선순위
      if (name.includes('vmware') || name.includes('virtualbox') || 
          name.includes('hyper-v') || name.includes('vpn') ||
          name.includes('tunnel') || name.includes('loopback')) {
        return 100;
      }
      // Wi-Fi 우선
      if (name.includes('wi-fi') || name.includes('wlan') || name.includes('wireless')) {
        return 1;
      }
      // 이더넷
      if (name.includes('ethernet') || name.includes('eth') || name.includes('lan')) {
        return 2;
      }
      // 기타
      return 10;
    };
    
    availableNetworks.sort((a, b) => priorityOrder(a) - priorityOrder(b));
    
    // 가장 우선순위가 높은 네트워크 반환
    return availableNetworks[0];
  } catch (error) {
    console.error('네트워크 정보 가져오기 실패:', error);
    return null;
  }
});

ipcMain.handle('show-message', async (event, options) => {
  const { type, title, message } = options;
  const dialogOptions = {
    type: type || 'info',
    title: title || '알림',
    message: message || '',
    buttons: ['확인']
  };
  
  const result = await dialog.showMessageBox(mainWindow, dialogOptions);
  return result.response;
});

ipcMain.handle('show-error', async (event, message) => {
  const result = await dialog.showErrorBox('오류', message);
  return result;
});

// 사용자 데이터 경로 가져오기
ipcMain.handle('get-user-data-path', async () => {
  return app.getPath('userData');
});

// 업데이트 관련 IPC 핸들러
ipcMain.handle('check-for-updates', async () => {
  if (app.isPackaged) {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: result.updateInfo };
    } catch (error) {
      console.error('업데이트 확인 오류:', error);
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: '개발 모드에서는 업데이트를 확인할 수 없습니다.' };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('업데이트 다운로드 오류:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  // 앱을 종료하고 업데이트 설치
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ============================================
// 인증 관련 IPC 핸들러
// ============================================

ipcMain.handle('enroll:submit', async () => ({
  success: false,
  error: '요양병원용에서는 서버 등록을 사용하지 않습니다.'
}));

ipcMain.on('enroll:complete', () => {});

ipcMain.on('enroll:skip', () => {});

// 요양병원: 서버 로그인·회원가입 UI 없음 — 렌더러는 로컬 전용으로 동작
ipcMain.handle('auth:get-token', async () => null);

ipcMain.handle('auth:is-enrolled', async () => true);

ipcMain.handle('auth:show-enroll', () => {});

ipcMain.handle('auth:show-login', () => {});

ipcMain.handle('auth:show-register', () => {});

ipcMain.on('auth:show-register', () => {});

ipcMain.on('auth:show-login', () => {});

ipcMain.handle('auth:register', async () => ({
  success: false,
  error: '요양병원용에서는 회원가입을 사용하지 않습니다.'
}));

ipcMain.on('auth:register-complete', () => {});

ipcMain.handle('auth:login', async () => ({
  success: false,
  error: '요양병원용에서는 로그인을 사용하지 않습니다.'
}));

ipcMain.on('auth:login-complete', () => {});

ipcMain.on('auth:skip-login', () => {});

ipcMain.handle('auth:get-saved-credentials', () => null);

ipcMain.handle('auth:logout', async () => ({ success: true }));

// 요양병원: 서버로 파싱 이벤트를 보내지 않음
ipcMain.handle('api:send-batch-parse-events', async () => ({
  success: false,
  error: 'not_supported'
}));

ipcMain.handle('api:send-parse-event', async () => ({
  success: false,
  error: 'not_supported'
})); 