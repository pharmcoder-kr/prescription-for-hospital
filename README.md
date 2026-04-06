# 오토시럽 요양병원 (Electron)

요양병원용 시럽 조제기 연결·수동 조제 클라이언트입니다. 기본 [오토시럽](https://github.com/pharmcoder-kr/prescription) 앱과 사용자 데이터 경로가 분리되어 있습니다.

## 개발

```bash
npm install
npm start
```

## Windows 설치 파일 (NSIS)

```bash
npm run build-nsis
```

산출물: `release/auto-syrup-hospital-setup-<버전>.exe`

## GitHub 릴리스 업로드

`GH_TOKEN`(또는 `GITHUB_TOKEN`)에 `repo` 권한을 부여한 뒤:

```bash
npm run build-nsis
npm run release:github
```

## 라이선스

MIT
