// Comportamento do site Kinnor Live. Os textos e links vêm do config.js;
// as páginas já saem prontas do ATUALIZAR-SITE.bat, e este arquivo só acrescenta interação.
import { KINNOR, linkDownload } from "./config.js";
import { pixCode } from "./pix.js";
import { opcoesDoacao } from "./doacao.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Caminhos relativos à raiz do site (este arquivo fica em assets/js/).
const local = (path) => new URL(path, new URL("../../", import.meta.url)).href;
const setText = (sel, value) => $$(sel).forEach((el) => (el.textContent = value));
const safeStorage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* sem armazenamento */ } },
};

/* ---------- Dados da versão ---------- */
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })
  .format(new Date(`${KINNOR.dataVersao}T12:00:00Z`));
setText("[data-year]", new Date().getFullYear());
setText("[data-version]", KINNOR.versao);
setText("[data-date]", date);
setText("[data-win-size]", mb(KINNOR.windows.tamanhoBytes));
setText("[data-apk-size]", mb(KINNOR.android.tamanhoBytes));
setText("[data-win-requirements]", KINNOR.windows.requisitos);
setText("[data-apk-requirements]", KINNOR.android.requisitos);

/* ---------- Downloads ---------- */
const winUrl = local(linkDownload(KINNOR.windows.arquivo));
const apkUrl = local(linkDownload(KINNOR.android.apk));
$$("[data-win-download]").forEach((a) => { a.href = winUrl; });
$$("[data-apk-download]").forEach((a) => { a.href = apkUrl; });
if (KINNOR.ios && KINNOR.ios.ipa) {
  const ipaUrl = local(linkDownload(KINNOR.ios.ipa));
  $$("[data-ipa-download]").forEach((a) => { a.href = ipaUrl; });
}

const toast = $("[data-download-toast]");
let toastTimer;
function showDownloadToast() {
  if (!toast) return;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 9000);
}
if (toast) {
  $("[data-toast-close]", toast).addEventListener("click", () => {
    toast.hidden = true;
    clearTimeout(toastTimer);
  });
}
function downloadStarted(kind) {
  const panel = $("[data-download-started]");
  if (panel && kind === "windows") {
    panel.hidden = false;
    panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  } else if (kind === "windows") showDownloadToast();
  track("file_download", { file_name: kind === "windows" ? KINNOR.windows.arquivo : KINNOR.android.apk, versao: KINNOR.versao });
}
$$("[data-win-download]").forEach((a) => a.addEventListener("click", () => downloadStarted("windows")));
$$("[data-apk-download]").forEach((a) => a.addEventListener("click", () => downloadStarted("android")));

/* ---------- Menu no celular ---------- */
const menuButton = $("[data-menu-button]");
const nav = $("[data-nav]");
if (menuButton && nav) {
  const close = () => {
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !menuButton.contains(e.target)) close();
  });
}
// Marca no menu a página atual.
const here = location.pathname.replace(/\/index(\.html)?$/, "/").replace(/\.html$/, "").split("/").pop();
$$("[data-nav] a").forEach((a) => {
  const target = new URL(a.href).pathname.replace(/\.html$/, "").split("/").pop();
  if (here && target === here) a.setAttribute("aria-current", "page");
});

/* ---------- Lojas (Google Play e App Store) ---------- */
const dialog = $("[data-store-dialog]");
let lastFocus;
function openStore(store) {
  if (!dialog) return;
  lastFocus = document.activeElement;
  $("[data-dialog-title]", dialog).textContent = `Chegando à ${store === "android" ? "Google Play" : "App Store"}`;
  $("[data-dialog-text]", dialog).textContent = store === "android"
    ? "O app está em fase final de publicação na Google Play. Enquanto isso, instale direto por aqui ou pelo QR Code do programa no computador."
    : "O app para iPhone está em fase final de publicação na App Store. Enquanto isso, o programa para Windows já funciona com celulares Android.";
  $("[data-dialog-apk]", dialog).hidden = store !== "android";
  dialog.showModal();
}
$$("[data-store]").forEach((el) => {
  const store = el.dataset.store;
  const url = store === "android" ? KINNOR.android.playStore : KINNOR.ios.appStore;
  if (url) {
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener";
  } else {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openStore(store);
    });
  }
});
if (dialog) {
  $$("[data-dialog-close]", dialog).forEach((b) => b.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("close", () => lastFocus?.focus());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
}

/* ---------- Botão principal conforme o aparelho do visitante ---------- */
const ua = navigator.userAgent;
const platform = /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) ? "ios" : "windows";
$$("[data-platform-card]").forEach((el) => el.classList.toggle("recommended", el.dataset.platformCard === platform));
$$("[data-smart-download]").forEach((a) => {
  const label = $("[data-smart-label]", a);
  if (platform === "windows") {
    a.href = winUrl;
    a.addEventListener("click", () => downloadStarted("windows"));
    return;
  }
  if (label) label.textContent = platform === "android" ? "Baixar o app para Android" : "Baixar o app para iPhone";
  const url = platform === "android" ? KINNOR.android.playStore : KINNOR.ios.appStore;
  if (url) {
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
  } else {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openStore(platform);
    });
  }
});

