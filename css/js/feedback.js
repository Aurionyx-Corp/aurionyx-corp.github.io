// ===== FEEDBACK SYSTEM =====
// Supports Firebase (if configured) OR localStorage (fallback).

// ===== FIREBASE CONFIG =====
// Вставь сюда свои Firebase-ключи, когда настроишь Firebase:
// https://console.firebase.google.com
const FIREBASE_CONFIG = {
  apiKey: "",              // ← вставь свой
  authDomain: "",          // ← вставь свой
  projectId: "",           // ← вставь свой
  storageBucket: "",       // ← вставь свой
  messagingSenderId: "",   // ← вставь свой
  appId: ""                // ← вставь свой
};

let useFirebase = false;
let db = null;

// ===== INIT FIREBASE (IF CONFIGURED) =====
function initFirebase() {
  // Проверяем, заполнен ли конфиг
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    console.log('[Aurionyx] Firebase не настроен — используем localStorage.');
    return false;
  }
  try {
    // Firebase SDK подключим через CDN в HTML-файлах
    if (typeof firebase === 'undefined') {
      console.warn('[Aurionyx] Firebase SDK не загружен.');
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    useFirebase = true;
    console.log('[Aurionyx] Firebase готов.');
    return true;
  } catch (e) {
    console.error('[Aurionyx] Ошибка Firebase:', e);
    return false;
  }
}

// ===== SUBMIT FEEDBACK =====
async function submitFeedback() {
  const name = (document.getElementById('fbName')?.value || '').trim() || 'Аноним';
  const rating = document.getElementById('fbRating')?.value || '5';
  const text = (document.getElementById('fbText')?.value || '').trim();

  const t = translations[currentLang] || translations.ru;

  if (!text) {
    alert(t.error_feedback || 'Напишите отзыв!');
    return;
  }

  const feedback = {
    name: name,
    rating: parseInt(rating),
    text: text,
    timestamp: Date.now(),
    date: new Date().toLocaleDateString(currentLang)
  };

  const btn = document.getElementById('fbSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    if (useFirebase && db) {
      // Firebase
      await db.collection('feedback').add(feedback);
    } else {
      // localStorage fallback
      const feedbacks = JSON.parse(localStorage.getItem('aurionyx_feedback') || '[]');
      feedbacks.unshift(feedback);
      localStorage.setItem('aurionyx_feedback', JSON.stringify(feedbacks));
    }

    // Clear form
    const fbName = document.getElementById('fbName');
    const fbText = document.getElementById('fbText');
    if (fbName) fbName.value = '';
    if (fbText) fbText.value = '';

    alert(t.thanks_feedback || 'Спасибо за отзыв! 💚');
    renderReviews();
  } catch (e) {
    console.error('[Aurionyx] Ошибка отправки:', e);
    alert('Ошибка отправки. Попробуйте позже.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t.btn_send || 'Отправить'; }
  }
}

// ===== RENDER REVIEWS =====
async function renderReviews() {
  const list = document.getElementById('reviewsList');
  if (!list) return;

  const t = translations[currentLang] || translations.ru;
  list.innerHTML = `<p style="color: var(--text2); text-align:center; padding:20px;">${t.loading || 'Загрузка...'}</p>`;

  try {
    let feedbacks = [];

    if (useFirebase && db) {
      // Firebase — читаем
      const snap = await db.collection('feedback')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      feedbacks = snap.docs.map(d => d.data());
    } else {
      // localStorage
      feedbacks = JSON.parse(localStorage.getItem('aurionyx_feedback') || '[]');
    }

    if (feedbacks.length === 0) {
      list.innerHTML = `<p style="color: var(--text2); text-align:center; padding:20px;">${t.no_reviews || 'Пока нет отзывов. Будьте первым! 💚'}</p>`;
      return;
    }

    list.innerHTML = feedbacks.map(f => `
      <div class="review">
        <div class="review-header">
          <span class="review-name">${escapeHtml(f.name)}</span>
          <span class="review-stars">${'⭐'.repeat(f.rating || 5)}</span>
        </div>
        <div class="review-text">${escapeHtml(f.text)}</div>
        <div class="review-date">${escapeHtml(f.date || '')}</div>
      </div>
    `).join('');

    // Применить переводы к новым элементам
    applyLang();
  } catch (e) {
    console.error('[Aurionyx] Ошибка чтения:', e);
    list.innerHTML = `<p style="color: var(--text2); text-align:center; padding:20px;">Ошибка загрузки отзывов.</p>`;
  }
}

// ===== HELPER =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  renderReviews();
});
