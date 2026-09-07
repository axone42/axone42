"use client";

import { useEffect, useMemo, useState } from "react";
import "./site.css";
import DemoPhoto from "@/components/lab/DemoPhoto";

/* ============================================================
   MODE ATELIER — 가상 패션 자사몰 (show-only, 클라이언트 인터랙션)
   상품·에디토리얼 사진은 프로젝트에 저장한 AI 생성 이미지를 사용합니다.
   EDGE-TO-EDGE: 브라우저 창 프레임 없이 실제 사이트처럼 렌더.
   ============================================================ */

type Cat = "OUTER" | "TOP" | "BOTTOM" | "ACC";
type Swatch = { name: string; hex: string };

type Product = {
  id: string;
  name: string;
  cat: Cat;
  price: number;
  origPrice?: number; // 할인 전 가격
  isNew?: boolean;
  isBest?: boolean;
  soldOut?: boolean;
  popularity: number; // 인기 정렬용 seed
  colors: Swatch[];
  // CSS 비주얼 seed
  bg: string; // 배경 gradient
  garment: "coat" | "shirt" | "pants" | "dress" | "knit" | "bag";
  desc: string;
  material: string;
};

const NAV = ["NEW", "OUTER", "TOP", "BOTTOM", "LOOKBOOK"] as const;
const SIZES = ["S", "M", "L", "XL"] as const;

