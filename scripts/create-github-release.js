/**
 * NSIS 산출물을 GitHub Releases에 업로드합니다.
 * 환경 변수: GH_TOKEN 또는 GITHUB_TOKEN (repo 권한)
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OWNER = 'pharmcoder-kr';
const REPO = 'prescription-for-hospital';

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);
const VERSION = pkg.version;
const TAG = `v${VERSION}`;
const setupName = `auto-syrup-hospital-setup-${VERSION}.exe`;

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('GH_TOKEN 또는 GITHUB_TOKEN 환경 변수가 필요합니다.');
    process.exit(1);
  }

  const releaseDir = path.join(__dirname, '..', 'release');
  const setupPath = path.join(releaseDir, setupName);
  if (!fs.existsSync(setupPath)) {
    console.error(`설치 파일이 없습니다: ${setupPath}`);
    console.error('먼저 npm run build-nsis 를 실행하세요.');
    process.exit(1);
  }

  const body = `## 오토시럽 요양병원 v${VERSION}

- Windows x64 NSIS 설치 프로그램
- [저장소](https://github.com/${OWNER}/${REPO})

### 설치
아래 \`${setupName}\` 파일을 내려받아 실행하세요.
`;

  console.log(`Repository: ${OWNER}/${REPO}`);
  console.log(`Tag: ${TAG}`);
  console.log(`Upload: ${setupName}`);

  const api = axios.create({
    baseURL: `https://api.github.com/repos/${OWNER}/${REPO}`,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  let release;
  try {
    const { data } = await api.post('/releases', {
      tag_name: TAG,
      name: `오토시럽 요양병원 v${VERSION}`,
      body,
      draft: false,
      prerelease: false
    });
    release = data;
  } catch (e) {
    if (e.response?.status === 422) {
      const msg = e.response.data?.errors?.[0]?.message || '';
      if (msg.includes('already exists') || e.response.data?.message?.includes('already exists')) {
        const { data: list } = await api.get('/releases', { params: { per_page: 20 } });
        release = list.find((r) => r.tag_name === TAG);
        if (!release) throw e;
        console.log('동일 태그 릴리스가 있어 기존 릴리스에 자산을 추가합니다.');
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }

  const uploadBase = release.upload_url.replace(/\{\?.*\}$/, '');
  const upload = async (filePath, label) => {
    const name = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`건너뜀 (없음): ${filePath}`);
      return;
    }
    const buf = fs.readFileSync(filePath);
    const url = `${uploadBase}?name=${encodeURIComponent(name)}`;
    await axios.post(url, buf, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': buf.length
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    console.log(`업로드 완료: ${label || name}`);
  };

  await upload(setupPath, setupName);

  const blockmap = path.join(releaseDir, `${setupName}.blockmap`);
  const latestYml = path.join(releaseDir, 'latest.yml');
  await upload(blockmap);
  await upload(latestYml);

  console.log('');
  console.log('릴리스 URL:', release.html_url);
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
