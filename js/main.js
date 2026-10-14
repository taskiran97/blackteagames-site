(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- language: English lives in the markup, German in data-de ---------- */
  const i18nNodes = $$("[data-de], [data-de-html]");
  i18nNodes.forEach((el) => { el.dataset.en = el.innerHTML; });
  const caption = $(".sc-screen figcaption");

  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang;
    i18nNodes.forEach((el) => {
      el.innerHTML = lang === "de" ? (el.dataset.deHtml ?? el.dataset.de) : el.dataset.en;
    });
    const tab = $(".sc-tabs [aria-selected='true']");
    if (tab && caption) caption.textContent = tab.dataset["cap" + (lang === "de" ? "De" : "En")];
    try { localStorage.setItem("btg-lang", lang); } catch (_) {}
  }
  let savedLang = null;
  try { savedLang = localStorage.getItem("btg-lang"); } catch (_) {}
  const startLang = savedLang || ((navigator.language || "en").toLowerCase().startsWith("de") ? "de" : "en");
  if (startLang !== "en") setLang(startLang);
  $(".lang").addEventListener("click", () => setLang(root.dataset.lang === "de" ? "en" : "de"));

  /* ---------- intro (once per session) ---------- */
  const intro = $(".intro");
  let seen = false;
  try { seen = sessionStorage.getItem("btg-intro") === "1"; } catch (_) {}
  function endIntro() {
    if (!intro || intro.classList.contains("gone")) return;
    try { sessionStorage.setItem("btg-intro", "1"); } catch (_) {}
    if (hasGsap && !reduce) {
      gsap.to(intro, { autoAlpha: 0, duration: .6, ease: "power2.out", onComplete: () => intro.classList.add("gone") });
    } else intro.classList.add("gone");
    heroIn();
  }
  if (seen || reduce) { intro?.classList.add("gone"); }
  else {
    const t0 = performance.now();
    const finish = () => setTimeout(endIntro, Math.max(0, 1500 - (performance.now() - t0)));
    if (document.readyState === "complete") finish(); else addEventListener("load", finish, { once: true });
    setTimeout(endIntro, 3200); // never hold the page hostage
  }

  /* ---------- nav ---------- */
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined" && hasGsap) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 ? $(id) : null;
      if (!target && id !== "#top") return;
      e.preventDefault();
      const el = id === "#top" ? 0 : target;
      if (lenis) lenis.scrollTo(el, { offset: id === "#top" ? 0 : -60, duration: 1.4 });
      else (el === 0 ? scrollTo({ top: 0, behavior: "smooth" }) : el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
    });
  });

  /* ---------- videos: only play what's on screen ---------- */
  const epochVideos = $$(".ep video");
  if ("IntersectionObserver" in window) {
    const vo = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && !reduce) { target.preload = "auto"; target.play().catch(() => {}); }
        else target.pause();
      });
    }, { threshold: 0.25 });
    $$("video").filter((v) => !epochVideos.includes(v) && !v.closest(".modal")).forEach((v) => vo.observe(v));
  }

  /* ---------- hero entrance ---------- */
  let heroDone = false;
  function heroIn() {
    if (heroDone || !hasGsap || reduce) return;
    heroDone = true;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero-video", { scale: 1.15, duration: 2.4, ease: "power2.out" }, 0)
      .from(".hero-tag", { y: 20, autoAlpha: 0, duration: .8 }, .2)
      .from(".ht-line", { yPercent: 110, autoAlpha: 0, duration: 1.2, stagger: .14 }, .3)
      .from(".hero-sub", { y: 24, autoAlpha: 0, duration: 1 }, .8)
      .from(".hero .cta-row > *", { y: 24, autoAlpha: 0, duration: .9, stagger: .1 }, .95)
      .from(".scroll-hint", { autoAlpha: 0, duration: .8 }, 1.4);
  }
  if (seen || reduce) heroIn();

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    if (!reduce) {
      /* hero drifts back as you leave it */
      gsap.to(".hero-video", { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-content", { yPercent: -25, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

      /* generic reveals */
      const reveal = $$(".sec-head, .teaser-frame, .showcase, .ledger, .features article, .clip, .specs, .wb-copy > *, .zg-copy > *, .zg-shot, .studio-copy > *, .press-card, .contact > *");
      gsap.set(reveal, { y: 40, autoAlpha: 0 });
      ScrollTrigger.batch(reveal, {
        start: "top 88%",
        onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: .08, overwrite: true }),
      });

      /* teaser frame zooms out of the dark */
      gsap.fromTo(".teaser-frame img", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".teaser-frame", start: "top bottom", end: "bottom center", scrub: true } });

      /* ledger counts up like a cash register */
      $$(".ledger dd").forEach((dd) => {
        const end = +dd.dataset.count, suffix = dd.dataset.suffix || "";
        const o = { v: 0 };
        ScrollTrigger.create({
          trigger: ".ledger", start: "top 85%", once: true,
          onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => { dd.textContent = Math.round(o.v) + suffix; } }),
        });
      });

      /* cards deal in */
      gsap.from(".holo", {
        y: 160, rotate: 0, autoAlpha: 0, duration: 1.1, ease: "back.out(1.4)", stagger: { each: .09, from: "center" },
        scrollTrigger: { trigger: ".deck", start: "top 85%" }, clearProps: "transform,opacity,visibility",
      });

      /* the studio's tea fills as you scroll */
      gsap.fromTo(".studio .tea-liquid", { y: 240 }, { y: 0, ease: "none", scrollTrigger: { trigger: ".studio", start: "top 85%", end: "center 55%", scrub: true } });

      /* wishlist band parallax */
      gsap.fromTo(".wish-band img", { yPercent: -10, scale: 1.1 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".wish-band", start: "top bottom", end: "bottom top", scrub: true } });
    }

    /* ---------- epochs: pinned on desktop, stacked on phones ---------- */
    const eps = $$(".ep");
    const bars = $$(".ep-progress span");
    const mm = gsap.matchMedia();
    mm.add("(min-width: 700px) and (prefers-reduced-motion: no-preference)", () => {
      let current = -1;
      const show = (i) => {
        if (i === current) return;
        eps.forEach((ep, k) => {
          const on = k === i;
          ep.classList.toggle("is-active", on);
          gsap.to(ep, { autoAlpha: on ? 1 : 0, duration: .7, ease: "power2.out", overwrite: true });
          if (on) {
            gsap.fromTo(ep.querySelector(".ep-copy"), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: "power3.out", delay: .1 });
            gsap.fromTo(ep.querySelector("video"), { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "power2.out" });
          }
          const v = ep.querySelector("video");
          if (on) { v.preload = "auto"; v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
          bars[k]?.classList.toggle("on", on);
        });
        current = i;
      };
      gsap.set(eps, { autoAlpha: 0 });
      const st = ScrollTrigger.create({
        trigger: ".ep-stage", start: "top top", end: "+=" + innerHeight * 2.4, pin: true, anticipatePin: 1,
        onUpdate: (self) => show(Math.min(2, Math.floor(self.progress * 3))),
        onEnter: () => show(Math.max(0, current)),
        onEnterBack: () => show(Math.max(0, current)),
        onLeave: () => eps.forEach((ep) => ep.querySelector("video").pause()),
        onLeaveBack: () => eps.forEach((ep) => ep.querySelector("video").pause()),
      });
      show(0);
      return () => { st.kill(); gsap.set(eps, { clearProps: "all" }); };
    });
    mm.add("(max-width: 699px), (prefers-reduced-motion: reduce)", () => {
      root.classList.add("static-epochs");
      const io = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && !reduce) target.play().catch(() => {}); else target.pause();
      }), { threshold: 0.3 });
      epochVideos.forEach((v) => io.observe(v));
      return () => { root.classList.remove("static-epochs"); io.disconnect(); };
    });

    addEventListener("load", () => ScrollTrigger.refresh());
  } else {
    root.classList.add("static-epochs");
  }

  /* ---------- in-game showcase tabs ---------- */
  const tabs = $$(".sc-tabs [role='tab']");
  const shot = $(".sc-bezel img");
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); select(next);
    });
  });
  function select(tab) {
    if (tab.getAttribute("aria-selected") === "true") return;
    tabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    shot.classList.add("swap");
    const next = new Image();
    next.src = tab.dataset.shot;
    next.onload = () => { shot.src = tab.dataset.shot; shot.classList.remove("swap"); };
    caption.textContent = tab.dataset["cap" + (root.dataset.lang === "de" ? "De" : "En")];
  }
  tabs.forEach((t) => { const im = new Image(); im.src = t.dataset.shot; }); // warm the cache

  /* ---------- holo cards follow the pointer ---------- */
  if (!reduce && matchMedia("(hover: hover)").matches) {
    $$(".holo").forEach((card) => {
      const inner = card.querySelector(".holo-in");
      card.addEventListener("pointermove", (e) => {
        const r = inner.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        inner.style.setProperty("--ry", (x - .5) * 28 + "deg");
        inner.style.setProperty("--rx", (.5 - y) * 28 + "deg");
        inner.style.setProperty("--mx", x * 100 + "%");
        inner.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("pointerleave", () => {
        ["--rx", "--ry"].forEach((p) => inner.style.setProperty(p, "0deg"));
      });
    });
  }

  /* ---------- modals: trailer + screenshots ---------- */
  let lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    lenis?.stop();
    m.querySelector(".modal-close").focus();
  }
  function closeModal(m) {
    m.hidden = true;
    m.querySelector("video")?.pause();
    const img = m.querySelector(":scope > img"); if (img) img.removeAttribute("src");
    lenis?.start();
    lastFocus?.focus();
  }
  const trailer = $("#trailer");
  $$("[data-play-trailer]").forEach((b) => b.addEventListener("click", () => {
    openModal(trailer);
    const v = trailer.querySelector("video");
    v.currentTime = 0; v.play().catch(() => {});
  }));
  const lb = $(".lightbox");
  $$(".zoom").forEach((b) => b.addEventListener("click", () => {
    const img = lb.querySelector("img");
    img.src = b.dataset.full; img.alt = b.querySelector("img").alt;
    openModal(lb);
  }));
  $$(".modal").forEach((m) => {
    m.addEventListener("click", (e) => { if (e.target === m || e.target.classList.contains("modal-close")) closeModal(m); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = $$(".modal").find((m) => !m.hidden);
    if (open) closeModal(open);
  });
})();