// 고정 seed 데이터 (하이드레이션 안전 — 렌더 시 랜덤/날짜 없음)
const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "오버사이즈 울 코트",
    cat: "OUTER",
    price: 289000,
    isNew: true,
    isBest: true,
    popularity: 92,
    colors: [
      { name: "차콜", hex: "#2b2b30" },
      { name: "카멜", hex: "#b8875a" },
      { name: "아이보리", hex: "#ece7dc" },
    ],
    bg: "linear-gradient(150deg,#3a3a42,#1d1d22)",
    garment: "coat",
    material: "이탈리안 울 90% · 캐시미어 10%",
    desc: "묵직한 이탈리안 울로 완성한 오버핏 싱글 코트. 드롭 숄더와 넉넉한 기장으로 이너에 관계없이 실루엣이 살아납니다.",
  },
  {
    id: "p2",
    name: "스트럭처드 블레이저",
    cat: "OUTER",
    price: 198000,
    origPrice: 246000,
    popularity: 78,
    colors: [
      { name: "블랙", hex: "#17171b" },
      { name: "샌드", hex: "#cdbfa6" },
    ],
    bg: "linear-gradient(150deg,#4a4a54,#26262d)",
    garment: "coat",
    material: "폴리 68% · 레이온 29% · 스판 3%",
    desc: "각진 어깨 라인이 돋보이는 세미 오버 블레이저. 셋업으로도, 데님 위에도 잘 어울립니다.",
  },
  {
    id: "p3",
    name: "실크 새틴 셔츠",
    cat: "TOP",
    price: 118000,
    isNew: true,
    popularity: 84,
    colors: [
      { name: "아이보리", hex: "#efe9df" },
      { name: "머드", hex: "#7a6a58" },
      { name: "잉크", hex: "#20242e" },
    ],
    bg: "linear-gradient(150deg,#e9e2d5,#cfc6b6)",
    garment: "shirt",
    material: "실크 92% · 스판 8%",
    desc: "은은한 광택의 새틴 원단으로 떨어지는 드레이프가 아름다운 셔츠. 단추 하나만 풀어도 무드가 완성됩니다.",
  },
  {
    id: "p4",
    name: "램스울 라운드 니트",
    cat: "TOP",
    price: 89000,
    popularity: 71,
    colors: [
      { name: "오트밀", hex: "#d9cfbb" },
      { name: "포레스트", hex: "#2f4034" },
      { name: "와인", hex: "#5a2733" },
    ],
    bg: "linear-gradient(150deg,#dacfb9,#b9ab90)",
    garment: "knit",
    material: "램스울 100%",
    desc: "부드러운 램스울 100% 라운드넥 니트. 적당한 두께감으로 사계절 레이어링에 활용도가 높습니다.",
  },
  {
    id: "p5",
    name: "와이드 울 슬랙스",
    cat: "BOTTOM",
    price: 126000,
    popularity: 66,
    colors: [
      { name: "차콜", hex: "#2c2c31" },
      { name: "베이지", hex: "#c8b998" },
    ],
    bg: "linear-gradient(150deg,#33333a,#1b1b20)",
    garment: "pants",
    material: "울 70% · 폴리 30%",
    desc: "허리 밴딩과 깊은 주름으로 편안하면서 정제된 실루엣의 와이드 슬랙스. 코트·블레이저와 완벽한 셋업.",
  },
  {
    id: "p6",
    name: "셀비지 스트레이트 데님",
    cat: "BOTTOM",
    price: 108000,
    origPrice: 132000,
    isBest: true,
    popularity: 88,
    colors: [
      { name: "인디고", hex: "#26374f" },
      { name: "워시드", hex: "#7f93a8" },
    ],
    bg: "linear-gradient(150deg,#2c3d55,#182533)",
    garment: "pants",
    material: "코튼 100% (13.5oz 셀비지)",
    desc: "묵직한 13.5oz 셀비지 데님. 입을수록 자연스러운 페이딩이 매력적인 스트레이트 핏입니다.",
  },
  {
    id: "p7",
    name: "리넨 블렌드 원피스",
    cat: "TOP",
    price: 149000,
    isNew: true,
    popularity: 80,
    colors: [
      { name: "더스트", hex: "#b9a894" },
      { name: "블랙", hex: "#1a1a1e" },
    ],
    bg: "linear-gradient(150deg,#c9b8a2,#a8967d)",
    garment: "dress",
    material: "리넨 55% · 레이온 45%",
    desc: "통기성 좋은 리넨 블렌드로 여름에도 시원한 미디 원피스. 벨트로 실루엣을 자유롭게 연출하세요.",
  },
  {
    id: "p8",
    name: "미니멀 레더 토트",
    cat: "ACC",
    price: 179000,
    soldOut: true,
    popularity: 74,
    colors: [
      { name: "블랙", hex: "#17171b" },
      { name: "토프", hex: "#8f8175" },
    ],
    bg: "linear-gradient(150deg,#43413d,#232120)",
    garment: "bag",
    material: "소가죽 100%",
    desc: "군더더기 없는 라인의 소가죽 토트백. A4가 들어가는 실용적인 사이즈로 데일리백으로 손색없습니다.",
  },
  {
    id: "p9",
    name: "케이블 터틀넥 니트",
    cat: "TOP",
    price: 112000,
    origPrice: 138000,
    isNew: true,
    popularity: 83,
    colors: [
      { name: "크림", hex: "#e7ddc8" },
      { name: "차콜", hex: "#2c2c31" },
      { name: "카멜", hex: "#b8875a" },
    ],
    bg: "linear-gradient(150deg,#ded3bc,#c3b596)",
    garment: "knit",
    material: "울 70% · 알파카 30%",
    desc: "굵은 케이블 조직의 터틀넥 니트. 볼드한 텍스처가 코트 안에서도 존재감을 드러냅니다.",
  },
  {
    id: "p10",
    name: "벨티드 트렌치 코트",
    cat: "OUTER",
    price: 268000,
    isBest: true,
    popularity: 90,
    colors: [
      { name: "베이지", hex: "#c9b998" },
      { name: "카키", hex: "#5c5a45" },
      { name: "블랙", hex: "#1a1a1e" },
    ],
    bg: "linear-gradient(150deg,#4a4636,#2a271d)",
    garment: "coat",
    material: "코튼 개버딘 100%",
    desc: "클래식 더블 브레스트 트렌치. 스톰 플랩과 웨이스트 벨트로 실루엣을 완성하는 시즌리스 아이템.",
  },
];

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");

type SortKey = "new" | "popular" | "priceAsc" | "priceDesc";
type TabKey = "ALL" | Cat | "LOOKBOOK";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "OUTER", label: "OUTER" },
  { key: "TOP", label: "TOP" },
  { key: "BOTTOM", label: "BOTTOM" },
  { key: "ACC", label: "ACC" },
];

type CartLine = { id: string; size: string; color: string; qty: number };

