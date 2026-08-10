import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${site.name}(${site.nameEn}) 개인정보처리방침`,
};

export default function PrivacyPage() {
  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 820 }}>
        <p className="eyebrow">Privacy</p>
        <h1 className="page-hero__title">개인정보처리방침</h1>
        <p className="page-hero__lead">
          {site.name}(이하 &lsquo;회사&rsquo;)은 이용자의 개인정보를 중요하게 생각하며 관련 법령을 준수합니다.
        </p>

        <div className="legal">
          <h2>1. 수집하는 개인정보 항목</h2>
          <p>회사는 상담·문의 처리를 위해 다음 항목을 수집합니다.</p>
          <ul>
            <li>필수: 이름, 이메일, 문의 내용</li>
            <li>선택: 회사/소속, 관심 서비스</li>
            <li>자동 수집: 접속 IP(스팸 방지 목적)</li>
          </ul>

          <h2>2. 개인정보의 수집·이용 목적</h2>
          <ul>
            <li>문의에 대한 답변 및 상담 제공</li>
            <li>서비스 제안 및 계약 관련 연락</li>
            <li>부정 이용(스팸) 방지</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            수집일로부터 <strong>3년간</strong> 보관 후 지체 없이 파기합니다. 단, 관계 법령에 따라 보존할
            필요가 있는 경우 해당 기간 동안 보관합니다.
          </p>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 메일 전송을 위해 이메일
            발송 처리수탁사(Mailgun)를 통해 문의 내용이 전송·처리될 수 있습니다.
          </p>

          <h2>5. 개인정보의 파기</h2>
          <p>보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.</p>

          <h2>6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 아래
            연락처로 요청하실 수 있습니다.
          </p>

          <h2>7. 개인정보 보호책임자</h2>
          <ul>
            <li>책임자: {site.ceo}</li>
            <li>이메일: {site.email}</li>
            <li>주소: {site.address}</li>
          </ul>

          <p className="legal__date">본 방침은 2026년 8월 6일부터 적용됩니다.</p>
        </div>
      </div>
    </section>
  );
}
