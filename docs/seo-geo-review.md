# SEO·GEO 적용 및 검증 기록

기준일: 2026-09-07. 대상: https://axone.ai.kr. 작업 브랜치: `feat/seo-geo`.

사용자가 지정한 `C:\VS CODE, CURSOR PRJECT\##기술개발참고자료\SEO_GEO_Guide\SEO_GEO_GUIDE.md`를 기준으로 기존 사이트를 진단하고 적용했다. 검색 서비스의 최신 공식 문서와 다른 항목은 아래 근거에 따라 조정했다.

## 변경 전후

| 항목 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 공개 URL | 주요 페이지 8개, 데모 19개 | 서비스 상세 12개와 AI 도입 가이드 추가, 총 40개 |
| 서비스 정보 | 모달을 열어야 상세 정보 확인 | 기존 모달 유지, 별도 URL에서 제공 범위·비용·절차·FAQ 확인 |
| 메타정보 | 페이지별 OG URL이 홈페이지로 통일 | 모든 공개 페이지에 고유 제목·설명·canonical·OG·Twitter 정보 |
| 회사 정보 | 부천 주소 | 서울특별시 영등포구 국회대로66길 17, 10층 |
| 구조화 데이터 | 데모 19개에 JSON-LD 없음, 서비스 목록이 전역에 반복 | 전 사이트 Organization·WebSite, 내부 페이지 BreadcrumbList, 서비스 Service, 가이드 Article, 데모 CreativeWork |
| 제목 구조 | 데모 17개에 H1 없음 | 공개 페이지별 H1 하나, 제목 위계 보완 |
| FAQ | 클라이언트 상호작용 | 초기 HTML에 문답 출력, JS 없이 열리는 details, 같은 데이터로 FAQPage 생성 |
| robots.txt | 일반 봇의 렌더링 자원 차단, 봇별 제외 경로 불일치 | CSS·JS 접근 허용, 모든 봇에 API·관리자 제외 경로 적용 |
| 사이트맵 | 빌드할 때마다 수정일 변경 | 실제 개편 날짜 사용, 신규 페이지 포함 |
| llms.txt | 별도 수동 관리 파일 | 회사·서비스·가격·데모 데이터에서 정적 생성 |
| 이미지 | 데모 사진에 명시적 크기 없음 | 52개 사진의 원본 크기 지정, 기존 사진 설명 유지 |
| 아이콘 | SVG 중심 | ICO, 180px Apple 아이콘, 512px 회사 로고 추가 |
| 글꼴 | SUIT 전체 624,536바이트 선로드 | 기존 모양·가변 굵기를 유지한 189,128바이트 부분 글꼴 선로드, 다른 글자는 원본으로 표시 |

## 콘텐츠와 데이터 일관성

- 서비스 비용은 기존 가격표 데이터에서 읽는다. 시작가를 확정 가격으로 바꾸지 않고 초기 비용과 월 운영·대행료를 구분한다. 기존 상품 가격은 변경하지 않았다.
- 회사 소개, Footer, 회사 JSON-LD, llms.txt의 주소를 함께 변경했다.
- AI 도입 가이드는 정의, 서비스 비교표, 비용 구분, 상담 준비 자료, FAQ, 관련 공식 문서로 구성했다. 존재하지 않는 고객 사례·성과 통계·평점·영업시간·전화번호를 추가하지 않았다.
- 데모의 CreativeWork 정보와 llms.txt에서 체험용 구현임을 구분한다. 데모 사진을 실제 매물·고객 상품 촬영으로 소개하지 않는다.
- 홈의 서비스 선택 카드는 기존 설명 모달을 먼저 연다. 서비스 모달에서 정적 상세 페이지로 이동하는 링크를 추가했다.
- 관리자는 기존 인증을 유지하고 noindex를 적용한다. robots.txt는 접근 제어 수단으로 사용하지 않는다.

## 검증

| 검사 | 결과 |
| --- | --- |
| Next.js 프로덕션 빌드·타입·린트 | 통과 |
| 기존 가격·문의 자동 검사 | 6개 통과, 실제 메일 발송 없음 |
| 40개 페이지의 초기 HTML, GPTBot User-Agent | 통과 |
| 고유 title·description, 자기 URL canonical·OG, Twitter | 40개 통과 |
| H1 하나, 제목 위계, 이미지 alt·크기 | 40개 통과 |
| 전역 회사 스키마, 내부 breadcrumb, FAQ와 실제 본문 일치 | 통과 |
| 사이트 내부 경로 40개 | 오류 없음 |
| robots, sitemap, llms, 관리자 noindex, 공유 이미지·아이콘 | 통과 |
| 11개 주요 화면 × 1440·1024·768·390·360px | 가로 넘침·런타임 오류 없음 |
| JS 없는 FAQ, 홈 모달, 기존 서비스 해시 링크 | 통과 |
| 부분 글꼴 단독 다운로드, 추가 한글 입력의 원본 글꼴 표시 | 통과 |
| Lighthouse 13.4.1, 로컬 프로덕션 빌드, 모바일 시뮬레이션 | 성능 90, 접근성 100, 권장사항 100, SEO 100 |