const FREE_SHIP = 150000;

/* ---- CSS로 그린 의류 실루엣 ---- */
function Garment({ type }: { type: Product["garment"] }) {
  return (
    <div className={`fsh-garment fsh-g-${type}`} aria-hidden>
      <span className="fsh-garment__shape" />
    </div>
  );
}

/* ---- 실제 상품 사진 + CSS 폴백 ----
   /lab-img/fashion/<slug>.webp 이 로드되면 사진, 실패/부재 시 CSS 비주얼로 폴백.
   AI 생성 이미지 로드 실패 시 CSS 비주얼을 표시합니다. */
// 메인 사진은 먼저 로드하고, 상품 사진은 화면에 가까워질 때 로드합니다.
function Photo({ src, alt, fallback }: { src: string; alt: string; fallback: React.ReactNode }) {
  return <DemoPhoto src={src} alt={alt} fallback={fallback} className="fsh-photo" eager={src.includes("hero")} />;
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        d="M12 21s-7.5-4.7-10-9.2C.4 8.6 1.9 5 5.3 5c2 0 3.4 1.2 4.2 2.4C10.3 6.2 11.7 5 13.7 5c3.4 0 4.9 3.6 3.3 6.8C19.5 16.3 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon({ kind }: { kind: "ship" | "return" | "gift" | "secure" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "ship")
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" {...common} />
        <circle cx="7" cy="18" r="1.6" {...common} />
        <circle cx="17" cy="18" r="1.6" {...common} />
      </svg>
    );
  if (kind === "return")
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
        <path d="M4 9a8 8 0 0114-4M20 15a8 8 0 01-14 4" {...common} />
        <path d="M4 5v4h4M20 19v-4h-4" {...common} />
      </svg>
    );
  if (kind === "gift")
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
        <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" {...common} />
        <path d="M12 7S9 3 7 5s3 2 5 2zM12 7s3-4 5-2-3 2-5 2z" {...common} />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" {...common} />
      <path d="M9 12l2 2 4-4" {...common} />
    </svg>
  );
}

