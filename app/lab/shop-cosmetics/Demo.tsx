"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import "./site.css";

/* ---------------- 제품 사진 (실사) + CSS 폴백 ---------------- */
// 이미지가 로드되면 실제 제품 사진을, 404/부재 시 기존 CSS 비주얼로 우아하게 폴백한다.
// slug는 원본 배열 인덱스 기준(p1, p2, …)으로 안정적으로 매핑된다.
const IMG_BASE = "/lab-img/cosmetics";
const slugFor = (id: string) => `p${(RANK.get(id) ?? 0) + 1}`;
const photoSrc = (id: string) => `${IMG_BASE}/${slugFor(id)}.png`;
const HERO_SRC = `${IMG_BASE}/hero.png`;

// 폴백을 먼저 렌더하고, 이미지가 "실제로 로드될 때만" 사진으로 교체한다.
// (정적 프리렌더 + 404 상황에서 깨진 이미지 아이콘이 뜨는 문제를 원천 차단; 하이드레이션 안전.)
function Photo({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const img = new window.Image();
    img.onload = () => { if (alive) setLoaded(true); };
    img.onerror = () => { if (alive) setLoaded(false); };
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return loaded ? (
    <img src={src} alt={alt} className="cos-photo" />
  ) : (
    <>{fallback}</>
  );
}

/* ---------------- 타입 & 시드 데이터 ---------------- */

type SkinType = "전체" | "건성" | "지성" | "복합" | "민감" | "트러블";
type CatKey = "전체" | "스킨케어" | "에센스" | "크림" | "선케어" | "클렌징";
type Flag = "new" | "best" | "sale" | null;
type Shape = "bottle" | "tube" | "jar";

interface Review {
  author: string;
  rating: number;
  text: string;
}

interface Product {
  id: string;
  name: string;
  cat: Exclude<CatKey, "전체">;
  catLabel: string;
  volume: number; // ml
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  skin: Exclude<SkinType, "전체">[];
  flag: Flag;
  shape: Shape;
  // 비주얼 색
  c1: string;
  c2: string;
  desc: string;
  ingredients: string[];
  usage: string;
  reviews: Review[];
  volOptions: number[];
}

// 상단 네비게이션 라벨 (요구사항: 신제품·스킨케어·메이크업·베스트)
const HEADER_NAV = ["신제품", "스킨케어", "메이크업", "베스트"];

const SKIN_CHIPS: SkinType[] = ["전체", "건성", "지성", "복합", "민감", "트러블"];
const CAT_TABS: CatKey[] = ["전체", "스킨케어", "에센스", "크림", "선케어", "클렌징"];

const PRODUCTS: Product[] = [
  {
    id: "toner-rose",
    name: "로즈 워터 밸런싱 토너",
    cat: "스킨케어",
    catLabel: "토너",
    volume: 200,
    price: 24000,
    rating: 4.8,
    reviewCount: 1243,
    skin: ["건성", "민감", "복합"],
    flag: "best",
    shape: "bottle",
    c1: "#f6d7de",
    c2: "#e7a9b6",
    desc: "다마스크 장미수와 판테놀이 피부 결을 정돈하고 즉각적인 수분감을 채워주는 저자극 밸런싱 토너입니다.",
    ingredients: ["장미수", "판테놀", "히알루론산", "무알코올"],
    usage: "세안 후 화장솜 또는 손바닥에 적당량을 덜어 얼굴 전체에 부드럽게 흡수시킵니다.",
    reviews: [
      { author: "지수", rating: 5, text: "향이 은은하고 자극이 하나도 없어요. 재구매 3번째!" },
      { author: "hana_", rating: 4, text: "촉촉하게 마무리돼서 건조한 날 좋아요." },
    ],
    volOptions: [200, 400],
  },
  {
    id: "essence-cica",
    name: "시카 리페어 진정 에센스",
    cat: "에센스",
    catLabel: "에센스",
    volume: 50,
    price: 32000,
    oldPrice: 40000,
    rating: 4.7,
    reviewCount: 987,
    skin: ["민감", "트러블", "지성"],
    flag: "sale",
    shape: "bottle",
    c1: "#d7ece4",
    c2: "#a9d3c5",
    desc: "센텔라 성분이 붉어진 피부를 빠르게 진정시키고 손상된 장벽을 케어하는 고농축 진정 에센스.",
    ingredients: ["센텔라아시아티카", "마데카소사이드", "알란토인", "비건"],
    usage: "토너 후 3~4방울을 얼굴 전체에 도포하고 가볍게 두드려 흡수시킵니다.",
    reviews: [
      { author: "민트초코", rating: 5, text: "트러블 올라올 때 바르면 다음날 확실히 가라앉아요." },
      { author: "sora", rating: 4, text: "끈적임 없이 산뜻해서 여름에 딱." },
    ],
    volOptions: [50, 100],
  },
  {
    id: "serum-vitac",
    name: "비타민C 브라이트닝 세럼",
    cat: "에센스",
    catLabel: "세럼",
    volume: 30,
    price: 38000,
    rating: 4.9,
    reviewCount: 2104,
    skin: ["복합", "지성", "건성"],
    flag: "new",
    shape: "bottle",
    c1: "#ffe6c9",
    c2: "#f5b779",
    desc: "안정화 비타민C 15%가 칙칙한 피부에 생기를 더하고 톤을 맑게 가꿔주는 브라이트닝 세럼.",
    ingredients: ["비타민C 15%", "페룰산", "비타민E", "나이아신아마이드"],
    usage: "아침·저녁 세안 후 2~3방울을 얼굴에 펴 바릅니다. 낮 사용 시 자외선 차단제를 함께 사용하세요.",
    reviews: [
      { author: "yuna", rating: 5, text: "2주 썼는데 얼굴이 확실히 화사해졌어요." },
      { author: "코코넛", rating: 5, text: "발림성 좋고 산뜻해요. 인생 세럼." },
    ],
    volOptions: [30, 50],
  },
  {
    id: "cream-cera",
    name: "세라마이드 배리어 크림",
    cat: "크림",
    catLabel: "크림",
    volume: 50,
    price: 29000,
    rating: 4.6,
    reviewCount: 1520,
    skin: ["건성", "민감"],
    flag: "best",
    shape: "jar",
    c1: "#efe6f7",
    c2: "#cbb6e6",
    desc: "5종 세라마이드가 피부 장벽을 튼튼하게 채우고 밤새 수분을 가두는 리치 배리어 크림.",
    ingredients: ["세라마이드 5종", "시어버터", "스쿠알란", "판테놀"],
    usage: "스킨케어 마지막 단계에 적당량을 얼굴 전체에 부드럽게 발라 마무리합니다.",
    reviews: [
      { author: "겨울잠", rating: 5, text: "건조한 피부가 아침까지 촉촉해요." },
      { author: "라라", rating: 4, text: "묵직하지만 흡수는 잘 됩니다." },
    ],
    volOptions: [50, 80],
  },
  {
    id: "sun-mild",
    name: "마일드 데일리 선크림 SPF50+",
    cat: "선케어",
    catLabel: "선크림",
    volume: 50,
    price: 22000,
    oldPrice: 26000,
    rating: 4.8,
    reviewCount: 3310,
    skin: ["민감", "복합", "지성"],
    flag: "sale",
    shape: "tube",
    c1: "#fff0d4",
    c2: "#ffd98a",
    desc: "백탁 없이 산뜻하게 발리는 데일리 자외선 차단제. 무기자차 기반으로 민감 피부도 안심.",
    ingredients: ["징크옥사이드", "무기자차", "히알루론산", "무향료"],
    usage: "스킨케어 후 외출 15분 전 얼굴과 목에 고르게 펴 발라줍니다.",
    reviews: [
      { author: "제이", rating: 5, text: "백탁 없고 눈시림 없어서 매일 써요." },
      { author: "sunny", rating: 4, text: "산뜻하고 무거운 느낌 전혀 없어요." },
    ],
    volOptions: [50],
  },
  {
    id: "cleanser-gel",
    name: "저자극 아미노 클렌징 젤",
    cat: "클렌징",
    catLabel: "클렌저",
    volume: 150,
    price: 18000,
    rating: 4.5,
    reviewCount: 842,
    skin: ["지성", "복합", "트러블"],
    flag: null,
    shape: "tube",
    c1: "#d9ecf7",
    c2: "#a6cfe6",
    desc: "약산성 아미노산 계면활성제로 노폐물은 씻어내고 필요한 유수분은 남기는 순한 젤 클렌저.",
    ingredients: ["아미노산 계면활성제", "약산성 pH5.5", "그린티", "무설페이트"],
    usage: "물기 있는 얼굴에 거품 내어 부드럽게 마사지한 뒤 미온수로 헹굽니다.",
    reviews: [
      { author: "boram", rating: 5, text: "세정력 좋은데 당김이 없어요." },
      { author: "우유", rating: 4, text: "거품이 부드럽고 향도 은은해요." },
    ],
    volOptions: [150, 250],
  },
  {
    id: "essence-galac",
    name: "갈락 퍼밍 발효 앰플",
    cat: "에센스",
    catLabel: "앰플",
    volume: 30,
    price: 45000,
    rating: 4.7,
    reviewCount: 611,
    skin: ["건성", "복합"],
    flag: "new",
    shape: "bottle",
    c1: "#f3ead7",
    c2: "#dcc79b",
    desc: "갈락토미세스 발효 여과물 92%가 탄력 없는 피부에 영양을 채우고 매끈하게 가꿔주는 앰플.",
    ingredients: ["갈락토미세스 92%", "나이아신아마이드", "펩타이드", "아데노신"],
    usage: "토너 후 손바닥에 덜어 얼굴을 감싸듯 흡수시킨 뒤 다음 단계를 진행합니다.",
    reviews: [
      { author: "탄력왕", rating: 5, text: "결이 정돈되고 화장이 잘 먹어요." },
      { author: "nabi", rating: 4, text: "고급진 사용감. 조금 아쉬운 건 가격뿐." },
    ],
    volOptions: [30, 50],
  },
  {
    id: "cream-oil",
    name: "밸런스 오일 프리 수분크림",
    cat: "크림",
    catLabel: "수분크림",
    volume: 60,
    price: 26000,
    rating: 4.6,
    reviewCount: 1188,
    skin: ["지성", "복합", "트러블"],
    flag: null,
    shape: "jar",
    c1: "#dff0ea",
    c2: "#b0dccc",
    desc: "오일 프리 젤 타입으로 번들거림 없이 산뜻한 수분을 채워주는 지성·복합 피부용 수분크림.",
    ingredients: ["히알루론산", "판테놀", "티트리", "오일프리"],
    usage: "스킨케어 마지막에 젤을 얇게 펴 발라 산뜻하게 마무리합니다.",
    reviews: [
      { author: "여름밤", rating: 5, text: "지성인데 딱 좋아요. 안 답답해요." },
      { author: "lime", rating: 4, text: "가볍고 촉촉해서 데일리로 굿." },
    ],
    volOptions: [60, 100],
  },
  {
    id: "cleanser-oil",
    name: "딥 클린 클렌징 오일",
    cat: "클렌징",
    catLabel: "클렌징오일",
    volume: 200,
    price: 21000,
    rating: 4.7,
    reviewCount: 1657,
    skin: ["건성", "복합", "민감"],
    flag: "best",
    shape: "bottle",
    c1: "#f7ecd9",
    c2: "#e6c99b",
    desc: "식물성 오일이 메이크업과 노폐물을 부드럽게 녹여내고 물에 헹구면 산뜻하게 마무리되는 클렌징 오일.",
    ingredients: ["올리브오일", "호호바오일", "비타민E", "무향료"],
    usage: "건조한 손과 얼굴에 펌핑해 부드럽게 마사지한 뒤 미온수로 유화시켜 헹굽니다.",
    reviews: [
      { author: "밤톨", rating: 5, text: "진한 화장도 싹 지워지고 당김 없어요." },
      { author: "clara", rating: 4, text: "눈가 메이크업까지 깔끔하게 정리돼요." },
    ],
    volOptions: [200],
  },
  {
    id: "sun-tone",
    name: "톤업 글로우 선세럼 SPF50+",
    cat: "선케어",
    catLabel: "선세럼",
    volume: 50,
    price: 25000,
    oldPrice: 30000,
    rating: 4.6,
    reviewCount: 1420,
    skin: ["건성", "복합"],
    flag: "sale",
    shape: "tube",
    c1: "#ffe9ef",
    c2: "#f6b9cc",
    desc: "은은한 톤업과 촉촉한 광채를 동시에. 세럼처럼 부드럽게 발려 화장 전 베이스로도 좋은 선세럼.",
    ingredients: ["나이아신아마이드", "히알루론산", "펄 없음", "SPF50+ PA++++"],
    usage: "스킨케어 후 적당량을 얼굴에 얇게 펴 발라 자연스러운 광채를 연출합니다.",
    reviews: [
      { author: "글로우", rating: 5, text: "촉촉하게 톤업돼서 노메이크업 날 애용해요." },
      { author: "dew", rating: 4, text: "번들거리지 않고 은은하게 화사해요." },
    ],
    volOptions: [50],
  },
];

const SORTS = [
  { key: "recommend", label: "추천순" },
  { key: "review", label: "리뷰많은순" },
  { key: "priceLow", label: "낮은가격순" },
  { key: "priceHigh", label: "높은가격순" },
  { key: "rating", label: "평점순" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

// 추천순 고정 순서 (하이드레이션 안전: 원본 배열 인덱스 기준)
const RANK = new Map(PRODUCTS.map((p, i) => [p.id, i]));

/* ---------------- 유틸 ---------------- */

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="cos-stars" aria-label={`별점 ${rating}`}>
      {"★★★★★".slice(0, full)}
      <span style={{ color: "#e3dcd0" }}>{"★★★★★".slice(full)}</span>
    </span>
  );
}

function Visual({ p }: { p: Product }) {
  const bg = `linear-gradient(135deg, ${p.c1}, ${p.c2})`;
  const bottleBg = `linear-gradient(160deg, ${p.c2}, ${p.c1})`;
  return (
    <div className="cos-visual" style={{ background: bg }}>
      <span className="cos-visual__label">AURA</span>
      <div className={`cos-bottle ${p.shape === "tube" ? "tube" : p.shape === "jar" ? "jar" : ""}`} style={{ background: bottleBg }} />
    </div>
  );
}

/* ---------------- 장바구니 타입 ---------------- */

interface CartItem {
  key: string; // id + vol
  id: string;
  name: string;
  vol: number;
  price: number;
  qty: number;
  c1: string;
  c2: string;
}

type Stage = "cart" | "pay" | "done";

/* ---------------- 메인 ---------------- */

export default function Demo() {
  const [skin, setSkin] = useState<SkinType>("전체");
  const [cat, setCat] = useState<CatKey>("전체");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selVol, setSelVol] = useState<number>(0);
  const [selQty, setSelQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("cart");
  const [orderNo, setOrderNo] = useState("");
  const [toast, setToast] = useState("");
  const [headerNav, setHeaderNav] = useState("스킨케어");
  const [sort, setSort] = useState<SortKey>("recommend");

  const filtered = useMemo(() => {
    const list = PRODUCTS.filter((p) => {
      if (skin !== "전체" && !p.skin.includes(skin as Exclude<SkinType, "전체">)) return false;
      if (cat !== "전체" && p.cat !== cat) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = (p.name + p.catLabel + p.ingredients.join("")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    switch (sort) {
      case "review":
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "priceLow":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        sorted.sort((a, b) => (RANK.get(a.id) ?? 0) - (RANK.get(b.id) ?? 0));
    }
    return sorted;
  }, [skin, cat, query, sort]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = cartTotal >= 50000 || cartTotal === 0 ? 0 : 3000;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1600);
  }

  function addToCart(p: Product, vol: number, qty: number) {
    const key = `${p.id}-${vol}`;
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { key, id: p.id, name: p.name, vol, price: p.price, qty, c1: p.c1, c2: p.c2 }];
    });
    showToast(`${p.name} · 장바구니에 담았어요`);
  }

  function openProduct(p: Product) {
    setSelected(p);
    setSelVol(p.volOptions[0]);
    setSelQty(1);
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  function openCart() {
    setStage("cart");
    setDrawerOpen(true);
  }

  function placeOrder() {
    // 고정 시드 기반 주문번호 (Math.random 미사용, 핸들러 내부라 하이드레이션 안전)
    const base = cartCount * 7919 + cartTotal;
    setOrderNo("AURA-" + (100000 + (base % 900000)));
    setStage("done");
    setCart([]);
  }

  return (
    <div className="cos-scope">
      {/* 프로모 바 (풀블리드) */}
      <div className="cos-promo">
        <span>✦ 첫 구매 10% · 5만원 이상 무료배송 · 전 제품 비건 클린뷰티</span>
      </div>

      {/* 스토어 헤더 (top:52px 스티키) */}
      <header className="cos-header">
        <div className="cos-header__inner">
          <div className="cos-logo" onClick={() => { setSkin("전체"); setCat("전체"); setQuery(""); setSort("recommend"); }}>
            AURA<small>오라</small>
          </div>
          <nav className="cos-nav">
            {HEADER_NAV.map((n) => (
              <button key={n} className={headerNav === n ? "is-on" : ""} onClick={() => setHeaderNav(n)}>
                {n}
              </button>
            ))}
          </nav>
          <div className="cos-header-acts">
            <button className="cos-icobtn" aria-label="검색" onClick={() => setSearchOpen((v) => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <button className="cos-icobtn" aria-label="장바구니" onClick={openCart}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && <span className="cos-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* 검색 바 */}
        {searchOpen && (
          <div className="cos-search">
            <div className="cos-search__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cos-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                autoFocus
                placeholder="제품명·성분으로 검색 (예: 세럼, 시카)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Hero (풀블리드) */}
      <section className="cos-hero">
        <div className="cos-hero__inner">
          <div className="cos-hero__text">
            <p className="cos-hero__eyebrow">Clean Beauty · 2026 New</p>
            <h2 className="cos-hero__title">피부가 편안해지는 시간, 오라와 함께.</h2>
            <p className="cos-hero__sub">저자극 비건 포뮬러로 완성한 데일리 스킨케어. 지금 첫 구매 시 5만원 이상 무료배송.</p>
            <button className="cos-hero__cta" onClick={() => setCat("에센스")}>
              베스트 에센스 보기 →
            </button>
          </div>
          <div className="cos-hero__media">
            <Photo src={HERO_SRC} alt="AURA 클린뷰티 캠페인" fallback={<div className="cos-hero__deco" aria-hidden />} />
          </div>
        </div>
      </section>

      {/* 신뢰 배지 스트립 */}
      <div className="cos-trust">
        <div className="cos-trust__inner">
          <span>🌿 100% 비건 · 크루얼티 프리</span>
          <span>🚚 5만원 이상 무료배송</span>
          <span>↩️ 7일 무료 반품</span>
          <span>🔒 안전 결제</span>
        </div>
      </div>

      <div className="cos-main">
        {/* 피부 고민별 추천 */}
        <section className="cos-section">
            <h3 className="cos-sec-h">피부 고민별 추천</h3>
            <p className="cos-sec-sub">내 피부 타입을 선택하면 딱 맞는 제품만 보여드려요.</p>
            <div className="cos-chips">
              {SKIN_CHIPS.map((s) => (
                <button key={s} className={`cos-chip ${skin === s ? "is-on" : ""}`} onClick={() => setSkin(s)}>
                  {s}
                </button>
              ))}
            </div>

            {/* 카테고리 탭 */}
            <div className="cos-cats">
              {CAT_TABS.map((c) => (
                <button key={c} className={`cos-cat ${cat === c ? "is-on" : ""}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>

            {/* 정렬 + 개수 */}
            <div className="cos-toolbar">
              <span className="cos-count">{filtered.length}개 제품</span>
              <div className="cos-sort">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    className={sort === s.key ? "is-on" : ""}
                    onClick={() => setSort(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제품 그리드 */}
            <div className="cos-grid">
              {filtered.length === 0 && (
                <div className="cos-empty">조건에 맞는 제품이 없어요. 필터를 바꿔보세요.</div>
              )}
              {filtered.map((p) => (
                <article key={p.id} className="cos-card" onClick={() => openProduct(p)}>
                  <div className="cos-frame">
                    <Photo src={photoSrc(p.id)} alt={p.name} fallback={<Visual p={p} />} />
                  </div>
                  <div className="cos-tag-flags">
                    {p.flag === "new" && <span className="cos-flag new">신상</span>}
                    {p.flag === "best" && <span className="cos-flag best">BEST</span>}
                    {p.flag === "sale" && <span className="cos-flag sale">SALE</span>}
                  </div>
                  <div className="cos-card__body">
                    <span className="cos-card__cat">{p.catLabel}</span>
                    <span className="cos-card__name">{p.name}</span>
                    <span className="cos-card__vol">{p.volume}ml</span>
                    <span className="cos-rate">
                      <Stars rating={p.rating} />
                      {p.rating.toFixed(1)} <span className="rc">({p.reviewCount.toLocaleString("ko-KR")})</span>
                    </span>
                    <div className="cos-price-row">
                      <span className="cos-price">{won(p.price)}</span>
                      {p.oldPrice && (
                        <>
                          <span className="cos-price-old">{won(p.oldPrice)}</span>
                          <span className="cos-price-off">
                            {Math.round((1 - p.price / p.oldPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    <div className="cos-card__foot">
                      <button
                        className="cos-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, p.volOptions[0], 1);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        담기
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* 푸터 (풀블리드) */}
        <footer className="cos-footer">
          <div className="cos-footer__inner">
            <div className="cos-footer__brand">AURA · 오라</div>
            <p>클린뷰티 스킨케어 자사몰 · (주)오라코스메틱</p>
            <p>고객센터 1600-0000 · 평일 10:00–18:00 · 반품/교환 안내</p>
            <p>사업자등록번호 000-00-00000 · 통신판매업 2026-서울강남-0000</p>
            <div className="cos-footer__note">본 화면은 AXONE 제작 샘플입니다. 실제 결제는 이루어지지 않습니다.</div>
          </div>
        </footer>

          {/* 제품 상세 모달 */}
          {selected && (
            <div className="cos-overlay" onClick={() => setSelected(null)}>
              <div className="cos-modal" onClick={(e) => e.stopPropagation()}>
                <button className="cos-modal__close" aria-label="닫기" onClick={() => setSelected(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <div className="cos-modal__grid">
                  <div className="cos-modal__vis">
                    <Photo
                      src={photoSrc(selected.id)}
                      alt={selected.name}
                      fallback={
                        <div className="cos-modal__visfb" style={{ background: `linear-gradient(135deg, ${selected.c1}, ${selected.c2})` }}>
                          <div
                            className={`cos-bottle ${selected.shape === "tube" ? "tube" : selected.shape === "jar" ? "jar" : ""}`}
                            style={{ background: `linear-gradient(160deg, ${selected.c2}, ${selected.c1})` }}
                          />
                        </div>
                      }
                    />
                  </div>
                  <div className="cos-modal__info">
                    <span className="cos-modal__cat">{selected.catLabel}</span>
                    <h3 className="cos-modal__name">{selected.name}</h3>
                    <span className="cos-rate">
                      <Stars rating={selected.rating} />
                      {selected.rating.toFixed(1)} <span className="rc">({selected.reviewCount.toLocaleString("ko-KR")} 리뷰)</span>
                    </span>
                    <div className="cos-modal__price">
                      {won(selected.price)}
                      {selected.oldPrice && <span className="cos-price-old">{won(selected.oldPrice)}</span>}
                    </div>
                    <p className="cos-modal__desc">{selected.desc}</p>

                    <div className="cos-block-h">핵심 성분</div>
                    <div className="cos-ing">
                      {selected.ingredients.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>

                    <div className="cos-block-h">사용법</div>
                    <p className="cos-usage">{selected.usage}</p>

                    <div className="cos-block-h">리뷰</div>
                    {selected.reviews.map((r, idx) => (
                      <div key={idx} className="cos-review">
                        <div className="cos-review__top">
                          <span className="cos-review__author">{r.author}</span>
                          <Stars rating={r.rating} />
                        </div>
                        <p className="cos-review__text">{r.text}</p>
                      </div>
                    ))}

                    {/* 옵션 */}
                    <div className="cos-opts">
                      <div className="cos-field">
                        <label>용량 옵션</label>
                        <select value={selVol} onChange={(e) => setSelVol(Number(e.target.value))}>
                          {selected.volOptions.map((v) => (
                            <option key={v} value={v}>
                              {v}ml
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="cos-field" style={{ flex: "0 0 auto" }}>
                        <label>수량</label>
                        <div className="cos-qty">
                          <button aria-label="감소" onClick={() => setSelQty((q) => Math.max(1, q - 1))}>−</button>
                          <span>{selQty}</span>
                          <button aria-label="증가" onClick={() => setSelQty((q) => q + 1)}>+</button>
                        </div>
                      </div>
                    </div>

                    <button
                      className="cos-modal__cta"
                      onClick={() => {
                        addToCart(selected, selVol, selQty);
                        setSelected(null);
                      }}
                    >
                      장바구니 담기 · {won(selected.price * selQty)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 장바구니 drawer */}
          {drawerOpen && (
            <>
              <div className="cos-cart-overlay" onClick={() => setDrawerOpen(false)} />
              <aside className="cos-cart" role="dialog" aria-label="장바구니">
                <div className="cos-cart__head">
                  <h3>
                    {stage === "cart" && `장바구니 (${cartCount})`}
                    {stage === "pay" && "결제 요약"}
                    {stage === "done" && "주문 완료"}
                  </h3>
                  <button className="cos-modal__close" style={{ position: "static" }} aria-label="닫기" onClick={() => setDrawerOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 장바구니 단계 */}
                {stage === "cart" && (
                  <>
                    <div className="cos-cart__body">
                      {cart.length === 0 ? (
                        <div className="cos-cart__empty">장바구니가 비어 있어요.</div>
                      ) : (
                        cart.map((i) => (
                          <div key={i.key} className="cos-line">
                            <div className="cos-line__vis" style={{ background: `linear-gradient(160deg, ${i.c2}, ${i.c1})` }} />
                            <div className="cos-line__mid">
                              <div className="cos-line__name">{i.name}</div>
                              <div className="cos-line__opt">{i.vol}ml</div>
                              <div className="cos-line__price">{won(i.price * i.qty)}</div>
                              <div className="cos-line__ctl" style={{ marginTop: 6 }}>
                                <button aria-label="감소" onClick={() => changeQty(i.key, -1)}>−</button>
                                <span>{i.qty}</span>
                                <button aria-label="증가" onClick={() => changeQty(i.key, 1)}>+</button>
                                <button className="cos-line__rm" onClick={() => removeLine(i.key)}>삭제</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="cos-cart__foot">
                      <div className="cos-sum">
                        <span>상품 금액</span>
                        <span>{won(cartTotal)}</span>
                      </div>
                      <div className="cos-sum">
                        <span>배송비</span>
                        <span>{shipping === 0 ? "무료" : won(shipping)}</span>
                      </div>
                      <div className="cos-sum total">
                        <span>합계</span>
                        <span>{won(cartTotal + shipping)}</span>
                      </div>
                      <button className="cos-checkout" disabled={cart.length === 0} onClick={() => setStage("pay")}>
                        결제하기
                      </button>
                    </div>
                  </>
                )}

                {/* 결제 요약 단계 */}
                {stage === "pay" && (
                  <>
                    <div className="cos-cart__body">
                      <button className="cos-back" onClick={() => setStage("cart")}>← 장바구니로</button>
                      <div className="cos-pay">
                        <div className="cos-pay__row">
                          <span>받는 사람</span>
                          <span>홍길동 (데모)</span>
                        </div>
                        <div className="cos-pay__row">
                          <span>배송지</span>
                          <span>서울시 강남구 …</span>
                        </div>
                        <div className="cos-pay__row">
                          <span>결제 수단</span>
                          <span>신용카드 (샘플)</span>
                        </div>
                        <div className="cos-pay__row">
                          <span>상품 금액</span>
                          <span>{won(cartTotal)}</span>
                        </div>
                        <div className="cos-pay__row">
                          <span>배송비</span>
                          <span>{shipping === 0 ? "무료" : won(shipping)}</span>
                        </div>
                        <div className="cos-pay__row total">
                          <span>총 결제금액</span>
                          <span>{won(cartTotal + shipping)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="cos-cart__foot">
                      <button className="cos-checkout" onClick={placeOrder}>
                        {won(cartTotal + shipping)} 결제하기
                      </button>
                    </div>
                  </>
                )}

                {/* 완료 단계 */}
                {stage === "done" && (
                  <div className="cos-done">
                    <div className="cos-done__check">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <h3>주문이 완료되었어요 ✓</h3>
                    <p>주문번호 <span className="cos-done__ord">{orderNo}</span></p>
                    <p>영업일 기준 1~2일 내 발송됩니다.</p>
                    <p style={{ marginTop: 14, fontSize: 12, color: "var(--cos-muted)" }}>
                      * 본 데모에서는 실제 결제가 이루어지지 않습니다.
                    </p>
                    <button className="cos-checkout" style={{ marginTop: 20 }} onClick={() => setDrawerOpen(false)}>
                      쇼핑 계속하기
                    </button>
                  </div>
                )}
              </aside>
            </>
          )}

      {/* 담기 토스트 */}
      {toast && (
        <div className="cos-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
