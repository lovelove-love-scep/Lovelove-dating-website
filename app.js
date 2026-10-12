/*
 * Lovelove starter.
 * Without Supabase settings, this page runs in DEMO mode only.
 * Never put a Supabase service_role key in browser code.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// STEP: paste your project's Project URL and publishable/anon key here.
// These values are designed for browser use only when Row Level Security is enabled.
const SUPABASE_URL = "https://bezluudflbpxjxzynozp.supabase.co.";
const SUPABASE_ANON_KEY = "sb_publishable_REgN8mFJTLaZSksFaMu-2g_Qmm2m72Z";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = supabaseReady ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const dialog = document.querySelector("#authDialog");
const form = document.querySelector("#authForm");
const title = document.querySelector("#authTitle");
const desc = document.querySelector("#authDescription");
const eyebrow = document.querySelector("#authEyebrow");
const submit = document.querySelector("#authSubmit");
const nameInput = document.querySelector("#displayName");
const nameLabel = document.querySelector("#nameLabel");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const error = document.querySelector("#formError");
const switchPrompt = document.querySelector("#switchPrompt");
const switchButton = document.querySelector("#switchAuth");
const toast = document.querySelector("#toast");
let authMode = "signup";
let toastTimer;

document.querySelector("#year").textContent = new Date().getFullYear();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
}
function openAuth(mode) {
  authMode = mode;
  const signup = mode === "signup";
  eyebrow.textContent = signup ? "Ваш следующий шаг" : "С возвращением";
  title.textContent = signup ? "Создайте свою анкету" : "Войдите в Lovelove";
  desc.textContent = supabaseReady
    ? (signup ? "Зарегистрируйтесь, чтобы начать создавать анкету." : "Войдите в свой аккаунт.")
    : "Это демонстрационный проект. Чтобы настоящая регистрация работала, сначала подключите Supabase по инструкции в README.";
  nameInput.hidden = !signup;
  nameLabel.hidden = !signup;
  nameInput.required = signup;
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
  submit.innerHTML = signup ? "Создать аккаунт <span>↗</span>" : "Войти <span>↗</span>";
  switchPrompt.textContent = signup ? "Уже есть аккаунт?" : "Впервые на Lovelove?";
  switchButton.textContent = signup ? "Войти" : "Создать аккаунт";
  error.hidden = true;
  form.reset();
  dialog.showModal();
}
document.querySelectorAll("#signupTopBtn,#signupHeroBtn,#signupPeopleBtn,#signupBottomBtn").forEach(b => b.addEventListener("click", () => openAuth("signup")));
document.querySelector("#loginBtn").addEventListener("click", () => openAuth("login"));
document.querySelector("#closeDialog").addEventListener("click", () => dialog.close());
switchButton.addEventListener("click", () => openAuth(authMode === "signup" ? "login" : "signup"));
document.querySelector("#privacyLink").addEventListener("click", e => {
  e.preventDefault();
  showToast("Перед публичным запуском добавьте отдельную страницу политики конфиденциальности.");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  error.hidden = true;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = nameInput.value.trim();

  if (password.length < 8) {
    error.textContent = "Пароль должен содержать не менее 8 символов.";
    error.hidden = false;
    return;
  }
  if (!supabaseReady) {
    error.textContent = "Регистрация пока не подключена. Следуйте шагам в README.md: создайте проект Supabase, выполните schema.sql и добавьте URL и ключ в app.js.";
    error.hidden = false;
    return;
  }

  submit.disabled = true;
  submit.textContent = "Подождите…";
  try {
    if (authMode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { display_name: displayName } }
      });
      if (signUpError) throw signUpError;
      showToast(data.session
        ? "Аккаунт создан. Следующий шаг — заполнить анкету."
        : "Проверьте почту и подтвердите регистрацию. Затем войдите.");
      dialog.close();
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      showToast("Вы вошли. Следующий этап — личный кабинет и редактор анкеты.");
      dialog.close();
    }
  } catch (e) {
    error.textContent = e?.message || "Не удалось выполнить действие. Попробуйте ещё раз.";
    error.hidden = false;
  } finally {
    submit.disabled = false;
    submit.innerHTML = authMode === "signup" ? "Создать аккаунт <span>↗</span>" : "Войти <span>↗</span>";
  }
});

// Search is client-side over the demo profiles only.
const searchInput = document.querySelector("#searchInput");
const cityFilter = document.querySelector("#cityFilter");
const cards = [...document.querySelectorAll(".profile-card")];
function filterCards() {
  const q = searchInput.value.trim().toLocaleLowerCase("ru");
  const city = cityFilter.value;
  let visible = 0;
  cards.forEach(card => {
    const text = `${card.dataset.name} ${card.dataset.city} ${card.textContent}`.toLocaleLowerCase("ru");
    const match = text.includes(q) && (!city || card.dataset.city === city);
    card.hidden = !match;
    if (match) visible++;
  });
  document.querySelector("#emptyState").hidden = visible > 0;
}
searchInput.addEventListener("input", filterCards);
cityFilter.addEventListener("change", filterCards);

document.querySelectorAll(".like-btn").forEach(button => button.addEventListener("click", () => {
  button.classList.toggle("liked");
  button.textContent = button.classList.contains("liked") ? "♥" : "♡";
  showToast("Это демонстрационный лайк. Для сохранения лайков нужны аккаунт и база данных.");
}));
