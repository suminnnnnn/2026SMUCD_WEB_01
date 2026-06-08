# 2026 상명대 커뮤니케이션디자인학과 제39회 졸업전시 웹사이트

전시 테마: **지우고, 다시 쓰고, 반복하는**

1단계 — 순수 HTML / CSS / 바닐라 JS 디자인 초안. (2단계에서 Eleventy 이관 예정)

## 실행 방법
`data/*.json` 을 `fetch` 로 불러오므로 **정적 서버**가 필요합니다 (`file://` 직접 열기는 차단됨).

- VS Code: **Live Server** 확장에서 `index.html` → "Open with Live Server"
- 또는 터미널:
  ```bash
  python3 -m http.server 8000
  # http://localhost:8000 접속
  ```

## 구조
```
├── index.html              Home (포스터·졸준위·지도교수·협찬)
├── works.html              Works 목록 (스튜디오 분할 ↔ 선택 + 교수 필터)
├── work-detail.html        작품 상세 (Works·Designer 공용, ?id= 로 분기)
├── designer.html           Designer 목록 (ㄱㄴㄷ 초성 필터)
├── designer-detail.html    Designer 상세 (?id= 로 분기)
├── archive.html            Archive (이미지·영상)
├── css/style.css           디자인 시스템 전체
├── js/main.js              네비 활성·카드 렌더·필터·상세 바인딩
├── data/                   site.json · works.json · designers.json (샘플)
└── assets/                 images / logo / fonts (이미지 미배치 시 체크무늬 placeholder)
```

## 동작
- 헤더/푸터는 전 페이지 동일 (복붙) → 추후 11ty `base.njk` 1개로 합침
- 카드(작품·디자이너)는 JSON + JS 렌더 → 추후 `_data` + 템플릿으로 이동
- 이미지가 없으면 체크무늬 placeholder, 있으면 자동 표시 (`assets/images/...` 에 실제 파일 배치)

## 11ty 이관 시
- `data/` → `src/_data/` 거의 그대로 이동
- `js/main.js` 의 `workCard` / `designerCard` 렌더 함수 → `_includes/card.njk`
- `work-detail.html` / `designer-detail.html` → pagination 으로 작품·디자이너 수만큼 자동 생성
- 푸터/헤더 공통 정보 → `site.json` 한 곳에서 관리 (이미 `data/site.json` 에 정리됨)

## TODO (PRD §9)
- Home 포스터·전시 설명·찾아오는 길 (현재 placeholder)
- Archive 전시장 이미지/영상
- 협찬사 로고 / 졸준위 명단 세부
- 실제 작품·디자이너 데이터 (현재 샘플)
