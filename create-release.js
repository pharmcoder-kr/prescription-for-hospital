const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OWNER = 'pharmcoder-kr';
const REPO = 'prescription';
const VERSION = '1.3.9';
const TAG = `v${VERSION}`;

async function createRelease() {
  if (!GITHUB_TOKEN) {
    console.error('??GitHub Token???„ìš”?©ë‹ˆ??');
    console.error('?˜ê²½ ë³€??GH_TOKEN ?ëŠ” GITHUB_TOKEN???¤ì •?´ì£¼?¸ìš”.');
    process.exit(1);
  }

  const releaseNotes = `## ì£¼ìš” ë³€ê²½ì‚¬??

### ?¨ UI ê°œì„ 
- **?¤ì • ?”ë©´ ê°„ì†Œ??*: ë¶ˆí•„?”í•œ ?„ë¡œê·¸ë¨ë³??¹ì§• ?•ë³´ ë°•ìŠ¤ ?œê±°
- **ì²˜ë°©ì¡°ì œ?„ë¡œê·¸ë¨ ? íƒ ê°œì„ **: ? íŒœ ?µì…˜ ?œê±° (ê³„ì•½ ì§„í–‰ ì¤?

### ?”§ ê¸°ìˆ ??ê°œì„ 
- ?¤ì • ?”ë©´ UI ?•ë¦¬ ë°?ìµœì ??
- ?¬ìš©???¼ë???ì¤„ì´ê¸??„í•œ ?¸í„°?˜ì´??ê°œì„ 

## ?¤ì¹˜ ë°©ë²•
?„ë˜??\`auto-syrup-setup-${VERSION}.exe\` ?Œì¼???¤ìš´ë¡œë“œ?˜ì—¬ ?¤í–‰?˜ì„¸??

## ?…ë°?´íŠ¸ ë°©ë²•
ê¸°ì¡´ ?¬ìš©?ëŠ” ?„ë¡œê·¸ë¨ ?¤í–‰ ???ë™?¼ë¡œ ?…ë°?´íŠ¸ ?Œë¦¼??ë°›ìŠµ?ˆë‹¤.`;

  try {
    console.log('===========================================');
    console.log('?“¦ GitHub Release ?ì„± ?œì‘');
    console.log('===========================================');
    console.log(`Repository: ${OWNER}/${REPO}`);
    console.log(`Version: ${VERSION}`);
    console.log(`Tag: ${TAG}`);
    console.log('');

    // 1. Draft Release ?ì„±
    console.log('1ï¸âƒ£  Draft Release ?ì„± ì¤?..');
    const releaseResponse = await axios.post(
      `https://api.github.com/repos/${OWNER}/${REPO}/releases`,
      {
        tag_name: TAG,
        name: `v${VERSION} - UI ê°œì„ `,
        body: releaseNotes,
        draft: true,
        prerelease: false
      },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const releaseId = releaseResponse.data.id;
    const uploadUrl = releaseResponse.data.upload_url.replace('{?name,label}', '');
    console.log(`??Draft Release ?ì„± ?„ë£Œ (ID: ${releaseId})`);
    console.log('');

    // 2. ?Œì¼ ?…ë¡œ??
    const filesToUpload = [
      {
        path: `release/auto-syrup-setup-${VERSION}.exe`,
        name: `auto-syrup-setup-${VERSION}.exe`,
        contentType: 'application/x-msdownload'
      },
      {
        path: `release/auto-syrup-setup-${VERSION}.exe.blockmap`,
        name: `auto-syrup-setup-${VERSION}.exe.blockmap`,
        contentType: 'application/octet-stream'
      },
      {
        path: 'release/latest.yml',
        name: 'latest.yml',
        contentType: 'text/yaml'
      }
    ];

    console.log('2ï¸âƒ£  ?Œì¼ ?…ë¡œ??ì¤?..');
    for (const file of filesToUpload) {
      if (!fs.existsSync(file.path)) {
        console.log(`? ï¸  ?Œì¼ ?†ìŒ: ${file.path}`);
        continue;
      }

      const fileData = fs.readFileSync(file.path);
      const fileSize = fs.statSync(file.path).size;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

      console.log(`   ?…ë¡œ?? ${file.name} (${fileSizeMB} MB)`);

      await axios.post(
        `${uploadUrl}?name=${encodeURIComponent(file.name)}`,
        fileData,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': file.contentType,
            'Content-Length': fileSize
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log(`   ???…ë¡œ???„ë£Œ: ${file.name}`);
    }

    console.log('');
    console.log('===========================================');
    console.log('??Release ?ì„± ?„ë£Œ!');
    console.log('===========================================');
    console.log('');
    console.log('?”— Release URL:');
    console.log(`   ${releaseResponse.data.html_url}`);
    console.log('');
    console.log('?’¡ ?¤ìŒ ?¨ê³„:');
    console.log('   1. ??URLë¡??´ë™?˜ì—¬ Release ?´ìš© ?•ì¸');
    console.log('   2. "Publish release" ë²„íŠ¼ ?´ë¦­?˜ì—¬ ê³µê°œ');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('??Release ?ì„± ?¤íŒ¨:', error.message);
    if (error.response) {
      console.error('?íƒœ ì½”ë“œ:', error.response.status);
      console.error('?‘ë‹µ ?°ì´??', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createRelease();