/* ---------- Canais de contato ---------- */
const contactEntries = [
  ["E-mail", KINNOR.contato.email, (v) => `mailto:${v}`],
  ["WhatsApp", KINNOR.contato.whatsapp, (v) => `https://wa.me/${v.replace(/\D/g, "")}`],
  ["Instagram", KINNOR.contato.instagram, (v) => v],
  ["YouTube", KINNOR.contato.youtube, (v) => v],
].filter(([, value]) => value);
$$("[data-contact]").forEach((contact) => {
  if (!contactEntries.length) return; // mantém o texto neutro que já vem na página
  contact.replaceChildren();
  contactEntries.forEach(([label, value, href]) => {
    const a = document.createElement("a");
    a.href = href(value);
    a.textContent = label === "E-mail" ? value : label;
    if (!a.href.startsWith("mailto:")) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    contact.append(a);
  });
});

/* ---------- Doação ---------- */
const donate = $("[data-donation]");
if (donate) {
  const { pix, linkCartao } = KINNOR.doacao;
  const { pixDisponivel, cartaoDisponivel, paginaDisponivel, valoresDisponiveis } = opcoesDoacao(KINNOR.doacao);
  $("[data-donation-fallback]", donate).hidden = valoresDisponiveis || paginaDisponivel;
  const pageLink = $("[data-donation-page]", donate);
  if (pageLink && paginaDisponivel) {
    pageLink.href = KINNOR.doacao.pagina;
    pageLink.hidden = false;
    if (!valoresDisponiveis) $("[data-donation-intro]", donate).textContent = "Pix ou cartão, com qualquer valor, em página segura do Mercado Pago.";
    pageLink.addEventListener("click", () => track("begin_checkout", { metodo: "pagina_doacao" }));
  }
  $("[data-amounts]", donate).hidden = !valoresDisponiveis;
  if (valoresDisponiveis) $("[data-donation-intro]", donate).textContent = "Escolha um valor e a forma de ofertar.";
  $("[data-pix-area]", donate).hidden = !pixDisponivel;
  const cardLink = $("[data-card-link]", donate);
  cardLink.hidden = !cartaoDisponivel;
  if (cartaoDisponivel) {
    cardLink.href = linkCartao;
    cardLink.target = "_blank";
    cardLink.rel = "noopener";
  }
  if (pixDisponivel) {
    const amount = $("[data-amount-other]", donate);
    const code = $("[data-pix-code]", donate);
    const render = () => {
      const chosen = $('[name="amount"]:checked', donate)?.value;
      const value = chosen === "other" ? Number(amount.value) : Number(chosen);
      code.value = pixCode({ key: pix.chave, name: pix.nome, city: pix.cidade, amount: Number.isFinite(value) ? Math.max(0, value) : 0 });
      amount.hidden = chosen !== "other";
    };
    $$('[name="amount"]', donate).forEach((r) => r.addEventListener("change", render));
    amount.addEventListener("input", render);
    render();
    $("[data-pix-copy]", donate).addEventListener("click", async (e) => {
      const button = e.currentTarget;
      try {
        await navigator.clipboard.writeText(code.value);
        button.textContent = "Copiado!";
        setTimeout(() => (button.textContent = "Copiar Pix"), 1800);
      } catch {
        code.select();
      }
    });
    const qrPath = local("assets/img/pix-qr.svg");
    fetch(qrPath, { method: "HEAD" })
      .then((r) => {
        if (!r.ok) return;
        const qr = $("[data-pix-qr]", donate);
        qr.src = qrPath;
        qr.hidden = false;
      })
      .catch(() => {});
  }
}

