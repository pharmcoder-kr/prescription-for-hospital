const fs = require('fs');
const path = require('path');
const keytar = require('keytar');
const { app } = require('electron');

const SERVICE_NAME = 'AutoSyrupLinkHospital';
const ACCOUNT_NAME = 'device-token';

async function resetLocalData() {
  console.log('===========================================');
  console.log('🗑️  로컬 데이터 초기화');
  console.log('===========================================');
  console.log('');
  
  let deletedCount = 0;
  
  // 1. keytar에서 토큰 삭제
  try {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    console.log('✅ keytar 토큰 삭제됨');
    deletedCount++;
  } catch (error) {
    console.log('⚠️  keytar 토큰 없음 또는 삭제 실패');
  }
  
  // 2. 파일 삭제 목록
  const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'auto-syrup-hospital');
  
  const filesToDelete = [
    path.join(userDataPath, 'auth-token.txt'),
    path.join(userDataPath, 'device-uid.txt'),
    path.join(userDataPath, 'pharmacy-status.txt'),
    path.join(userDataPath, 'connections.json'),
    path.join(userDataPath, 'prescription_path.txt'),
    path.join(userDataPath, 'prescription_program_settings.json'),
    path.join(userDataPath, 'auto_dispensing_settings.json'),
  ];
  
  console.log('');
  console.log('📁 파일 삭제 중...');
  
  for (const filePath of filesToDelete) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✅ ${path.basename(filePath)} 삭제됨`);
        deletedCount++;
      } else {
        console.log(`   ⚠️  ${path.basename(filePath)} 없음`);
      }
    } catch (error) {
      console.log(`   ❌ ${path.basename(filePath)} 삭제 실패:`, error.message);
    }
  }
  
  console.log('');
  console.log('===========================================');
  console.log(`✅ 초기화 완료! (${deletedCount}개 항목 삭제)`);
  console.log('===========================================');
  console.log('');
  console.log('💡 이제 프로그램을 다시 시작하면 처음 상태로 돌아갑니다.');
  console.log('');
}

// Electron 앱이 아닌 경우 직접 실행
if (!app || !app.whenReady) {
  // userData 경로 수동 설정
  const userDataPath = path.join(process.env.APPDATA || process.env.HOME, 'auto-syrup-hospital');
  
  (async () => {
    console.log('===========================================');
    console.log('🗑️  로컬 데이터 초기화 (독립 실행)');
    console.log('===========================================');
    console.log('');
    
    let deletedCount = 0;
    
    // 1. keytar에서 토큰 삭제
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      console.log('✅ keytar 토큰 삭제됨');
      deletedCount++;
    } catch (error) {
      console.log('⚠️  keytar 토큰 없음 또는 삭제 실패');
    }
    
    // 2. 파일 삭제
    const filesToDelete = [
      path.join(userDataPath, 'auth-token.txt'),
      path.join(userDataPath, 'device-uid.txt'),
      path.join(userDataPath, 'pharmacy-status.txt'),
      path.join(userDataPath, 'connections.json'),
      path.join(userDataPath, 'prescription_path.txt'),
      path.join(userDataPath, 'prescription_program_settings.json'),
      path.join(userDataPath, 'auto_dispensing_settings.json'),
    ];
    
    console.log('');
    console.log('📁 파일 삭제 중...');
    console.log(`   경로: ${userDataPath}`);
    console.log('');
    
    for (const filePath of filesToDelete) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`   ✅ ${path.basename(filePath)} 삭제됨`);
          deletedCount++;
        } else {
          console.log(`   ⚠️  ${path.basename(filePath)} 없음`);
        }
      } catch (error) {
        console.log(`   ❌ ${path.basename(filePath)} 삭제 실패:`, error.message);
      }
    }
    
    console.log('');
    console.log('===========================================');
    console.log(`✅ 초기화 완료! (${deletedCount}개 항목 삭제)`);
    console.log('===========================================');
    console.log('');
    console.log('💡 이제 프로그램을 다시 시작하면 처음 상태로 돌아갑니다.');
    console.log('');
  })();
} else {
  app.whenReady().then(resetLocalData);
}


