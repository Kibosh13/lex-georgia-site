(function () {
  "use strict";

  // Адрес обработчика форм. На хостинге с PHP — api/send.php.
  var FORM_ENDPOINT = "api/send.php";

  var body = document.body;

  /* ---------- Mobile menu ---------- */
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

  /* ---------- Active nav item ---------- */
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[href]").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === page || (page.indexOf("blog-") === 0 && href === "blog.html")) link.classList.add("active");
  });

  /* ---------- Modal ---------- */
  var modal = document.getElementById("callback-modal");

  function openModal(topic) {
    if (!modal) return;
    var topicInput = modal.querySelector("input[name=topic]");
    if (topicInput && topic) topicInput.value = topic;
    modal.classList.add("open");
    body.style.overflow = "hidden";
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

  /* ---------- Forms ---------- */
  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (input) {
      var wrap = input.closest(".field") || input.closest(".consent");
      var valid = input.type === "checkbox" ? input.checked : input.value.trim().length > 1;
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
        status.textContent = "Пожалуйста, заполните обязательные поля и подтвердите согласие.";
        return;
      }

      if (location.hostname.endsWith("github.io")) {
        status.className = "form-status ok";
        status.textContent = "Демо-версия сайта: отправка заявок в Telegram и на почту заработает на рабочем хостинге.";
        return;
      }

      var data = new FormData(form);
      data.append("page", document.title);
      submit.disabled = true;
      status.className = "form-status";
      status.textContent = "Отправляем…";

      fetch(FORM_ENDPOINT, { method: "POST", body: data })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (!json.ok) throw new Error(json.error || "send failed");
          form.reset();
          status.className = "form-status ok";
          status.textContent = "Спасибо. Обращение получено — мы свяжемся с вами удобным для вас способом.";
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Не удалось отправить. Напишите нам в Telegram или на почту — контакты внизу страницы.";
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

  /* ---------- Blog filter ---------- */
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

  /* ---------- Reveal on scroll ---------- */
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
})();