/* ---------- Celular de demonstração (modos do app) ---------- */
const modeCopy = {
  camera: "Foto e vídeo com o microfone do celular.",
  mesa: "Vídeo no celular com o som limpo da mesa.",
  webcam: "O celular funciona como webcam do computador.",
};
$$("[data-phone-tabs]").forEach((group) => {
  const phone = group.closest("[data-phone-demo]");
  const tabs = $$("[data-mode]", group);
  const description = $("[data-mode-description]", phone.parentElement);
  // A lista de modos ao lado do celular (na seção do app) comanda o mesmo visor.
  const section = phone.closest("section");
  const listItems = section ? $$("[data-mode-select]", section) : [];
  let rotation;
  function choose(tab) {
    tabs.forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      if (!phone.classList.contains("phone-small")) t.tabIndex = t === tab ? 0 : -1;
    });
    phone.dataset.modeActive = tab.dataset.mode;
    if (description) description.textContent = modeCopy[tab.dataset.mode];
    listItems.forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.modeSelect === tab.dataset.mode)));
  }
  function chooseByVisitor(tab) {
    clearInterval(rotation);
    choose(tab);
  }
  listItems.forEach((item) =>
    item.addEventListener("click", () => chooseByVisitor(tabs.find((t) => t.dataset.mode === item.dataset.modeSelect))));
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => chooseByVisitor(tab));
    tab.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      chooseByVisitor(tabs[next]);
    });
  });
  if (!reduceMotion && !phone.hasAttribute("data-phone-fixed")) {
    rotation = setInterval(() => {
      if (document.hidden) return;
      const current = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
      choose(tabs[(current + 1) % tabs.length]);
    }, 4000);
  }
});

/* ---------- Galeria de telas ---------- */
const gallery = $("[data-gallery]");
if (gallery) {
  const items = [
    ["home", "Início", "Tudo o que importa para o culto, em uma visão."],
    ["audio", "Áudio", "Cada fonte com seu volume, medidor e controle."],
    ["cameras", "Câmeras", "Os celulares da equipe viram webcams do computador."],
    ["live", "Transmissão", "Prepare as cenas e leve o culto ao vivo."],
    ["devices", "Dispositivos", "Acompanhe e controle cada celular da equipe."],
    ["network", "Rede", "Conecte a equipe pelo QR Code."],
  ];
  const tabs = $$("[data-gallery-tab]", gallery);
  const img = $("[data-gallery-image]", gallery);
  const show = (index) => {
    const [file, title, caption] = items[index];
    tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === index));
      t.tabIndex = i === index ? 0 : -1;
    });
    img.srcset = `assets/img/${file}-800.webp 800w, assets/img/${file}-1200.webp 1200w, assets/img/${file}-1672.webp 1672w`;
    img.src = `assets/img/${file}-1200.webp`;
    img.alt = `Tela ${title} do programa Kinnor Live`;
    $("[data-gallery-caption]", gallery).textContent = caption;
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => show(i));
    tab.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      show(next);
    });
  });
}

/* ---------- Estatísticas (Google Analytics só com consentimento — LGPD) ---------- */
const gaId = (KINNOR.google && KINNOR.google.analytics) || "";
const banner = $("[data-cookie-banner]");
let gaLoaded = false;
function track(event, params = {}) {
  if (gaLoaded && typeof window.gtag === "function") window.gtag("event", event, params);
}
function loadAnalytics() {
  if (gaLoaded || !/^G-[A-Z0-9]+$/.test(gaId)) return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.append(s);
}
if (gaId) {
  const choice = safeStorage.get("kinnor-cookies");
  if (choice === "aceito") loadAnalytics();
  else if (!choice && banner) banner.hidden = false;
  $$("[data-cookie-settings]").forEach((b) => {
    b.hidden = false;
    b.addEventListener("click", () => { if (banner) banner.hidden = false; });
  });
  $$("[data-cookie-choice]").forEach((b) => b.addEventListener("click", () => {
    safeStorage.set("kinnor-cookies", b.dataset.cookieChoice);
    banner.hidden = true;
    if (b.dataset.cookieChoice === "aceito") loadAnalytics();
    else if (gaLoaded) location.reload(); // desliga o que já estava carregado
  }));
}

/* ---------- Animação de entrada das seções ---------- */
if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => observer.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("visible"));
}

document.documentElement.classList.add("js-ready");
