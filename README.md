# kidsDailyBook - 알림장 책 생성

알림장 A / B / C 타입의 책을 생성하는 웹앱입니다.
JSON 데이터를 업로드하거나, 웹에서 직접 입력하여 알림장 포토북을 만들 수 있습니다.

![screenshot](screenshot.png)

## 구조

```
├── index.html              # 메인 앱
├── app.js                  # 앱 로직 (UI, 책 생성 플로우, 직접 입력)
├── book-builder.js         # entries 변환, 파라미터 빌더 (A/B/C 타입별)
├── alrimjang-config.js     # 템플릿 매핑, 월별 색상/아이콘, 그래픽 리소스
├── style.css               # 스타일
├── sweetbook-sdk-core.js   # Sweetbook API SDK (core)
├── sweetbook-sdk-user.js   # Sweetbook API SDK (user)
├── config.example.js       # 설정 템플릿
├── config.js               # 실제 설정 (git 제외)
├── server.js               # 로컬 서버
├── 알림장A/
│   ├── templates/          # A 템플릿 CSV, 그래픽 CSV
│   └── samples/            # A 샘플 JSON 데이터
├── 알림장B/
│   ├── templates/          # B 템플릿 CSV, 그래픽 CSV
│   └── samples/            # B 샘플 JSON 데이터
└── 알림장C/
    ├── templates/          # C 템플릿 CSV, 그래픽 CSV
    └── samples/            # C 샘플 JSON 데이터
```

## 설정

1. `config.example.js`를 `config.js`로 복사합니다:

```bash
cp config.example.js config.js
```

2. `config.js`에 환경별 API 키를 설정합니다:

```js
const APP_CONFIG = {
    environments: {
        live: { label: '운영', url: 'https://api.sweetbook.com/v1', apiKey: '운영 API Key' },
        sandbox: { label: '샌드박스', url: 'https://api-sandbox.sweetbook.com/v1', apiKey: '샌드박스 API Key' },
    },
    defaultEnv: 'sandbox',
    useCookie: false,
};
```

## 실행

```bash
node server.js
```

접속: http://localhost:8080

## 환경 (샌드박스 / 운영)

앱에서 **환경**을 선택할 수 있습니다:

- **샌드박스** (기본값): 테스트 환경. 생성된 책은 sandbox에만 존재하며, 운영 데이터에 영향 없음.
- **운영**: 실제 운영 환경. 운영 API Key가 필요합니다.

> **운영 환경에서는 실제 운영 데이터에 영향을 줍니다.**

## 사용법

### JSON 데이터로 생성

1. 브라우저에서 http://localhost:8080 접속
2. 알림장 타입 선택 (A / B / C)
3. **JSON 파일 업로드** 모드에서 샘플 데이터 업로드:
   - `알림장A/samples/알림장A_이안.json` — 알림장A 샘플 (실제 데이터)
   - `알림장B/samples/알림장B_이안.json` — 알림장B 샘플
   - `알림장C/samples/알림장C_이안.json` — 알림장C 샘플
4. 표지/발행면 정보가 자동 입력됨 → 필요시 수정
5. **알림장 책 생성하기** 클릭

### 직접 입력으로 생성

1. **직접 입력** 모드로 전환
2. 날짜, 날씨, 식사량, 낮잠, 선생님 코멘트 등 입력
3. 사진 파일 선택 (여러 장 가능)
4. **항목 추가** → 원하는 만큼 반복
5. 표지 사진 선택 (선택사항)
6. **알림장 책 생성하기** 클릭

### JSON 데이터 형식

```json
{
  "title": "이안이의 성장 스토리북",
  "cover": {
    "childName": "이안이",
    "schoolName": "스위트어린이집",
    "volumeLabel": "Vol.1",
    "periodText": "2026년 1월 ~ 2026년 4월",
    "coverPhoto": "https://..."
  },
  "publish": {
    "title": "이안이의 성장 스토리북",
    "publishDate": "2026년 3월 6일",
    "author": "김수진",
    "hashtags": "#포토북은 #역시 #스위트북"
  },
  "entries": [
    { "type": "ganji", "year": 2026, "month": 1 },
    {
      "type": "naeji", "year": 2026, "month": 1,
      "day_data": {
        "date": "6일", "dayOfWeek": "화",
        "weather": "맑음", "meal": "정량", "nap": "2시간",
        "teacherComment": "오늘 창의 활동에서...",
        "parentComment": "집에서도 잘 지내고 있어요",
        "photos": ["https://..."]
      }
    }
  ]
}
```

## 샘플 데이터

| 타입 | 샘플 | 설명 |
|------|------|------|
| 알림장A | [알림장A_이안.json](알림장A/samples/알림장A_이안.json) | 4개월 67 entries, 월별 색상 라인 시안 |
| 알림장B | [알림장B_이안.json](알림장B/samples/알림장B_이안.json) | 4개월 54 entries, 월별 캐릭터 시안 |
| 알림장C | [알림장C_이안.json](알림장C/samples/알림장C_이안.json) | 4개월 74 entries, 월별 풍선 아이콘 시안 |

## 커스터마이징

이 데모를 자신의 서비스에 맞게 수정하려면:

| 파일 | 수정 내용 |
|------|----------|
| `alrimjang-config.js` | 템플릿 UID 변경, 월별 색상/아이콘 수정 |
| `book-builder.js` | 파라미터 빌더 수정, entries 변환 로직 변경 |
| `app.js` | UI 흐름 변경, 직접 입력 폼 필드 추가/제거 |
| `config.js` | API 키, 서버 URL 설정 |

### 자신의 데이터 형식 적용

1. `book-builder.js`의 `buildEntries()` 함수에서 dataItems를 entries 배열로 변환하는 로직을 수정합니다.
2. `alrimjang-config.js`에서 자신의 템플릿 UID를 등록합니다.
3. 필요시 `app.js`의 `handleFile()`에서 JSON 파싱/검증 로직을 수정합니다.

## 주의사항

> ⚠️ **프로덕션 주의**: `server.js`의 CORS 설정은 `Access-Control-Allow-Origin: *`로 모든 origin을 허용합니다.
> 이는 로컬 개발용이며, 프로덕션 환경에서는 반드시 허용할 origin을 제한하세요.
