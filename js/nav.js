/* 모바일(<880) 우측 슬라이드 메뉴
   - 오버레이(딤)와 우측 패널을 body 레벨에 생성 → 헤더의 stacking 문맥과 분리
     (헤더는 오버레이에 덮여 딤, 패널은 오버레이 위라 흰색 유지)
   - 햄버거 클릭으로 열기 · 오버레이/메뉴항목 클릭·ESC 로 닫기(열린 동안 햄버거 위치는 오버레이가 덮으므로 그 자리를 눌러도 닫힘) */
(function () {
  var btn = document.getElementById("hp-menu-btn");
  var nav = document.getElementById("hp-nav");
  if (!btn || !nav) return;

  var overlay = document.createElement("div");
  overlay.className = "hp-overlay";
  document.body.appendChild(overlay);

  var panel = document.createElement("nav");
  panel.className = "hp-menu";
  panel.setAttribute("aria-label", "메뉴");
  panel.innerHTML = nav.innerHTML;   // 메뉴 링크 복제(is-active 포함)
  document.body.appendChild(panel);

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("hp-menu-open", open);
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!panel.classList.contains("is-open"));
  });
  overlay.addEventListener("click", function () { setOpen(false); });
  panel.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) setOpen(false);
  });
})();

/* 커스텀 커서 : #9DFC00 원 (DOM 요소 → 어떤 화면(레티나 포함)에서도 선명)
   네이티브 커서는 CSS(cursor:none)로 숨김 · 마우스 있는 환경에서만 표시 */
(function () {
  var dot = document.createElement("div");
  dot.className = "hp-cursor";
  dot.setAttribute("aria-hidden", "true");
  var added = false;
  function place(x, y) {
    if (!added) { document.body.appendChild(dot); added = true; }
    dot.style.transform = "translate(" + x + "px," + y + "px)";
    dot.style.opacity = "1";
  }
  function hide() { dot.style.opacity = "0"; }

  // 마우스: 이동하면 따라오고, 화면 밖으로 나가면 숨김
  window.addEventListener("mousemove", function (e) { place(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener("mouseleave", hide);
  window.addEventListener("mousedown", function () { dot.classList.add("is-down"); });
  window.addEventListener("mouseup", function () { dot.classList.remove("is-down"); });

  // 터치: 손가락 따라 표시 · 떼면 사라짐(자리에 남지 않게)
  function touch(e) { var t = e.touches && e.touches[0]; if (t) place(t.clientX, t.clientY); }
  window.addEventListener("touchstart", function (e) { dot.classList.add("is-down"); touch(e); }, { passive: true });
  window.addEventListener("touchmove", touch, { passive: true });
  window.addEventListener("touchend", function () { dot.classList.remove("is-down"); hide(); }, { passive: true });
  window.addEventListener("touchcancel", hide, { passive: true });
})();
