const keytar = require('keytar');

async function checkToken() {
  try {
    console.log('===========================================');
    console.log('🔍 토큰 확인');
    console.log('===========================================');
    
    const SERVICE_NAME = 'AutoSyrupLinkHospital';
    const ACCOUNT_NAME = 'device-token';
    
    console.log(`서비스명: ${SERVICE_NAME}`);
    console.log(`계정명: ${ACCOUNT_NAME}`);
    console.log('');
    
    const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    
    if (token) {
      console.log('✅ 토큰 발견!');
      console.log(`토큰 길이: ${token.length}자`);
      console.log(`토큰 앞부분: ${token.substring(0, 50)}...`);
      
      // JWT 디코딩
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(token);
        console.log('');
        console.log('📋 토큰 정보:');
        console.log(`   약국 ID: ${decoded.pharmacy_id}`);
        console.log(`   기기 ID: ${decoded.device_id}`);
        console.log(`   요양기관번호: ${decoded.ykiin}`);
        console.log(`   발급일: ${new Date(decoded.iat * 1000).toLocaleString('ko-KR')}`);
        console.log(`   만료일: ${new Date(decoded.exp * 1000).toLocaleString('ko-KR')}`);
        
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          console.log('');
          console.log('❌ 토큰이 만료되었습니다.');
        } else {
          const daysLeft = Math.floor((decoded.exp - now) / 86400);
          console.log('');
          console.log(`✅ 토큰이 유효합니다. (남은 기간: ${daysLeft}일)`);
        }
      } catch (err) {
        console.log('⚠️ 토큰 디코딩 실패:', err.message);
      }
    } else {
      console.log('❌ 토큰을 찾을 수 없습니다.');
      console.log('');
      console.log('💡 가능한 원인:');
      console.log('   1. 토큰이 저장되지 않았음');
      console.log('   2. 서비스명 또는 계정명이 변경되었음');
      console.log('   3. Windows 자격 증명이 손상됨');
    }
    
    console.log('');
    console.log('===========================================');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkToken();

