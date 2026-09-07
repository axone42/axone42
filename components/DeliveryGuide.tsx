import { ClipboardCheck, FolderCheck, Settings2 } from "lucide-react";
import { deliveryExamples } from "@/lib/delivery";

export default function DeliveryGuide({ serviceId }: { serviceId?: string }) {
  const examples = serviceId ? deliveryExamples[serviceId] : undefined;
  return <section className="delivery-guide">
    <p className="eyebrow">결과물과 운영 안내</p>
    <h2>착수 전에, 받을 결과물까지 함께 정합니다</h2>
    <p>화면 수나 기능 이름뿐 아니라 결과물의 형식, 확인 방법과 운영 범위를 견적서·작업 범위서에 정리합니다.</p>
    {examples && <div className="delivery-guide__examples"><h3>이 서비스의 산출물 예시</h3><ul>{examples.map(item => <li key={item}>{item}</li>)}</ul><p>위 항목은 범위를 정하기 위한 예시입니다. 실제 제공 항목·수량·형식은 착수 전에 합의합니다.</p></div>}
    <div className="delivery-guide__grid">
      <div><ClipboardCheck size={22} strokeWidth={1.75} aria-hidden /><h3>결과물과 완료 기준</h3><p>필요한 화면·기능·자료와 확인 시나리오를 정합니다. 어느 환경에서 누가 확인하고 완료를 판단할지도 함께 기록합니다.</p></div>
      <div><FolderCheck size={22} strokeWidth={1.75} aria-hidden /><h3>인수인계와 관리 권한</h3><p>소스·디자인 원본·설정 파일의 제공 여부, 관리자 계정과 사용 안내 범위를 확인합니다. 외부 도구 계정 명의와 이용료 부담도 구분합니다.</p></div>
      <div><Settings2 size={22} strokeWidth={1.75} aria-hidden /><h3>수정과 운영 지원</h3><p>합의한 기능의 오류 수정과 새로운 기능 추가를 구분합니다. 수정 횟수·지원 기간·응답 기준·월 운영비 포함 항목은 견적서에 명시합니다.</p></div>
    </div>
    <p className="delivery-guide__note">계약 전 확인: 일정 · 산출물 · 추가 작업 비용 · 외부 서비스 이용료 · 부가세 포함 여부. 자동화·개발·컨설팅·교육의 성격에 맞춰 필요한 항목을 확정합니다.</p>
  </section>;
}
