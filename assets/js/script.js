/* =========================================================
  Odontologia Premium — Interações premium (Vanilla JS)
  - Sticky header com background no scroll
  - Menu mobile animado + acessível
  - Fade-in on scroll (IntersectionObserver)
  - Slider de depoimentos (carrossel) com dots + auto-play + swipe
  - Validação de formulário com feedback visual
  - CTA WhatsApp (flutuante + links inline/footer)
  - Loader elegante (opcional)
========================================================= */

(() => {
  "use strict";

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    slider: {
      index: 0,
      timer: null,
      isPointerDown: false,
      startX: 0,
      deltaX: 0,
    },
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setYear() {
    const el = qs("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initStickyHeader() {
    const header = qs("#header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    const nav = qs(".nav");
    const toggle = qs("#navToggle");
    const panel = qs("#navPanel");
    if (!nav || !toggle || !panel) return;

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    const open = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      isOpen ? close() : open();
    });

    // Fecha ao clicar em links
    qsa(".nav__link", panel).forEach((link) =>
      link.addEventListener("click", close),
    );
    qsa(".nav__cta", panel).forEach((link) =>
      link.addEventListener("click", close),
    );

    // Fecha ao clicar fora
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (nav.contains(target)) return;
      close();
    });

    // Fecha com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function initRevealOnScroll() {
    const items = qsa(".reveal");
    if (!items.length) return;

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    items.forEach((el) => io.observe(el));
  }

  function initSmoothAnchors() {
    // Ajuda a manter sensação "premium" em navegadores que ignoram scroll-behavior em alguns casos
    qsa('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        const target = qs(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", href);
      });
    });
  }

  function initScrollSpy() {
    const navLinks = qsa('.nav__link[href^="#"]');
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => qs(link.getAttribute("href")))
      .filter(Boolean);

    const updateActiveLink = () => {
      const scrollY = window.scrollY + 100; // Offset para considerar header

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        const sectionBottom = sectionTop + rect.height;

        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          navLinks.forEach((link) => link.classList.remove("is-active"));
          navLinks[index].classList.add("is-active");
        }
      });
    };

    window.addEventListener("scroll", updateActiveLink, { passive: true });
    updateActiveLink(); // Inicial
  }

  function initClickFeedback() {
    const interactiveElements = qsa(
      "button, .btn, .nav__link, .serviceCard, .featureCard",
    );

    interactiveElements.forEach((el) => {
      el.addEventListener("click", () => {
        el.classList.add("is-clicked");
        setTimeout(() => el.classList.remove("is-clicked"), 150);
      });
    });
  }

  function initWhatsAppLinks() {
    // Ajuste para número real do cliente:
    // - DDI/DDD + número (apenas dígitos) no "phoneDigits"
    // - Mensagem pronta no "message"
    const phoneDigits = "5500000000000";
    const message =
      "Olá! Gostaria de agendar uma avaliação. Poderiam me orientar sobre horários disponíveis?";
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

    const floatBtn = qs("#whatsappFloat");
    const inline = qs("#whatsLinkInline");
    const footer = qs("#whatsLinkFooter");

    [floatBtn, inline, footer].filter(Boolean).forEach((el) => {
      el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });
  }

  function sliderSetupDots(dotsEl, count, onSelect) {
    dotsEl.innerHTML = "";
    const buttons = [];

    for (let i = 0; i < count; i += 1) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("aria-label", `Ir para depoimento ${i + 1}`);
      b.addEventListener("click", () => onSelect(i));
      dotsEl.appendChild(b);
      buttons.push(b);
    }

    return buttons;
  }

  function initTestimonialsSlider() {
    const track = qs("#testimonialsTrack");
    const dots = qs("#testimonialsDots");
    const root = qs('[data-slider="testimonials"]');
    if (!track || !dots || !root) return;

    const slides = qsa(".tCard", track);
    if (slides.length <= 1) return;

    const btnPrev = qs("[data-slider-prev]", root);
    const btnNext = qs("[data-slider-next]", root);

    const goTo = (idx, opts = { animate: true }) => {
      state.slider.index = (idx + slides.length) % slides.length;
      if (!opts.animate) track.style.transition = "none";
      track.style.transform = `translateX(${-state.slider.index * 100}%)`;
      if (!opts.animate) {
        // força reflow para reativar transição sem glitch
        void track.offsetHeight;
        track.style.transition = "";
      }
      dotButtons.forEach((b, i) =>
        b.classList.toggle("is-active", i === state.slider.index),
      );
    };

    const next = () => goTo(state.slider.index + 1);
    const prev = () => goTo(state.slider.index - 1);

    const dotButtons = sliderSetupDots(dots, slides.length, (i) => goTo(i));
    goTo(0, { animate: false });

    btnNext && btnNext.addEventListener("click", next);
    btnPrev && btnPrev.addEventListener("click", prev);

    // Auto-play (com pausa em hover/foco)
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startAuto = () => {
      if (prefersReduced) return;
      stopAuto();
      state.slider.timer = window.setInterval(next, 6500);
    };
    const stopAuto = () => {
      if (state.slider.timer) {
        window.clearInterval(state.slider.timer);
        state.slider.timer = null;
      }
    };

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", startAuto);

    // Swipe / drag (touch + pointer)
    const onDown = (clientX) => {
      state.slider.isPointerDown = true;
      state.slider.startX = clientX;
      state.slider.deltaX = 0;
      stopAuto();
    };

    const onMove = (clientX) => {
      if (!state.slider.isPointerDown) return;
      state.slider.deltaX = clientX - state.slider.startX;
    };

    const onUp = () => {
      if (!state.slider.isPointerDown) return;
      state.slider.isPointerDown = false;

      const threshold = 50;
      if (Math.abs(state.slider.deltaX) > threshold) {
        state.slider.deltaX < 0 ? next() : prev();
      }
      startAuto();
    };

    root.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      root.setPointerCapture?.(e.pointerId);
      onDown(e.clientX);
    });

    root.addEventListener("pointermove", (e) => onMove(e.clientX));
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    // Teclado (setas)
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });

    // Reajuste em resize (evita drift, mantém index correto)
    window.addEventListener(
      "resize",
      () => goTo(state.slider.index, { animate: false }),
      { passive: true },
    );

    startAuto();
  }

  function initFormValidation() {
    const form = qs("#contactForm");
    const status = qs("#formStatus");
    if (!form || !status) return;

    const fields = {
      name: qs("#name", form),
      phone: qs("#phone", form),
      email: qs("#email", form),
      message: qs("#message", form),
    };

    const getFieldWrapper = (input) => (input ? input.closest(".field") : null);
    const setFieldState = (input, { valid, message = "" }) => {
      const wrap = getFieldWrapper(input);
      if (!wrap) return;
      const err = qs(`[data-error-for="${input.id}"]`, form);

      wrap.classList.toggle("is-invalid", !valid);
      wrap.classList.toggle("is-valid", valid);
      if (err) err.textContent = valid ? "" : message;
    };

    const validators = {
      name: (v) =>
        v.trim().length >= 3 ? "" : "Informe seu nome (mín. 3 caracteres).",
      phone: (v) => {
        const digits = v.replace(/\D/g, "");
        if (digits.length < 10) return "Informe um telefone válido (com DDD).";
        return "";
      },
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim())
          ? ""
          : "Informe um e-mail válido.",
      message: (v) =>
        v.trim().length >= 10
          ? ""
          : "Conte um pouco mais (mín. 10 caracteres).",
    };

    const validateOne = (key) => {
      const input = fields[key];
      if (!input) return true;
      const value = String(input.value || "");
      const error = validators[key](value);
      setFieldState(input, { valid: !error, message: error });
      return !error;
    };

    const setStatus = (type, text) => {
      status.classList.add("is-visible");
      status.classList.toggle("is-success", type === "success");
      status.classList.toggle("is-error", type === "error");
      status.textContent = text;
    };

    // Máscara simples de telefone (leve, sem libs)
    const formatPhone = (raw) => {
      const d = raw.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 10) {
        const a = d.slice(0, 2);
        const b = d.slice(2, 6);
        const c = d.slice(6, 10);
        if (!a) return "";
        if (d.length < 3) return `(${a}`;
        if (d.length < 7) return `(${a}) ${b}`;
        return `(${a}) ${b}-${c}`;
      }
      const a = d.slice(0, 2);
      const b = d.slice(2, 7);
      const c = d.slice(7, 11);
      if (!a) return "";
      if (d.length < 3) return `(${a}`;
      if (d.length < 8) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    };

    if (fields.phone) {
      fields.phone.addEventListener("input", () => {
        const caret = fields.phone.selectionStart || 0;
        fields.phone.value = formatPhone(fields.phone.value);
        fields.phone.setSelectionRange?.(caret, caret);
      });
    }

    Object.keys(fields).forEach((key) => {
      const input = fields[key];
      if (!input) return;
      input.addEventListener("blur", () => validateOne(key));
      input.addEventListener("input", () => {
        const wrap = getFieldWrapper(input);
        if (!wrap) return;
        if (wrap.classList.contains("is-invalid")) validateOne(key);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = ["name", "phone", "email", "message"]
        .map(validateOne)
        .every(Boolean);

      if (!ok) {
        setStatus(
          "error",
          "Por favor, revise os campos destacados para enviarmos sua mensagem.",
        );
        const firstInvalid = qs(
          ".field.is-invalid input, .field.is-invalid textarea",
          form,
        );
        firstInvalid?.focus();
        return;
      }

      // Simulação de envio (pronto para integrar com backend/WhatsApp API)
      const btn = qs('button[type="submit"]', form);
      if (btn) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent || "";
        btn.textContent = "Enviando…";
      }

      window.setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText || "Enviar mensagem";
        }
        form.reset();
        qsa(".field", form).forEach((f) =>
          f.classList.remove("is-valid", "is-invalid"),
        );
        setStatus(
          "success",
          "Mensagem enviada! Em breve nossa equipe entra em contato para confirmar seu horário.",
        );
      }, 800);
    });
  }

  function initImageFallbacks() {
    // Se as imagens ainda não existirem no projeto, mantém o visual premium sem quebrar layout.
    qsa("img").forEach((img) => {
      img.addEventListener(
        "error",
        () => {
          img.style.opacity = "0.0";
          img.style.height = img.style.height || "auto";
          img.style.background =
            "linear-gradient(135deg, rgba(219, 234, 254, 0.85), rgba(248, 250, 252, 0.95))";
        },
        { once: true },
      );
    });
  }

  function initBackToTop() {
    const btn = qs("#backToTop");
    if (!btn) return;

    const onScroll = () => {
      btn.classList.toggle("is-visible", window.scrollY > 400);
    };

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function init() {
    setYear();

    initStickyHeader();
    initMobileNav();
    initRevealOnScroll();
    initSmoothAnchors();
    initScrollSpy();
    initClickFeedback();
    initWhatsAppLinks();
    initTestimonialsSlider();
    initFormValidation();
    initImageFallbacks();
    initBackToTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
