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
