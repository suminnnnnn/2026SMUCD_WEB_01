/* ============================================================
   main.js — 졸업전시 사이트 인터랙션 / 데이터 렌더
   * data/*.json 을 fetch 하므로 로컬에서는 VS Code "Live Server"
     같은 정적 서버로 열어야 합니다 (file:// 직접 열기 시 fetch 차단).
   * 추후 Eleventy 이관 시 이 렌더 로직은 템플릿(.njk)으로 대체됩니다.
   ============================================================ */

const DATA_PATH = "data/";

/* ---------- 공통 유틸 ---------- */
async function loadJSON(name) {
  const res = await fetch(`${DATA_PATH}${name}.json`);
  if (!res.ok) throw new Error(`${name}.json 로드 실패`);
  return res.json();
}

// 이미지 placeholder: 실제 이미지가 있으면 표시, 없으면 체크무늬 유지
function phImage(src, label, extraClass = "") {
  const safe = label ? label.replace(/"/g, "&quot;") : "이미지";
  return `<div class="ph ${extraClass}" data-label="${safe}">
    <img src="${src}" alt="${safe}" loading="lazy"
      onload="this.classList.add('is-loaded'); this.closest('.ph').classList.add('is-loaded');"
      onerror="this.remove();">
  </div>`;
}

function workCard(work) {
  return `<a class="card" href="work-detail.html?id=${work.id}">
    ${phImage(work.thumbnail, work.title)}
    <p class="card__title">${work.title}</p>
    <p class="card__meta">${work.designer} · ${work.designerRoman}</p>
  </a>`;
}

function designerCard(d) {
  return `<a class="card card--designer" href="designer-detail.html?id=${d.id}" data-initial="${d.initial}">
    ${phImage(d.profileImage, d.name)}
    <p class="card__title">${d.name}</p>
    <p class="card__meta">${d.nameRoman}</p>
  </a>`;
}

// 한글 첫 글자 → 초성 추출 (initial 필드 없을 때 대비)
const CHOSEONG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const DOUBLE_MAP = { "ㄲ":"ㄱ", "ㄸ":"ㄷ", "ㅃ":"ㅂ", "ㅆ":"ㅅ", "ㅉ":"ㅈ" };
function getInitial(name) {
  const code = name.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return name[0];
  let ch = CHOSEONG[Math.floor(code / 588)];
  return DOUBLE_MAP[ch] || ch;
}

/* ---------- 네비게이션 활성 표시 ---------- */
function initNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("is-active");
  });
}

/* ============================================================
   WORKS 페이지
   ============================================================ */
