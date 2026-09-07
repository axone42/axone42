// 자체 제작 데모 안내. 고객사 실적이나 측정 성과로 사용하지 않습니다.
export const clients: string[] = [];
export const caseStudies = [
  { id:"rag", industry:"고객지원·사내 업무", title:"문서를 찾는 시간을 줄이는 지식 챗봇", summary:"샘플 사내 규정을 질문하고 답변의 근거 문단을 확인합니다.", flow:["질문 입력","문서 탐색","근거 확인"], href:"/lab/rag-chatbot", scope:"추천 질문·샘플 문서 답변 체험. 실제 문서 업로드·색인은 도입 범위에 따라 구축합니다." },
  { id:"ocr", industry:"재무·백오피스", title:"영수증 정보를 정리하는 업무 흐름", summary:"샘플 영수증이 항목별 데이터로 정리되는 과정을 확인합니다.", flow:["샘플 영수증","항목 추출 시연","정리된 표"], href:"/lab/ocr-extractor", scope:"정해진 예시로 동작하는 화면 시연. 실제 이미지 인식·외부 시트 전송은 포함하지 않습니다." },
  { id:"store", industry:"온라인 판매", title:"상품 탐색부터 주문 확인까지", summary:"상품을 고르고 장바구니와 결제 요약 화면을 직접 사용해 봅니다.", flow:["상품 선택","장바구니","결제 요약"], href:"/lab/shop-cosmetics", scope:"샘플 상품으로 구매 동선을 체험합니다. 실제 결제·주문·배송은 발생하지 않습니다." },
];