export default function Demo() {
  const [tab, setTab] = useState<TabKey>("ALL");
  const [sort, setSort] = useState<SortKey>("new");
  const [query, setQuery] = useState("");

  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartLine[]>([]);

  const [selected, setSelected] = useState<Product | null>(null);
  const [pickSize, setPickSize] = useState<string | null>(null);
  const [pickColor, setPickColor] = useState<string | null>(null);
  const [sizeWarn, setSizeWarn] = useState(false);

  const [wishOpen, setWishOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(
      () => setToast(null),
      1600
    );
  };

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, line) => {
      const p = PRODUCTS.find((x) => x.id === line.id);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);
  }, [cart]);

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    if (tab === "LOOKBOOK") {
      list = list.filter((p) => p.isNew);
    } else if (tab !== "ALL") {
      list = list.filter((p) => p.cat === tab);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "new":
        list.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.popularity - a.popularity);
        break;
      case "popular":
        list.sort((a, b) => b.popularity - a.popularity);
        break;
      case "priceAsc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        list.sort((a, b) => b.price - a.price);
        break;
    }
    return list;
  }, [tab, sort, query]);

  const toggleWish = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        showToast("위시리스트에 담았어요 ♥");
      }
      return next;
    });
  };

  const openDetail = (p: Product) => {
    setSelected(p);
    setPickSize(null);
    setPickColor(p.colors[0]?.name ?? null);
    setSizeWarn(false);
    setOrdered(false);
  };

  const addToCart = (p: Product, size: string | null, color: string | null) => {
    if (p.soldOut) return;
    if (!size) {
      setSizeWarn(true);
      return;
    }
    const col = color ?? p.colors[0]?.name ?? "-";
    setCart((prev) => {
      const idx = prev.findIndex(
        (l) => l.id === p.id && l.size === size && l.color === col
      );
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: p.id, size, color: col, qty: 1 }];
    });
    showToast("장바구니에 담았어요 🛍");
  };

  const changeQty = (i: number, delta: number) => {
    setCart((prev) => {
      const next = prev.slice();
      const q = next[i].qty + delta;
      if (q <= 0) {
        next.splice(i, 1);
      } else {
        next[i] = { ...next[i], qty: q };
      }
      return next;
    });
  };

  const removeCart = (i: number) =>
    setCart((prev) => prev.filter((_, idx) => idx !== i));

  const removeWish = (id: string) =>
    setWishlist((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const checkout = () => {
    if (cart.length === 0) return;
    setOrdered(true);
    setCart([]);
  };

  const goShop = () => {
    document
      .getElementById("fsh-shop")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // 코디 추천: 같은 상품 제외, 다른 카테고리 우선 2~3개
  const suggestions = useMemo(() => {
    if (!selected) return [];
    const others = PRODUCTS.filter(
      (p) => p.id !== selected.id && !p.soldOut
    );
    const diff = others.filter((p) => p.cat !== selected.cat);
    const same = others.filter((p) => p.cat === selected.cat);
    return [...diff, ...same].slice(0, 3);
  }, [selected]);

  const wishItems = PRODUCTS.filter((p) => wishlist.has(p.id));
  const lookbookTiles = PRODUCTS.filter((p) => p.isNew).slice(0, 3);
  const shipRemain = Math.max(0, FREE_SHIP - cartTotal);

  return (
    <div className="fsh-frame">
      {/* ---- 공지 마퀴 ---- */}
      <div className="fsh-marquee" aria-hidden>
        <div className="fsh-marquee__inner">
          <span>
            2026 FALL COLLECTION 오픈 · 15만원 이상 무료배송 · 신규 가입 10% 쿠폰 · 전 품목 무료 반품
          </span>
          <span>
            2026 FALL COLLECTION 오픈 · 15만원 이상 무료배송 · 신규 가입 10% 쿠폰 · 전 품목 무료 반품
          </span>
        </div>
      </div>

      {/* ---- 헤더 (스토어 자체 헤더 · 데모 바 바로 아래 sticky) ---- */}
      <header className="fsh-head">
        <div className="fsh-head__row">
          <button
            className="fsh-logo"
            onClick={() => {
              setTab("ALL");
              setQuery("");
            }}
          >
            MODE<span>ATELIER</span>
          </button>
          <nav className="fsh-nav">
            {NAV.map((n) => (
              <button
                key={n}
                className={`fsh-nav__link ${
                  (n === "LOOKBOOK" && tab === "LOOKBOOK") ||
                  (n === "NEW" && tab === "ALL") ||
                  n === tab
                    ? "is-active"
                    : ""
                }`}
                onClick={() => {
                  if (n === "LOOKBOOK") setTab("LOOKBOOK");
                  else if (n === "NEW") setTab("ALL");
                  else setTab(n as Cat);
                  goShop();
                }}
              >
                {n}
              </button>
            ))}
          </nav>
          <div className="fsh-head__actions">
            <div className="fsh-search">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="fsh-search__input"
                placeholder="검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="fsh-iconbtn"
              onClick={() => setWishOpen(true)}
              aria-label="위시리스트"
            >
              <Heart filled={false} />
              {wishlist.size > 0 && <span className="fsh-badge">{wishlist.size}</span>}
            </button>
            <button
              className="fsh-iconbtn"
              onClick={() => setCartOpen(true)}
              aria-label="장바구니"
            >
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden>
                <path
                  d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {cartCount > 0 && <span className="fsh-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ---- 히어로 / 룩북 배너 (풀블리드) ---- */}
      <section className="fsh-hero">
        <div className="fsh-hero__bg" aria-hidden>
          <span className="fsh-hero__blob fsh-hero__blob--a" />
          <span className="fsh-hero__blob fsh-hero__blob--b" />
          <span className="fsh-hero__grain" />
        </div>
        <div className="fsh-hero__figure">
          <Photo
            src="/lab-img/fashion/hero.webp"
            alt="2026 FALL LOOKBOOK"
            fallback={<span className="fsh-hero__figure-css" aria-hidden />}
          />
        </div>
        <div className="fsh-hero__inner">
          <p className="fsh-hero__eyebrow">2026 FALL LOOKBOOK</p>
          <h2 className="fsh-hero__title">
            절제된 실루엣,
            <br />
            당신의 무드로.
          </h2>
          <p className="fsh-hero__sub">
            미니멀한 톤 위에 감각을 더하는 이번 시즌 컬렉션.
            에디토리얼 무드의 셋업으로 완성하세요.
          </p>
          <div className="fsh-hero__cta">
            <button
              className="fsh-btn fsh-btn--light"
              onClick={() => {
                setTab("LOOKBOOK");
                goShop();
              }}
            >
              룩북 보기 →
            </button>
            <button
              className="fsh-btn fsh-btn--ghost"
              onClick={() => {
                setTab("ALL");
                goShop();
              }}
            >
              전체 상품
            </button>
          </div>
        </div>
      </section>

      {/* ---- 트러스트 스트립 ---- */}
      <section className="fsh-trust">
        <div className="fsh-trust__inner">
          <div className="fsh-trust__item">
            <span className="fsh-trust__ic"><TrustIcon kind="ship" /></span>
            <span className="fsh-trust__tx">
              <b>15만원 이상 무료배송</b>
              <span>오후 2시 이전 당일 출고</span>
            </span>
          </div>
          <div className="fsh-trust__item">
            <span className="fsh-trust__ic"><TrustIcon kind="return" /></span>
            <span className="fsh-trust__tx">
              <b>14일 무료 반품</b>
              <span>단순 변심도 OK</span>
            </span>
          </div>
          <div className="fsh-trust__item">
            <span className="fsh-trust__ic"><TrustIcon kind="gift" /></span>
            <span className="fsh-trust__tx">
              <b>프리미엄 패키징</b>
              <span>전 상품 기프트 박스</span>
            </span>
          </div>
          <div className="fsh-trust__item">
            <span className="fsh-trust__ic"><TrustIcon kind="secure" /></span>
            <span className="fsh-trust__tx">
              <b>안전한 결제</b>
              <span>전 카드사 무이자</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---- 섹션 헤드 ---- */}
      <div className="fsh-sectionhead" id="fsh-shop">
        <p className="fsh-sectionhead__eyebrow">SHOP THE COLLECTION</p>
        <h3 className="fsh-sectionhead__title">이번 시즌 셀렉션</h3>
      </div>

      {/* ---- 카테고리 탭 + 정렬 ---- */}
      <div className="fsh-tools">
        <div className="fsh-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`fsh-tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="fsh-sort">
          <span className="fsh-count">{filtered.length}개 상품</span>
          <label htmlFor="fsh-sort-sel">정렬</label>
          <select
            id="fsh-sort-sel"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="new">신상품</option>
            <option value="popular">인기</option>
            <option value="priceAsc">가격 낮은순</option>
            <option value="priceDesc">가격 높은순</option>
          </select>
        </div>
      </div>

      {/* ---- 상품 그리드 ---- */}
      <section className="fsh-grid">
        {filtered.map((p) => {
          const wished = wishlist.has(p.id);
          const discount = p.origPrice
            ? Math.round((1 - p.price / p.origPrice) * 100)
            : 0;
          return (
            <article
              key={p.id}
              className={`fsh-card ${p.soldOut ? "is-sold" : ""}`}
            >
              <div
                className="fsh-card__vis"
                style={{ background: p.bg }}
                onClick={() => openDetail(p)}
                role="button"
              >
                <Photo
                  src={`/lab-img/fashion/${p.id}.webp`}
                  alt={p.name}
                  fallback={<Garment type={p.garment} />}
                />
                <div className="fsh-card__badges">
                  {p.isNew && <span className="fsh-badge-tag fsh-badge-tag--new">NEW</span>}
                  {discount > 0 && (
                    <span className="fsh-badge-tag fsh-badge-tag--sale">-{discount}%</span>
                  )}
                  {p.isBest && !p.soldOut && (
                    <span className="fsh-badge-tag fsh-badge-tag--best">BEST</span>
                  )}
                  {p.soldOut && (
                    <span className="fsh-badge-tag fsh-badge-tag--sold">SOLD OUT</span>
                  )}
                </div>
                <button
                  className={`fsh-card__heart ${wished ? "is-on" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWish(p.id);
                  }}
                  aria-label="위시리스트 담기"
                >
                  <Heart filled={wished} />
                </button>
                {!p.soldOut && (
                  <button
                    className="fsh-card__quick"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(p);
                    }}
                  >
                    옵션 선택 · 담기
                  </button>
                )}
              </div>
              <div className="fsh-card__body">
                <p className="fsh-card__cat">{p.cat}</p>
                <h3 className="fsh-card__name" onClick={() => openDetail(p)}>
                  {p.name}
                </h3>
                <div className="fsh-card__price">
                  {p.origPrice && (
                    <span className="fsh-card__orig">{won(p.origPrice)}</span>
                  )}
                  <span className="fsh-card__now">{won(p.price)}</span>
                  {discount > 0 && <span className="fsh-card__off">{discount}%</span>}
                </div>
                <div className="fsh-card__foot">
                  <div className="fsh-swatches">
                    {p.colors.map((c) => (
                      <span
                        key={c.name}
                        className="fsh-swatch"
                        style={{ background: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <button
                    className="fsh-card__add"
                    disabled={p.soldOut}
                    onClick={() => openDetail(p)}
                  >
                    {p.soldOut ? "품절" : "담기"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p className="fsh-empty">조건에 맞는 상품이 없어요.</p>
        )}
      </section>

      {/* ---- 룩북 배너 (풀블리드) ---- */}
      <section className="fsh-banner">
        <div className="fsh-banner__inner">
          <div>
            <p className="fsh-banner__eyebrow">EDITORIAL · FW26</p>
            <h3 className="fsh-banner__title">
              레이어드,
              <br />
              그 다음의 무드
            </h3>
            <p className="fsh-banner__sub">
              코트 안에 니트, 니트 아래 셔츠. 톤온톤으로 쌓아 올린 이번 시즌의
              레이어링 제안을 룩북에서 만나보세요.
            </p>
            <button
              className="fsh-btn fsh-btn--light"
              onClick={() => {
                setTab("LOOKBOOK");
                goShop();
              }}
            >
              룩북 컬렉션 보기 →
            </button>
          </div>
          <div className="fsh-banner__strip" aria-hidden>
            {lookbookTiles.map((p) => (
              <span
                key={p.id}
                className="fsh-banner__tile"
                style={{ background: p.bg }}
              >
                <Photo src={`/lab-img/fashion/${p.id}.webp`} alt={p.name} fallback={<Garment type={p.garment} />} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 푸터 ---- */}
      <footer className="fsh-footer">
        <div className="fsh-footer__top">
          <div className="fsh-footer__brand">
            <div className="fsh-logo fsh-logo--foot">
              MODE<span>ATELIER</span>
            </div>
            <p className="fsh-footer__tag">
              절제된 실루엣과 소재의 밀도로 완성하는 컨템포러리 웨어.
              오늘의 무드를 당신의 방식으로.
            </p>
          </div>
          <div className="fsh-footer__cols">
            <div>
              <b>SHOP</b>
              <span>NEW</span>
              <span>OUTER</span>
              <span>LOOKBOOK</span>
            </div>
            <div>
              <b>HELP</b>
              <span>배송/교환</span>
              <span>사이즈 가이드</span>
              <span>1:1 문의</span>
            </div>
            <div>
              <b>FOLLOW</b>
              <span>Instagram</span>
              <span>Pinterest</span>
              <span>Newsletter</span>
            </div>
          </div>
        </div>
        <div className="fsh-footer__bar">
          <span>© 2026 MODE ATELIER — 가상 브랜드</span>
          <span className="fsh-footer__axone">AXONE 제작 샘플</span>
        </div>
      </footer>

      {/* ===== 상품 상세 모달 (뷰포트 오버레이) ===== */}
      {selected && (
        <div className="fsh-modal" onClick={() => setSelected(null)}>
          <div className="fsh-modal__box" onClick={(e) => e.stopPropagation()}>
            <button
              className="fsh-modal__close"
              onClick={() => setSelected(null)}
              aria-label="닫기"
            >
              ✕
            </button>
            {ordered ? (
              <div className="fsh-done fsh-done--modal">
                <div className="fsh-done__check">✓</div>
                <h3>주문이 완료되었습니다</h3>
                <p>실제 도입 시 PG 결제와 연동됩니다.</p>
                <button className="fsh-btn fsh-btn--dark" onClick={() => setSelected(null)}>
                  계속 쇼핑하기
                </button>
              </div>
            ) : (
              <div className="fsh-detail">
                <div
                  className="fsh-detail__vis"
                  style={{ background: selected.bg }}
                >
                  <Photo
                    src={`/lab-img/fashion/${selected.id}.webp`}
                    alt={selected.name}
                    fallback={<Garment type={selected.garment} />}
                  />
                  {selected.isNew && (
                    <span className="fsh-badge-tag fsh-badge-tag--new">NEW</span>
                  )}
                </div>
                <div className="fsh-detail__info">
                  <p className="fsh-detail__cat">{selected.cat}</p>
                  <h3 className="fsh-detail__name">{selected.name}</h3>
                  <div className="fsh-detail__price">
                    {selected.origPrice && (
                      <span className="fsh-card__orig">{won(selected.origPrice)}</span>
                    )}
                    <span className="fsh-detail__now">{won(selected.price)}</span>
                  </div>
                  <p className="fsh-detail__desc">{selected.desc}</p>

                  {/* 컬러 */}
                  <div className="fsh-opt">
                    <p className="fsh-opt__label">
                      컬러 {pickColor && <b>· {pickColor}</b>}
                    </p>
                    <div className="fsh-opt__row">
                      {selected.colors.map((c) => (
                        <button
                          key={c.name}
                          className={`fsh-colorbtn ${
                            pickColor === c.name ? "is-on" : ""
                          }`}
                          style={{ background: c.hex }}
                          onClick={() => setPickColor(c.name)}
                          title={c.name}
                          aria-label={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 사이즈 (필수) */}
                  <div className="fsh-opt">
                    <p className="fsh-opt__label">
                      사이즈 <span className="fsh-req">*필수</span>
                    </p>
                    <div className="fsh-opt__row">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          className={`fsh-sizebtn ${
                            pickSize === s ? "is-on" : ""
                          }`}
                          onClick={() => {
                            setPickSize(s);
                            setSizeWarn(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {sizeWarn && (
                      <p className="fsh-warn">사이즈를 선택해 주세요.</p>
                    )}
                  </div>

                  <div className="fsh-detail__actions">
                    <button
                      className="fsh-iconbtn fsh-iconbtn--lg"
                      onClick={() => toggleWish(selected.id)}
                      aria-label="위시리스트"
                    >
                      <span className={wishlist.has(selected.id) ? "fsh-heart-on" : ""}>
                        <Heart filled={wishlist.has(selected.id)} />
                      </span>
                    </button>
                    <button
                      className="fsh-btn fsh-btn--dark fsh-btn--wide"
                      disabled={selected.soldOut}
                      onClick={() => addToCart(selected, pickSize, pickColor)}
                    >
                      {selected.soldOut ? "품절" : "장바구니 담기"}
                    </button>
                  </div>

                  {/* 소재/배송 정보 */}
                  <div className="fsh-detail__meta">
                    <div className="fsh-detail__metarow">
                      <TrustIcon kind="gift" />
                      <span>{selected.material}</span>
                    </div>
                    <div className="fsh-detail__metarow">
                      <TrustIcon kind="ship" />
                      <span>15만원 이상 무료배송 · 평균 1~2일 내 도착</span>
                    </div>
                    <div className="fsh-detail__metarow">
                      <TrustIcon kind="return" />
                      <span>수령 후 14일 이내 무료 반품</span>
                    </div>
                  </div>

                  {/* 코디 추천 */}
                  <div className="fsh-coord">
                    <p className="fsh-coord__title">함께 코디하면 좋아요</p>
                    <div className="fsh-coord__row">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          className="fsh-coord__card"
                          onClick={() => openDetail(s)}
                        >
                          <span
                            className="fsh-coord__vis"
                            style={{ background: s.bg }}
                          >
                            <Photo src={`/lab-img/fashion/${s.id}.webp`} alt={s.name} fallback={<Garment type={s.garment} />} />
                          </span>
                          <span className="fsh-coord__name">{s.name}</span>
                          <span className="fsh-coord__price">{won(s.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 위시리스트 드로어 ===== */}
      <div className={`fsh-drawer ${wishOpen ? "is-open" : ""}`}>
        <div className="fsh-drawer__head">
          <h3>위시리스트 <span>{wishlist.size}</span></h3>
          <button onClick={() => setWishOpen(false)} aria-label="닫기">✕</button>
        </div>
        <div className="fsh-drawer__body">
          {wishItems.length === 0 ? (
            <p className="fsh-drawer__empty">아직 담은 상품이 없어요.</p>
          ) : (
            wishItems.map((p) => (
              <div key={p.id} className="fsh-line">
                <span className="fsh-line__vis" style={{ background: p.bg }}>
                  <Photo src={`/lab-img/fashion/${p.id}.webp`} alt={p.name} fallback={<Garment type={p.garment} />} />
                </span>
                <div className="fsh-line__info">
                  <p className="fsh-line__name">{p.name}</p>
                  <p className="fsh-line__meta">{won(p.price)}</p>
                  <button
                    className="fsh-linkbtn"
                    onClick={() => {
                      setWishOpen(false);
                      openDetail(p);
                    }}
                  >
                    옵션 선택 →
                  </button>
                </div>
                <button
                  className="fsh-line__del"
                  onClick={() => removeWish(p.id)}
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== 장바구니 드로어 ===== */}
      <div className={`fsh-drawer ${cartOpen ? "is-open" : ""}`}>
        <div className="fsh-drawer__head">
          <h3>장바구니 <span>{cartCount}</span></h3>
          <button onClick={() => setCartOpen(false)} aria-label="닫기">✕</button>
        </div>
        <div className="fsh-drawer__body">
          {ordered ? (
            <div className="fsh-done">
              <div className="fsh-done__check">✓</div>
              <h3>주문이 완료되었습니다</h3>
              <p>주문번호 MODE-20260814</p>
              <button
                className="fsh-btn fsh-btn--dark"
                onClick={() => {
                  setOrdered(false);
                  setCartOpen(false);
                }}
              >
                계속 쇼핑하기
              </button>
            </div>
          ) : cart.length === 0 ? (
            <p className="fsh-drawer__empty">장바구니가 비어 있어요.</p>
          ) : (
            cart.map((line, i) => {
              const p = PRODUCTS.find((x) => x.id === line.id)!;
              return (
                <div key={`${line.id}-${line.size}-${line.color}`} className="fsh-line">
                  <span className="fsh-line__vis" style={{ background: p.bg }}>
                    <Photo src={`/lab-img/fashion/${p.id}.webp`} alt={p.name} fallback={<Garment type={p.garment} />} />
                  </span>
                  <div className="fsh-line__info">
                    <p className="fsh-line__name">{p.name}</p>
                    <p className="fsh-line__meta">
                      {line.size} · {line.color}
                    </p>
                    <p className="fsh-line__price">{won(p.price * line.qty)}</p>
                    <div className="fsh-qty">
                      <button onClick={() => changeQty(i, -1)} aria-label="수량 감소">
                        −
                      </button>
                      <span>{line.qty}</span>
                      <button onClick={() => changeQty(i, 1)} aria-label="수량 증가">
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="fsh-line__del"
                    onClick={() => removeCart(i)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
        {!ordered && cart.length > 0 && (
          <div className="fsh-drawer__foot">
            <p className="fsh-shipnote">
              {shipRemain > 0
                ? `${won(shipRemain)} 더 담으면 무료배송!`
                : "무료배송 대상입니다 ✓"}
            </p>
            <div className="fsh-total">
              <span>합계</span>
              <b>{won(cartTotal)}</b>
            </div>
            <button className="fsh-btn fsh-btn--dark fsh-btn--block" onClick={checkout}>
              결제하기
            </button>
          </div>
        )}
      </div>

      {/* 드로어 오버레이 */}
      {(wishOpen || cartOpen) && (
        <div
          className="fsh-overlay"
          onClick={() => {
            setWishOpen(false);
            setCartOpen(false);
          }}
        />
      )}

      {/* 토스트 */}
      {toast && <div className="fsh-toast">{toast}</div>}
    </div>
  );
}