async function initWorks() {
  const [works, site] = await Promise.all([loadJSON("works"), loadJSON("site")]);
  const splitEl = document.getElementById("studio-split");
  const detailEl = document.getElementById("studio-detail");

  const byStudio = (s) => works.filter((w) => w.studio === s);

  // (A) 좌우 분할 그리드 채우기
  document.querySelectorAll(".studio-col").forEach((col) => {
    const studio = col.dataset.studio;
    col.querySelector(".grid--works").innerHTML =
      byStudio(studio).map(workCard).join("");
  });

  // 스튜디오 헤더 클릭 → (B) 상세 진입
  document.querySelectorAll(".studio-head").forEach((head) => {
    head.addEventListener("click", () => openStudio(head.dataset.studio));
  });

  function openStudio(studio) {
    const meta = site.studios[studio];
    // split 흐림 처리
    splitEl.classList.add("has-selection");
    document.querySelectorAll(".studio-col").forEach((col) => {
      col.classList.toggle("is-dimmed", col.dataset.studio !== studio);
    });

    // 상세 패널 구성
    detailEl.querySelector(".studio-detail__ko").textContent = meta.ko;
    detailEl.querySelector(".studio-detail__en").textContent = meta.en;
    detailEl.querySelector(".studio-detail__desc").textContent = meta.description;

    // 교수 필터 chip
    const filterEl = detailEl.querySelector(".prof-filter");
    filterEl.innerHTML =
      `<button class="chip is-active" data-prof="all">전체</button>` +
      meta.professors.map((p) => `<button class="chip" data-prof="${p}">${p}</button>`).join("");

    const gridEl = detailEl.querySelector(".grid--works");
    renderStudioWorks(studio, "all", gridEl);

    filterEl.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        filterEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        renderStudioWorks(studio, chip.dataset.prof, gridEl);
      });
    });

    detailEl.classList.add("is-open");
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderStudioWorks(studio, prof, gridEl) {
    let list = byStudio(studio);
    if (prof !== "all") list = list.filter((w) => w.professor.startsWith(prof));
    gridEl.innerHTML = list.length
      ? list.map(workCard).join("")
      : `<p class="empty-msg">해당 교수님의 작품이 아직 없습니다.</p>`;
  }

  // 뒤로(분할 보기로 복귀)
  detailEl.querySelector(".btn-back-split").addEventListener("click", () => {
    detailEl.classList.remove("is-open");
    splitEl.classList.remove("has-selection");
    document.querySelectorAll(".studio-col").forEach((c) => c.classList.remove("is-dimmed"));
    splitEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ============================================================
   WORK DETAIL 페이지 (Works · Designer 공용)
   ============================================================ */
async function initWorkDetail() {
  const works = await loadJSON("works");
  const id = new URLSearchParams(location.search).get("id");
  const work = works.find((w) => w.id === id) || works[0];
  const root = document.getElementById("work-detail");

  // 갤러리
  const imgs = (work.images && work.images.length ? work.images : [work.thumbnail]);
  root.querySelector(".work-gallery").innerHTML =
    imgs.map((src) => phImage(src, work.title)).join("");

  // 정보 패널
  root.querySelector(".work-info__designer").innerHTML =
    `${work.designer} <small>${work.designerRoman}</small>`;
  root.querySelector(".work-info__studio").textContent =
    `${work.studioName} | ${work.professor}`;
  root.querySelector(".work-info__title").textContent = work.title;
  root.querySelector(".work-info__desc").textContent = work.description;

  const aiEl = root.querySelector(".ai-badge");
  if (work.aiUsed) aiEl.hidden = false;

  // 다른 작품 둘러보기 (현재 제외 4개)
  const related = works.filter((w) => w.id !== work.id).slice(0, 4);
  document.querySelector(".related-block .grid--related").innerHTML =
    related.map(workCard).join("");
}

/* ============================================================
   DESIGNER 목록 페이지
   ============================================================ */
async function initDesigners() {
  const designers = await loadJSON("designers");
  const gridEl = document.getElementById("designer-grid");
  const filterEl = document.getElementById("initial-filter");

  // ㄱㄴㄷ순 정렬
  designers.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  gridEl.innerHTML = designers.map(designerCard).join("");

  filterEl.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const init = chip.dataset.initial;
      gridEl.querySelectorAll(".card--designer").forEach((card) => {
        const show = init === "all" || card.dataset.initial === init;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

/* ============================================================
   DESIGNER 상세 페이지
   ============================================================ */
async function initDesignerDetail() {
  const [designers, works] = await Promise.all([
    loadJSON("designers"),
    loadJSON("works"),
  ]);
  const id = new URLSearchParams(location.search).get("id");
  const d = designers.find((x) => x.id === id) || designers[0];
  const root = document.getElementById("designer-detail-root");

  root.querySelector(".designer-photo-wrap").innerHTML =
    phImage(d.profileImage, d.name, "designer-photo");
  root.querySelector(".designer-name").textContent = d.name;
  root.querySelector(".designer-roman").textContent = d.nameRoman;
  root.querySelector(".js-instagram").innerHTML =
    `<a href="https://instagram.com/${d.instagram.replace("@", "")}" target="_blank" rel="noopener">${d.instagram}</a>`;
  root.querySelector(".js-email").innerHTML =
    `<a href="mailto:${d.email}">${d.email}</a>`;
  root.querySelector(".designer-intro").textContent = d.intro;
  root.querySelector(".js-interview1").textContent = d.interview1;
  root.querySelector(".js-interview2").textContent = d.interview2;

  // 학생 작품
  const myWorks = (d.workIds || [])
    .map((wid) => works.find((w) => w.id === wid))
    .filter(Boolean);
  document.querySelector(".projects .grid--works").innerHTML = myWorks
    .map(
      (w) => `<a class="card" href="work-detail.html?id=${w.id}">
        ${phImage(w.thumbnail, w.title)}
        <p class="card__title">${w.title}</p>
        <p class="card__meta">${w.studioName}</p>
      </a>`
    )
    .join("");
}

/* ============================================================
   부트스트랩
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  const page = document.body.dataset.page;
  const run = {
    works: initWorks,
    "work-detail": initWorkDetail,
    designer: initDesigners,
    "designer-detail": initDesignerDetail,
  }[page];
  if (run) {
    run().catch((err) => {
      console.error(err);
      const main = document.querySelector("main");
      if (main) {
        const note = document.createElement("p");
        note.className = "empty-msg container";
        note.textContent =
          "데이터를 불러오지 못했습니다. 로컬에서는 VS Code의 ‘Live Server’ 등 정적 서버로 열어주세요.";
        main.prepend(note);
      }
    });
  }
});
