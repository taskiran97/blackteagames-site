(() => {
  const root = document.documentElement;

  // ---- language: English is in the markup, German comes from data-de ----
  const nodes = [...document.querySelectorAll("[data-de], [data-de-html]")];
  nodes.forEach((el) => { el.dataset.en = el.innerHTML; });

  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang;
    nodes.forEach((el) => {
      if (lang === "de") el.innerHTML = el.dataset.deHtml ?? el.dataset.de;
      else el.innerHTML = el.dataset.en;
    });
    try { localStorage.setItem("btg-lang", lang); } catch (_) {}
  }

  let saved = null;
  try { saved = localStorage.getItem("btg-lang"); } catch (_) {}
  const initial = saved || ((navigator.language || "en").toLowerCase().startsWith("de") ? "de" : "en");
  if (initial !== "en") setLang(initial);

  document.querySelector(".lang").addEventListener("click", () => {
    setLang(root.dataset.lang === "de" ? "en" : "de");
  });

  // ---- videos only play while visible ----
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videos = document.querySelectorAll("video");
  if (!reduce && "IntersectionObserver" in window) {
    const vo = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.preload = "auto"; target.play().catch(() => {}); }
        else target.pause();
      });
    }, { threshold: 0.35 });
    videos.forEach((v) => vo.observe(v));
  }

  // ---- reveal on scroll ----
  const revealables = document.querySelectorAll(".epoch, .ledger, .m, .specs, .zg-copy, .fan, .zg-shot, .studio, .contact");
  if (!reduce && "IntersectionObserver" in window) {
    revealables.forEach((el) => el.classList.add("reveal"));
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealables.forEach((el) => ro.observe(el));
  }

  // ---- screenshot lightbox ----
  const lb = document.querySelector(".lightbox");
  const lbImg = lb.querySelector("img");
  let lastFocus = null;
  const close = () => { lb.hidden = true; lbImg.src = ""; lastFocus?.focus(); };
  document.querySelectorAll(".zoom").forEach((btn) => {
    btn.addEventListener("click", () => {
      lastFocus = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = btn.querySelector("img").alt;
      lb.hidden = false;
      lb.querySelector(".lb-close").focus();
    });
  });
  lb.addEventListener("click", (e) => { if (e.target !== lbImg) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
})();
