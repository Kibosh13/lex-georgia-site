(function () {
  "use strict";

  var YM_ID = ""; // [заполнить] номер счётчика Яндекс.Метрики
  var ru = document.documentElement.lang !== "en";
  var inEn = /\/en(\/|$)/.test(location.pathname);
  var FORM_ENDPOINT = (inEn ? "../" : "") + "api/send.php";
  var MSG = ru ? {
    invalid: "Пожалуйста, заполните обязательные поля и подтвердите согласие.",
    demo: "Демо-версия: отправка в Telegram и на почту заработает на рабочем хостинге.",
    sending: "Отправляем…",
    ok: "Спасибо. Обращение получено — мы свяжемся с вами.",
    err: "Не удалось отправить. Напишите нам, когда появятся рабочие контакты."
  } : {
    invalid: "Please complete the required fields and accept the privacy policy.",
    demo: "Demo site: Telegram and email delivery will work on production hosting.",
    sending: "Sending…",
    ok: "Thank you. We have received your request and will be in touch.",
    err: "Could not send. Please write to us once working contacts are published."
  };

  var body = document.body;

  if (YM_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(s);
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = 1 * new Date();
    window.ym(YM_ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  function goal(name) {
    if (YM_ID && window.ym) window.ym(YM_ID, "reachGoal", name);
  }

  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (link) {
      link.addEventListener("click", function () { body.classList.remove("menu-open"); });
    });
  }

  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[href]").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === page || (page.indexOf("blog-") === 0 && href === "blog.html")) link.classList.add("active");
  });

  var modal = document.getElementById("callback-modal");

  function openModal(topic) {
    if (!modal) return;
    var topicInput = modal.querySelector("input[name=topic]");
    if (topicInput && topic) topicInput.value = topic;
    modal.classList.add("open");
    body.style.overflow = "hidden";
    goal("open_form");
    var first = modal.querySelector("input:not([type=hidden]):not(.hp)");
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    body.style.overflow = "";
  }

  document.querySelectorAll("[data-callback]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(btn.getAttribute("data-callback"));
    });
  });

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest(".modal-close")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (input) {
      var wrap = input.closest(".field") || input.closest(".consent");
      var valid;
      if (input.type === "checkbox") valid = input.checked;
      else if (input.type === "email") valid = input.value.trim().length > 3 && input.validity.valid;
      else valid = input.value.trim().length > 1;
      if (wrap) wrap.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector("[type=submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) {
        status.className = "form-status err";
        status.textContent = MSG.invalid;
        return;
      }

      goal("lead");

      if (location.hostname.endsWith("github.io") || location.protocol === "file:") {
        status.className = "form-status ok";
        status.textContent = MSG.demo;
        return;
      }

      var data = new FormData(form);
      data.append("page", document.title);
      submit.disabled = true;
      status.className = "form-status";
      status.textContent = MSG.sending;

      fetch(FORM_ENDPOINT, { method: "POST", body: data })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (!json.ok) throw new Error(json.error || "send failed");
          form.reset();
          status.className = "form-status ok";
          status.textContent = MSG.ok;
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = MSG.err;
        })
        .finally(function () { submit.disabled = false; });
    });

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var wrap = input.closest(".field") || input.closest(".consent");
        if (wrap) wrap.classList.remove("invalid");
      });
    });
  });

  var filters = document.querySelectorAll(".filter-btn");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.classList.toggle("active", b === btn); });
      document.querySelectorAll(".post-card[data-cat]").forEach(function (card) {
        card.style.display = cat === "all" || card.getAttribute("data-cat") === cat ? "" : "none";
      });
    });
  });

  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("visible"); });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var banner = document.getElementById("cookie-banner");
  var accept = document.getElementById("cookie-accept");
  if (banner && accept && !localStorage.getItem("itp-cookie")) {
    banner.classList.add("open");
    accept.addEventListener("click", function () {
      localStorage.setItem("itp-cookie", "1");
      banner.classList.remove("open");
    });
  }
})();
