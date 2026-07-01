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
  return `<a class="designer-card" href="designer-detail.html?id=${d.id}" data-initial="${d.initial}">
    ${phImage(d.profileImage, d.name, "designer-card__thumb")}
    <div class="designer-card__info">
      <p class="designer-card__name">${d.name}</p>
      <p class="designer-card__roman">${d.nameRoman}</p>
    </div>
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
  // 상세 페이지는 상위 메뉴에 매핑
  const navKey = { "work-detail": "works", "designer-detail": "designer" }[page] || page;
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.dataset.nav === navKey) a.classList.add("is-active");
  });
}

/* ============================================================
   WORKS 목록 페이지 (Figma 2314:2505)
   상단 스튜디오 탭(융합/혁신) + 4열 작품 그리드
   ============================================================ */
function worksListCard(w) {
  return `<a class="work-card" href="work-detail.html?id=${w.id}">
    ${phImage(w.thumbnail, w.title, "work-card__thumb")}
    <div class="work-card__info">
      <p class="work-card__title">${w.title}</p>
      <p class="work-card__designer">${w.designer}</p>
    </div>
  </a>`;
}

async function initWorks() {
  const [works, site] = await Promise.all([loadJSON("works"), loadJSON("site")]);
  const gridEl = document.getElementById("works-grid");
  const sideEl = document.getElementById("studio-side");
  const descEl = document.getElementById("studio-desc");

  // 스튜디오 순서: 융합 → 혁신 고정 (선택해도 순서 유지)
  const STUDIO_ORDER = ["convergence", "innovation"];

  let activeStudio = null; // null(미선택) | convergence | innovation
  let activeProf = null; // null | 교수명(성)

  function currentList() {
    let list = works;
    if (activeStudio) list = list.filter((w) => w.studio === activeStudio);
    if (activeProf) list = list.filter((w) => w.professor.startsWith(activeProf));
    return list;
  }

  function renderGrid() {
    const list = currentList();
    gridEl.innerHTML = list.length
      ? list.map(worksListCard).join("")
      : `<p class="empty-msg">표시할 작품이 없습니다.</p>`;
  }

  function renderSide() {
    // 순서 고정: 융합 → 혁신
    sideEl.innerHTML = STUDIO_ORDER
      .map((key) => {
        const st = site.studios[key];
        const isActive = activeStudio === key;
        const isDim = activeStudio && !isActive;
        const profs = isActive
          ? `<ul class="prof-list">${st.professors
              .map(
                (p) =>
                  `<li><button class="prof-item${
                    activeProf === p ? " is-active" : ""
                  }" type="button" data-prof="${p}">${p} 교수님</button></li>`
              )
              .join("")}</ul>`
          : "";
        return `<div class="studio-block${isDim ? " is-dim" : ""}" data-studio="${key}">
          <button class="studio-cat" type="button" data-studio="${key}">
            <span class="studio-cat__ko">${st.ko}</span>
            <span class="studio-cat__en">${st.en}</span>
          </button>
          ${profs}
        </div>`;
      })
      .join("");

    // 스튜디오 카테고리 클릭 → 선택/필터
    sideEl.querySelectorAll(".studio-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.studio;
        activeStudio = key;
        activeProf = null; // 스튜디오 변경 시 교수 필터 초기화
        renderSide();
        syncDesc();
        renderGrid();
      });
    });
    // 교수 클릭 → 해당 교수 작품으로 필터
    sideEl.querySelectorAll(".prof-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = btn.dataset.prof;
        activeProf = activeProf === p ? null : p; // 재클릭 시 해제
        renderSide();
        renderGrid();
      });
    });
  }

  function syncDesc() {
    if (activeStudio) {
      descEl.textContent = site.studios[activeStudio].description;
      descEl.hidden = false;
    } else {
      descEl.hidden = true;
    }
  }

  renderSide();
  syncDesc();
  renderGrid();
}

/* ============================================================
   WORK DETAIL 페이지 (Works · Designer 공용)
   ============================================================ */
async function initWorkDetail() {
  const works = await loadJSON("works");
  const id = new URLSearchParams(location.search).get("id");
  const work = works.find((w) => w.id === id) || works[0];
  const root = document.getElementById("work-detail");

  // 좌측 대표 이미지 (다중 스크롤)
  const imgs = work.images && work.images.length ? work.images : [work.thumbnail];
  root.querySelector(".work-gallery").innerHTML =
    imgs.map((src) => phImage(src, work.title)).join("");

  // 우측 정보 패널
  root.querySelector(".work-detail__name").textContent =
    `${work.designer}  ${work.designerRoman}`;
  root.querySelector(".work-meta__studio").innerHTML =
    `<span>${work.studioName}</span><span>|</span><span>${work.professor}</span>`;
  root.querySelector(".work-meta__title").textContent = work.title;
  root.querySelector(".work-meta__desc").textContent = work.description;

  if (work.aiUsed) root.querySelector(".work-meta__ai").hidden = false;

  // 다른 작품 둘러보기 (현재 제외 4개)
  const related = works.filter((w) => w.id !== work.id).slice(0, 4);
  document.querySelector(".related-block .related-grid").innerHTML =
    related.map(worksListCard).join("");
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

  filterEl.querySelectorAll(".initial-item").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterEl.querySelectorAll(".initial-item").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const init = chip.dataset.initial;
      gridEl.querySelectorAll(".designer-card").forEach((card) => {
        const show = init === "all" || card.dataset.initial === init;
        card.style.display = show ? "" : "none";
      });
      // 초성 클릭 시 맨 위로
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // 프로필
  root.querySelector(".dd-profile__photo-wrap").innerHTML =
    phImage(d.profileImage, d.name, "dd-profile__photo");
  root.querySelector(".dd-name__ko").textContent = d.name;
  root.querySelector(".dd-name__roman").textContent = d.nameRoman;

  const igEl = root.querySelector(".js-instagram");
  igEl.href = `https://instagram.com/${d.instagram.replace("@", "")}`;
  igEl.textContent = d.instagram;
  const mailEl = root.querySelector(".js-email");
  mailEl.href = `mailto:${d.email}`;
  mailEl.textContent = d.email;

  root.querySelector(".dd-intro").textContent = d.intro;
  root.querySelector(".js-interview1").textContent = d.interview1;
  root.querySelector(".js-interview2").textContent = d.interview2;

  // Projects (학생 작품)
  const myWorks = (d.workIds || [])
    .map((wid) => works.find((w) => w.id === wid))
    .filter(Boolean);
  root.querySelector(".dd-projects__grid").innerHTML = myWorks
    .map(
      (w) => `<a class="project-card" href="work-detail.html?id=${w.id}">
        ${phImage(w.thumbnail, w.title, "project-card__thumb")}
        <div class="project-card__info">
          <p class="project-card__title">${w.title}</p>
          <p class="project-card__studio">${w.studioName}</p>
        </div>
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