글꼴 최적화 전후 로컬 측정에서 성능은 72 → 90, LCP는 5.5초 → 3.3초로 개선됐다. 최종 FCP 1.4초, TBT 150ms, CLS 0. 브라우저 자동화와 함께 수행한 단회 측정이므로 현장 수치나 전체 사이트 점수로 해석하지 않는다. 최초 Lighthouse CLI는 JSON 보고서를 저장한 뒤 Windows 임시 프로필 정리에서 오류가 발생했고, 최종 측정은 브라우저를 직접 관리하는 방식으로 정상 완료했다.

자동 검사는 문법·메타데이터·실제 HTML의 일관성을 확인한다. 검색엔진의 색인 완료나 검색 순위, AI 답변의 인용을 보장하는 검사는 아니다. Lighthouse는 실험실 측정이며 실제 방문자의 Core Web Vitals와 구분한다.

## 가이드에서 조정한 사항과 근거

- Google AI 검색에 별도 전용 파일이나 특수 스키마가 필수인 것은 아니다. 기존 검색 최적화, 접근 가능한 본문과 실제 콘텐츠에 맞는 구조화 데이터를 우선 적용했다. llms.txt는 추가 안내 파일로 제공한다. [Google AI features](https://developers.google.com/search/docs/appearance/ai-features)
- robots의 더 구체적인 봇 그룹은 일반 그룹의 규칙을 자동 상속하지 않는다. 모든 그룹에 같은 제외 경로를 적고 렌더링 자원은 허용했다. [Google robots 사양](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)
- alt에 키워드를 강제로 넣지 않는다. 내용이 있는 사진은 설명을 유지하고, 인접 텍스트와 중복되는 장식 로고는 빈 alt를 유지했다. [Google 이미지 가이드](https://developers.google.com/search/docs/appearance/google-images)
- Google은 2026년 5월 FAQ 리치 결과 제공을 중단했다. FAQPage는 문답을 기계가 읽을 수 있도록 제공하며 Google FAQ 리치 결과 노출을 약속하지 않는다. [Google 검색 문서 변경 기록](https://developers.google.com/search/updates)
- 사이트맵 lastmod는 실제 콘텐츠 변경을 반영해야 한다. `lib/seo.ts`의 `SEO_UPDATED`는 이번 실질적인 개편일이며, 향후 본문 변경 시 갱신한다. [Google lastmod 안내](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping)
- ClaudeBot, Claude-SearchBot, Claude-User를 현재 명칭으로 구분했다. [Anthropic 크롤러 안내](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- SUIT 원본의 OFL 고지를 보존하고, 부분 글꼴의 내부 이름은 예약된 이름을 피하도록 AXONE Web Sans로 변경했다. 원본은 변경하지 않았다. 재생성은 `tooling/subset-font.py`를 사용한다. [fontTools subset 문서](https://fonttools.readthedocs.io/en/latest/subset/index.html)

## 배포 후 계정 소유자가 확인할 일

기존 등록 여부는 각 서비스 계정에서 확인해야 한다. 현재 코드에는 네이버 확인 태그가 있으며 Google 확인 코드는 `GOOGLE_SITE_VERIFICATION` 환경변수를 지원한다.

1. [Google Search Console](https://search.google.com/search-console), [네이버 서치어드바이저](https://searchadvisor.naver.com/), [Bing Webmaster Tools](https://www.bing.com/webmasters/)에서 소유권과 사이트맵 `https://axone.ai.kr/sitemap.xml` 제출 상태를 확인한다. 새 서비스 페이지와 가이드의 색인도 요청한다.
2. [리치 결과 테스트](https://search.google.com/test/rich-results)에서 대표 서비스·가이드 페이지를 확인한다. Service·CreativeWork 등 모든 유효한 Schema.org 유형이 Google 리치 결과 대상인 것은 아니다.
3. [PageSpeed Insights](https://pagespeed.web.dev/)에서 프로덕션 URL을 측정하고 실제 방문자 Core Web Vitals가 제공되는지 확인한다.
4. 매주 Search Console의 노출·클릭·검색어·평균 순위와 색인 제외 사유를 확인한다. GPT·Claude·Perplexity에는 같은 고객 질문을 사용해 브랜드 언급, 출처 사용, 인용 링크를 날짜와 함께 기록한다.
5. 매월 실제 상담 질문을 바탕으로 서비스별 콘텐츠를 보완한다. 출처가 없는 수치나 검색 노출만을 위한 반복 키워드를 추가하지 않는다.
