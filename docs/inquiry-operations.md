# 상담 접수 운영

홈페이지 신청 → Neon PostgreSQL 저장 → 접수번호 반환 → Slack 알림. Mailgun은 선택 사항입니다. 관리자 접수함은 `/admin/inquiries`이며 기존 관리자 비밀번호를 사용합니다.

## DB와 관리자

- `DATABASE_URL`: 서버 전용 Neon 연결 문자열. 브라우저에 노출하지 않습니다.
- `node --env-file=.env.local tooling/migrate-inquiries.mjs`: 테이블·인덱스 생성. 기존 데이터를 지우지 않습니다.
- 신청 이름·연락처·서비스·프로젝트·서버 계산 견적·문의 내용·동의 시각을 저장합니다.
- 홈페이지는 제출 UUID, Gmail은 메일함+메시지 ID로 중복을 방지합니다.
- 신규 접수 / 상담 중 / 처리 완료, 내부 메모, 경로·상태 필터와 페이지 이동을 제공합니다.
- 관리자 API는 서버에서 쿠키를 확인합니다. 수정·재전송에는 같은 출처 확인도 적용합니다. 다른 탭에서 먼저 수정한 경우 덮어쓰지 않고 새로고침을 요청합니다.

## Slack 연결

1. [Slack 앱 관리](https://api.slack.com/apps)에서 AXONE 상담 알림 앱을 생성하거나 기존 앱을 선택합니다.
2. Incoming Webhooks를 활성화하고, 담당자만 접근하는 수신 채널을 지정합니다.
3. 생성된 URL을 Vercel의 **Production → `SLACK_WEBHOOK_URL`**에 저장하고 재배포합니다. URL은 비밀값이므로 채팅·GitHub·브라우저 코드에 넣지 않습니다.
4. 관리자 접수함에서 대기 알림 재전송을 누르면 연결 전 접수도 전달됩니다.

공식 연결 방법: [Slack incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/).

알림은 접수마다 즉시 시도합니다. 실패하면 DB에 대기 상태를 남기며 5분 후 재시도할 수 있습니다. 관리자 버튼은 한 번에 최대 10건을 처리하고, Vercel Cron은 매일 00:00 UTC에 최대 10건을 재시도합니다. 많은 대기 건은 버튼을 반복 사용하거나 별도 스케줄러를 연결합니다. `CRON_SECRET`을 설정해야 예약 재시도가 인증됩니다. Slack이 수신했지만 응답이 유실된 경우에는 재시도로 알림이 중복될 수 있으며 접수번호로 식별합니다. DB 상담 자체는 중복 생성되지 않습니다.

## Gmail 연결

Gmail 수신은 별도 계정 승인이 필요합니다. API 설정만으로 메일을 읽기 시작하지 않습니다. **연동할 계정과 검색 조건을 먼저 결정**합니다. 전체 메일을 보내려면 그 범위를 명시적으로 선택해야 합니다.

1. Vercel Production에 `GMAIL_MAILBOX`와 긴 무작위 `GMAIL_INGEST_SECRET`을 설정하고 재배포합니다.
2. 해당 Gmail 계정으로 [Apps Script](https://script.google.com/) 프로젝트를 생성합니다.
3. `integrations/gmail/Code.gs`와 `appsscript.json`을 복사합니다. 프로젝트 설정에서 매니페스트 표시를 켜고, 서비스에 Gmail API v1이 활성화되어 있는지 확인합니다. 표준 Google Cloud 프로젝트를 연결했다면 해당 프로젝트에서도 Gmail API를 활성화합니다.
4. 스크립트 속성에 `AXONE_MAILBOX`, `AXONE_INGEST_SECRET`(Vercel과 동일), `AXONE_GMAIL_QUERY`를 입력합니다. 상담만 전달할 경우 예: `label:AXONE-상담`. Gmail 필터로 이 라벨을 자동 적용하면 됩니다. 전체 받은편지함을 승인한 경우 `in:inbox`를 사용합니다.
5. `installAxoneGmail`을 실행하고 본인이 Google의 메일 읽기 권한을 승인합니다. 이후 5분 간격으로 새 메일을 DB에 저장하고 Slack에 알립니다.

읽기 전용 Gmail 권한을 사용하며 메일을 보내거나 삭제하거나 읽음으로 변경하지 않습니다. 설치 전 메일은 가져오지 않습니다. 이후 최근 7일을 재확인해 늦게 붙은 라벨을 반영하고, 같은 메시지는 DB에서 중복 제거합니다. 첨부파일은 가져오지 않으며 HTML 전용 메일은 Gmail 요약을 저장합니다. 긴 본문은 19,000자까지 저장합니다. 메일 알림 자동 전달이 정상인지 Apps Script 실행 이력에서 확인하세요.

공식 참고: [Gmail 검색 조건](https://developers.google.com/workspace/gmail/api/guides/filtering), [Apps Script 설치형 트리거](https://developers.google.com/apps-script/guides/triggers/installable).

## 점검 및 장애 대응

- 접수 성공은 DB 저장 완료를 뜻합니다. Slack 설정 유무나 Gmail 계정 연결 유무와 독립적입니다.
- DB가 실패하면 성공을 표시하지 않고 입력값을 유지합니다. 동일 내용 재시도 시 같은 요청 키를 재사용합니다.
- Slack 연결 전 접수는 `pending`으로 저장됩니다. URL을 연결하고 재전송하면 됩니다.
- Gmail 동기화 실패 시 해당 배치를 다음 실행에서 재시도합니다. 실행 이력 오류를 확인하세요. 검색 조건을 바꿨다면 스크립트 속성 `AXONE_PAGE_TOKEN`, `AXONE_SCAN_AFTER`를 지워 진행 중 검색을 초기화합니다.
- 개인정보 3년 보유 정책에 따른 정기 파기와 Slack·Gmail 원본 삭제는 운영자가 별도로 관리해야 합니다. 현재 자동 파기 작업은 활성화하지 않았습니다.
- 무료 DB 용량·가용성은 운영 대시보드에서 확인합니다. 다른 환경의 테스트 데이터를 운영 DB에 남기지 않습니다.

## 2026-09-07 구현 검증

- Neon 무료 플랜 `axone-inquiries`를 Vercel 프로젝트의 Production 환경에 연결하고 마이그레이션 완료.
- 자동 검사 15개, TypeScript 검사, Next.js 프로덕션 빌드 통과.
- 로컬 프로덕션 서버에서 실제 상담 양식 → 운영 DB 저장 → 관리자 조회·상태·메모 저장 확인. 동일 제출 중복 방지, 다른 탭 수정 충돌, 인증·출처 검증도 확인.
- Gmail 형식의 검증용 요청으로 DB 저장과 메시지 ID 중복 방지 확인. 실제 메일함에서 읽은 메일은 아님.
- 관리자 화면 1440·768·390·360px에서 가로 넘침과 브라우저 오류 없음. 검증용 DB 2건 삭제 완료.
- Slack 외부 전송은 테스트 대역으로 실패·동시 전송 방지를 확인. 실제 수신 채널 연결과 Gmail 계정의 자동 실행 승인은 별도 단계.
