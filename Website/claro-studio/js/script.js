/* Claro Studio interactions.
   Contact delivery is configured on the form in index.html:
   - action="mailto:..." is the fallback. A valid form opens the email app.
     The message is not delivered until the visitor sends that email.
   - data-endpoint="" can be a Formspree-style URL. When set, the form POSTs
     FormData and only then reports that the message was sent.
   localStorage keys:
   - claro-motion: "reduce" | "allow"
   - claro-portfolio-filter
   - claro-slider-paused: "1" | "0"
   - claro-contact-draft: JSON draft of the contact form
*/
(function () {
  "use strict";

  var MENU_BREAKPOINT = 900;

  function motionOn() {
    var root = document.documentElement;
    if (root.classList.contains("motion-off")) return false;
    if (root.classList.contains("motion-on")) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (err) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (err) { /* private mode */ }
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (err) { /* private mode */ }
  }

  var header = document.getElementById("header");
  var toggle = document.querySelector(".nav-toggle");
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Navigation */
  function setMenuInert() {
    var nav = document.getElementById("site-nav");
    if (!nav) return;
    var mobileClosed = window.innerWidth <= MENU_BREAKPOINT && !(header && header.classList.contains("menu-open"));
    if (mobileClosed) nav.setAttribute("inert", "");
    else nav.removeAttribute("inert");
  }

  function closeMenu() {
    if (!header || !header.classList.contains("menu-open")) {
      setMenuInert();
      return;
    }
    header.classList.remove("menu-open");
    document.body.classList.remove("lock");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    setMenuInert();
  }

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      document.body.classList.toggle("lock", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      setMenuInert();
    });

    header.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= MENU_BREAKPOINT) closeMenu();
      });
    });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = navLinks.map(function (link) {
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return null;
    return document.querySelector(href);
  }).filter(Boolean);

  function spyNav() {
    var current = sections[0] ? sections[0].id : "";
    var marker = 130;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) current = section.id;
    });
    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + current;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  /* Scroll reveal and counters */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!motionOn() || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!motionOn() || isNaN(target)) {
      el.textContent = String(target || el.textContent);
      return;
    }
    var start = 0;
    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / 1100, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll(".stat-num"));
  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* Portfolio filter — last choice is remembered on this browser */
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".work-card"));
  var workCount = document.getElementById("work-count");

  function applyFilter(name) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = name === "all" || card.getAttribute("data-category") === name;
      card.hidden = !match;
      if (match) shown += 1;
    });
    filters.forEach(function (button) {
      var on = button.getAttribute("data-filter") === name;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (workCount) {
      workCount.textContent = "Showing " + shown + (shown === 1 ? " area of work" : " areas of work");
    }
    storageSet("claro-portfolio-filter", name);
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter"));
    });
  });

  var savedFilter = storageGet("claro-portfolio-filter");
  if (savedFilter && filters.some(function (button) { return button.getAttribute("data-filter") === savedFilter; })) {
    applyFilter(savedFilter);
  }

  /* Shared dialog for services and portfolio */
  var modal = document.getElementById("modal");
  var modalPanel = modal ? modal.querySelector(".modal-panel") : null;
  var modalImage = document.getElementById("modal-image");
  var modalKicker = document.getElementById("modal-kicker");
  var modalTitle = document.getElementById("modal-title");
  var modalCopy = document.getElementById("modal-copy");
  var modalCta = document.getElementById("modal-cta");
  var modalClose = document.getElementById("modal-close");
  var lastFocus = null;
  var serviceByCategory = {
    branding: "branding",
    social: "social-marketing",
    websites: "web",
    ads: "ads",
    campaigns: "strategy"
  };

  function inertPage(on) {
    ["header", "main", "footer"].forEach(function (id) {
      var el = document.getElementById(id) || document.querySelector(id);
      if (el) {
        if (on) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      }
    });
    var top = document.getElementById("back-to-top");
    if (top) {
      if (on) top.setAttribute("inert", "");
      else top.removeAttribute("inert");
    }
  }

  function openModal(data) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modalKicker.textContent = data.kicker || "";
    modalTitle.textContent = data.title || "";
    modalCopy.textContent = data.copy || "";
    if (data.image) {
      modalImage.hidden = false;
      modalImage.src = data.image;
      modalImage.alt = data.alt || "";
    } else {
      modalImage.hidden = true;
      modalImage.removeAttribute("src");
      modalImage.alt = "";
    }
    modalCta.textContent = data.cta || "Start a project";
    if (data.service) modalCta.setAttribute("data-service", data.service);
    else modalCta.removeAttribute("data-service");
    modal.hidden = false;
    document.body.classList.add("lock");
    inertPage(true);
    modalClose.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("lock");
    inertPage(false);
    setMenuInert();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function goToContact(service) {
    var select = document.getElementById("service");
    if (select && service) {
      select.value = service;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    var contact = document.getElementById("contact");
    if (contact) {
      contact.scrollIntoView({ behavior: motionOn() ? "smooth" : "auto", block: "start" });
    }
    var name = document.getElementById("full-name");
    if (name) window.setTimeout(function () { name.focus(); }, motionOn() ? 400 : 0);
  }

  if (modal) {
    document.querySelectorAll(".work-open").forEach(function (button) {
      button.addEventListener("click", function () {
        var card = button.closest(".work-card");
        var category = card ? card.getAttribute("data-category") : "";
        var image = button.querySelector("img");
        openModal({
          kicker: button.getAttribute("data-category-label") || "Work",
          title: button.getAttribute("data-title") || "",
          copy: button.getAttribute("data-detail") || "",
          image: image ? image.getAttribute("src") : "",
          alt: image ? image.getAttribute("alt") : "",
          service: serviceByCategory[category] || "",
          cta: "Start a project"
        });
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    modalClose.addEventListener("click", closeModal);
    var modalDismiss = document.getElementById("modal-dismiss");
    if (modalDismiss) modalDismiss.addEventListener("click", closeModal);
    modalCta.addEventListener("click", function (event) {
      event.preventDefault();
      var service = modalCta.getAttribute("data-service") || "";
      closeModal();
      goToContact(service);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (!modal.hidden) closeModal();
        else closeMenu();
        return;
      }
      if (event.key !== "Tab" || modal.hidden) return;
      var focusable = Array.prototype.filter.call(
        modalPanel.querySelectorAll("button, a[href], input, select, textarea"),
        function (node) { return !node.hidden; }
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* Testimonials */
  var track = document.getElementById("slider-track");
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var prevBtn = document.getElementById("slide-prev");
  var nextBtn = document.getElementById("slide-next");
  var pauseBtn = document.getElementById("slide-pause");
  var dotButtons = Array.prototype.slice.call(document.querySelectorAll(".dots button"));
  var slideIndex = 0;
  var sliderTimer = 0;
  var sliderPaused = storageGet("claro-slider-paused") === "1";

  function renderSlide() {
    if (!track || !slides.length) return;
    var viewport = track.parentElement;
    var width = viewport ? viewport.getBoundingClientRect().width : 0;
    if (!width) return;
    track.style.transform = "translate3d(" + (-slideIndex * width) + "px, 0, 0)";
    slides.forEach(function (slide, index) {
      var active = index === slideIndex;
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    dotButtons.forEach(function (dot, index) {
      dot.setAttribute("aria-selected", index === slideIndex ? "true" : "false");
    });
  }

  function stopSlider() {
    window.clearInterval(sliderTimer);
    sliderTimer = 0;
  }

  function startSlider() {
    stopSlider();
    if (!motionOn() || sliderPaused || slides.length < 2) return;
    sliderTimer = window.setInterval(function () {
      slideIndex = (slideIndex + 1) % slides.length;
      renderSlide();
    }, 6500);
  }

  function moveSlide(step) {
    if (!slides.length) return;
    slideIndex = (slideIndex + step + slides.length) % slides.length;
    renderSlide();
    startSlider();
  }

  function syncPauseButton() {
    if (!pauseBtn) return;
    pauseBtn.setAttribute("aria-pressed", sliderPaused ? "true" : "false");
    pauseBtn.textContent = sliderPaused || !motionOn() ? "Play" : "Pause";
  }

  if (slides.length) {
    renderSlide();
    syncPauseButton();
    startSlider();
    if (prevBtn) prevBtn.addEventListener("click", function () { moveSlide(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { moveSlide(1); });
    dotButtons.forEach(function (dot) {
      dot.addEventListener("click", function () {
        slideIndex = parseInt(dot.getAttribute("data-index"), 10) || 0;
        renderSlide();
        startSlider();
      });
    });
    if (pauseBtn) {
      pauseBtn.addEventListener("click", function () {
        sliderPaused = !sliderPaused;
        storageSet("claro-slider-paused", sliderPaused ? "1" : "0");
        syncPauseButton();
        startSlider();
      });
    }
    var touchX = 0;
    var viewport = document.getElementById("slider-viewport");
    if (viewport) {
      viewport.addEventListener("touchstart", function (event) {
        touchX = event.changedTouches[0].clientX;
      }, { passive: true });
      viewport.addEventListener("touchend", function (event) {
        var delta = event.changedTouches[0].clientX - touchX;
        if (Math.abs(delta) < 40) return;
        moveSlide(delta < 0 ? 1 : -1);
      }, { passive: true });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopSlider();
      else startSlider();
    });
  }

  /* FAQ: keep one item open */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;
    summary.addEventListener("click", function () {
      if (item.open) return;
      document.querySelectorAll(".faq-item").forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* Contact form */
  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");
  var draftNote = document.getElementById("draft-note");
  var draftFields = ["full-name", "email", "phone", "company", "service", "budget", "message"];

  function field(id) {
    return document.getElementById(id);
  }

  function setError(id, message) {
    var input = field(id);
    var error = document.getElementById("err-" + id);
    if (error) error.textContent = message || "";
    if (!input) return;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", "err-" + id);
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function setStatus(type, text) {
    if (!statusEl) return;
    statusEl.className = "form-status" + (type ? " is-" + type : "");
    statusEl.textContent = text || "";
  }

  function readDraft() {
    var raw = storageGet("claro-contact-draft");
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      var used = false;
      draftFields.forEach(function (id) {
        if (data[id] && field(id)) {
          field(id).value = data[id];
          used = true;
        }
      });
      if (used && draftNote) draftNote.hidden = false;
    } catch (err) {
      storageRemove("claro-contact-draft");
    }
  }

  function saveDraft() {
    if (!form) return;
    var data = {};
    var hasValue = false;
    draftFields.forEach(function (id) {
      var value = field(id) ? field(id).value : "";
      data[id] = value;
      if (value.trim()) hasValue = true;
    });
    if (hasValue) storageSet("claro-contact-draft", JSON.stringify(data));
    else storageRemove("claro-contact-draft");
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function digitCount(value) {
    return (value.match(/\d/g) || []).length;
  }

  if (form) {
    readDraft();
    try {
      var presetService = new URLSearchParams(window.location.search).get("service");
      var presetSelect = document.getElementById("service");
      if (presetService && presetSelect) {
        Array.prototype.forEach.call(presetSelect.options, function (option) {
          if (option.value === presetService) presetSelect.value = presetService;
        });
      }
    } catch (err) { /* query string unavailable */ }
    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstInvalid = null;
      var checks = [
        ["full-name", function (value) {
          return value.trim().length >= 2 ? "" : "Enter your full name.";
        }],
        ["email", function (value) {
          return validEmail(value.trim()) ? "" : "Enter a valid email address.";
        }],
        ["phone", function (value) {
          var count = digitCount(value);
          return count >= 7 && count <= 15 ? "" : "Enter a phone number with 7 to 15 digits.";
        }],
        ["service", function (value) {
          return value ? "" : "Choose a service.";
        }],
        ["message", function (value) {
          return value.trim().length >= 10 ? "" : "Add a short note about the project (at least 10 characters).";
        }]
      ];

      checks.forEach(function (check) {
        var id = check[0];
        var input = field(id);
        var message = input ? check[1](input.value) : "This field is missing.";
        setError(id, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      setError("company", "");
      setError("budget", "");

      if (firstInvalid) {
        setStatus("error", "Please fix the highlighted fields.");
        firstInvalid.focus();
        return;
      }

      var endpoint = (form.getAttribute("data-endpoint") || "").trim();
      var submit = form.querySelector("[type='submit']");
      var originalLabel = submit ? submit.textContent : "";

      if (!endpoint) {
        var action = form.getAttribute("action") || "mailto:clarvostudio@gmail.com";
        var emailTo = action.replace(/^mailto:/i, "");
        var serviceLabel = field("service").selectedOptions[0].textContent;
        var body = [
          "Name: " + field("full-name").value.trim(),
          "Email: " + field("email").value.trim(),
          "Phone: " + field("phone").value.trim(),
          "Company: " + (field("company").value.trim() || "Not provided"),
          "Service: " + serviceLabel,
          "Budget: " + (field("budget").value || "Not provided"),
          "",
          field("message").value.trim()
        ].join("\n");
        var mailto = "mailto:" + emailTo +
          "?subject=" + encodeURIComponent("Project enquiry — " + serviceLabel) +
          "&body=" + encodeURIComponent(body);
        window.location.href = mailto;
        setStatus("info", "Your email app should open with this message. Send it to reach Claro Studio. If nothing opens, use the email address beside the form.");
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending...";
      }
      setStatus("info", "Sending your message...");

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        form.reset();
        storageRemove("claro-contact-draft");
        if (draftNote) draftNote.hidden = true;
        setStatus("success", "Your message was sent. We will use the details in this form to reply.");
      }).catch(function () {
        var fallbackEmail = (form.getAttribute("action") || "mailto:clarvostudio@gmail.com").replace(/^mailto:/i, "");
        setStatus("error", "The message could not be sent. Nothing was delivered. Email " + fallbackEmail + " or try again.");
      }).then(function () {
        if (submit) {
          submit.disabled = false;
          submit.textContent = originalLabel;
        }
      });
    });
  }

  /* Motion preference */
  var motionToggle = document.getElementById("motion-toggle");

  function syncMotionToggle() {
    if (!motionToggle) return;
    var reduced = !motionOn();
    motionToggle.setAttribute("aria-pressed", reduced ? "true" : "false");
    motionToggle.textContent = reduced ? "Play motion" : "Reduce motion";
  }

  if (motionToggle) {
    syncMotionToggle();
    motionToggle.addEventListener("click", function () {
      var root = document.documentElement;
      if (motionOn()) {
        root.classList.add("motion-off");
        root.classList.remove("motion-on");
        storageSet("claro-motion", "reduce");
      } else {
        root.classList.remove("motion-off");
        root.classList.add("motion-on");
        storageSet("claro-motion", "allow");
      }
      revealItems.forEach(function (item) { item.classList.add("is-in"); });
      syncMotionToggle();
      syncPauseButton();
      startSlider();
    });
  }

  /* Back to top and header state */
  var backTop = document.getElementById("back-to-top");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-stuck", y > 12);
    if (backTop) {
      var show = y > 500;
      backTop.classList.toggle("is-visible", show);
      backTop.tabIndex = show ? 0 : -1;
    }
    spyNav();
  }

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: motionOn() ? "smooth" : "auto" });
    });
  }

  var servicePage = document.getElementById("service-root");
  if (servicePage) {
    function retitleService() {
      var id = (location.hash || "").replace(/^#/, "");
      var current = id ? document.getElementById(id) : null;
      if (!current || !current.classList.contains("service-detail")) current = null;
      var heading = current ? current.querySelector("h1") : null;
      document.title = heading ? heading.textContent + " | Claro Studio" : "Services | Claro Studio";
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        try { heading.focus({ preventScroll: true }); }
        catch (err) { heading.focus(); }
      }
    }
    window.addEventListener("hashchange", retitleService);
    window.addEventListener("load", retitleService);
    retitleService();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    if (window.innerWidth > MENU_BREAKPOINT) closeMenu();
    else setMenuInert();
    if (typeof renderSlide === "function") renderSlide();
  });
  setMenuInert();
  onScroll();
})();
