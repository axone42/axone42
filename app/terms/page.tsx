import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "이용약관",
  description: `${site.name}(${site.nameEn}) 서비스 이용약관 — 서비스 제공·이용자 의무·지식재산권·책임 등.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 820 }}>
        <p className="eyebrow">Terms</p>
        <h1 className="page-hero__title">이용약관</h1>
        <p className="page-hero__lead">
          본 약관은 {site.name}(이하 &lsquo;회사&rsquo;)이 제공하는 웹사이트 및 서비스의 이용 조건을 규정합니다.
        </p>

        <div className="legal">
          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 회사가 운영하는 웹사이트 및 회사가 제공하는 AI 자동화, 컨설팅, 개발, 교육 등
            서비스(이하 &lsquo;서비스&rsquo;)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을
            규정함을 목적으로 합니다.
          </p>

          <h2>제2조 (약관의 효력 및 변경)</h2>
          <ul>
            <li>본 약관은 웹사이트에 게시함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 웹사이트에 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.</li>
          </ul>

          <h2>제3조 (서비스의 제공)</h2>
          <ul>
            <li>회사는 AI 자동화 운영, AX 컨설팅, 쇼핑몰·챗봇·시스템 개발, 홈페이지 제작, 교육 등을 제공합니다.</li>
            <li>구체적인 서비스 범위·기간·대가는 회사와 이용자 간 별도 계약 또는 견적으로 정합니다.</li>
            <li>회사는 서비스의 내용을 개선하기 위해 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
          </ul>

          <h2>제4조 (문의 및 상담 신청)</h2>
          <p>
            이용자는 웹사이트의 문의 양식을 통해 상담을 신청할 수 있으며, 제출한 정보는 상담 및 서비스
            제안 목적으로만 이용됩니다. 개인정보의 처리에 관한 사항은{" "}
            <strong>개인정보처리방침</strong>을 따릅니다.
          </p>

          <h2>제5조 (이용자의 의무)</h2>
          <ul>
            <li>이용자는 신청 또는 제공 시 허위 정보를 기재해서는 안 됩니다.</li>
            <li>이용자는 회사의 서비스를 법령과 본 약관이 정한 목적에 맞게 이용해야 합니다.</li>
            <li>이용자는 회사의 지식재산권을 침해하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ul>

          <h2>제6조 (지식재산권)</h2>
          <p>
            웹사이트 및 회사가 제작·납품한 산출물에 대한 저작권 등 지식재산권은 계약에서 별도로 정하지
            않는 한 회사에 귀속됩니다. 이용자는 회사의 사전 동의 없이 이를 복제·배포·2차적으로 이용할 수
            없습니다.
          </p>

          <h2>제7조 (책임의 제한)</h2>
          <ul>
            <li>회사는 천재지변, 이용자의 귀책사유 등 불가항력으로 인한 손해에 대해 책임을 지지 않습니다.</li>
            <li>회사는 웹사이트에 게시된 정보의 정확성을 위해 노력하나, 정보 이용으로 발생한 결과에 대해서는 법령이 허용하는 범위에서 책임을 제한합니다.</li>
          </ul>

          <h2>제8조 (준거법 및 관할)</h2>
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생한 경우 회사의
            주소지를 관할하는 법원을 제1심 관할 법원으로 합니다.
          </p>

          <h2>제9조 (회사 정보)</h2>
          <ul>
            <li>상호: {site.name}({site.nameEn})</li>
            <li>대표: {site.ceo}</li>
            <li>사업자등록번호: {site.bizNumber}</li>
            <li>주소: {site.address}</li>
            <li>이메일: {site.email}</li>
          </ul>

          <p className="legal__date">본 약관은 2026년 8월 6일부터 적용됩니다.</p>
        </div>
      </div>
    </section>
  );
}
