/**
 * Meshi Drive (メシドライブ) Meta広告LP スクリプト
 * フォームバリデーション、UIインタラクション、フローティングCTA制御、Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Meta Pixel 行動計測ヘルパー（個人情報・入力値は送らない。送るのは項目名・位置のみ）
  const sentEvents = {};
  const track = (name, params, onceKey) => {
    if (onceKey) {
      if (sentEvents[onceKey]) return;
      sentEvents[onceKey] = true;
    }
    if (typeof fbq === 'function') fbq('trackCustom', name, params || {});
  };

  // 広告経由の流入情報（UTM / fbclid）をセッション内で保持
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  const getAdSource = () => {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('md_ad_source') || '{}'); } catch (e) { /* 保存不可の環境では無視 */ }
    const query = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(key => {
      const v = query.get(key);
      if (v) saved[key] = v;
    });
    try { sessionStorage.setItem('md_ad_source', JSON.stringify(saved)); } catch (e) { /* 同上 */ }
    return Object.keys(saved).filter(k => k !== 'fbclid').map(k => `${k}=${saved[k]}`).join(' / ');
  };
  const adSource = getAdSource();

  // 1. スムーズスクロール制御
  const scrollButtons = document.querySelectorAll('a[href^="#"]');
  scrollButtons.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // フォームへの誘導の場合、最初の入力欄にフォーカス
        if (targetId === '#contact-form') {
          setTimeout(() => {
            const firstInput = document.getElementById('shop_name');
            if (firstInput) firstInput.focus();
          }, 600);
        }
      }
    });
  });

  // 2. フローティングCTAバーの表示制御
  const floatingCta = document.getElementById('floating-cta');
  const heroSection = document.getElementById('hero');
  const formSection = document.getElementById('contact-form');

  if (floatingCta && heroSection && formSection) {
    const handleScroll = () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const formTop = formSection.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // ヒーローを過ぎて、かつフォームが見える手前まで表示
      if (heroBottom < 0 && formTop > windowHeight - 100) {
        floatingCta.classList.add('visible');
      } else {
        floatingCta.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 3. Scroll Reveal アニメーション (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // 4. フォームバリデーション & 送信処理
  const form = document.getElementById('inquiry-form');
  const modal = document.getElementById('completion-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  if (form) {
    const SSGFORM_ENDPOINT = 'https://ssgform.com/s/PM2GnhncvUNt';

    // 必須項目の定義
    const requiredFields = [
      { id: 'shop_name', name: '店舗名', type: 'text' },
      { id: 'manager_name', name: '担当者名', type: 'text' },
      { id: 'shop_area', name: '店舗エリア', type: 'text' },
      { name: 'takeout_status', label: '現在のテイクアウト', type: 'radio' },
      { name: 'delivery_status', label: '現在のデリバリー', type: 'radio' },
      { name: 'ubereats_status', label: 'Uber Eats等の利用状況', type: 'radio' },
      { id: 'email', name: 'メールアドレス（返信先）', type: 'email' },
      { id: 'phone', name: '電話番号（返信先）', type: 'tel' }
    ];

    // 入力時のリアルタイムエラークリア
    requiredFields.forEach(field => {
      if (field.type === 'radio') {
        const radios = form.querySelectorAll(`input[name="${field.name}"]`);
        radios.forEach(radio => {
          radio.addEventListener('change', () => {
            const errElem = document.getElementById(`err_${field.name}`);
            if (errElem) errElem.classList.remove('visible');
          });
        });
      } else {
        const input = document.getElementById(field.id);
        if (input) {
          input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            const errElem = document.getElementById(`err_${field.id}`);
            if (errElem) errElem.classList.remove('visible');
          });
        }
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;
      let firstErrorElement = null;

      // バリデーション実行
      requiredFields.forEach(field => {
        if (field.type === 'radio') {
          const checked = form.querySelector(`input[name="${field.name}"]:checked`);
          const errElem = document.getElementById(`err_${field.name}`);
          if (!checked) {
            isValid = false;
            if (errElem) {
              errElem.textContent = `${field.label}を選択してください。`;
              errElem.classList.add('visible');
            }
            if (!firstErrorElement) {
              firstErrorElement = form.querySelector(`input[name="${field.name}"]`);
            }
          } else {
            if (errElem) errElem.classList.remove('visible');
          }
        } else {
          const input = document.getElementById(field.id);
          const errElem = document.getElementById(`err_${field.id}`);
          if (!input) return;

          const val = input.value.trim();

          if (!val) {
            isValid = false;
            input.classList.add('is-invalid');
            if (errElem) {
              errElem.textContent = `${field.name}を入力してください。`;
              errElem.classList.add('visible');
            }
            if (!firstErrorElement) firstErrorElement = input;
          } else if (field.type === 'email') {
            // メールアドレス正規表現チェック
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
              isValid = false;
              input.classList.add('is-invalid');
              if (errElem) {
                errElem.textContent = '有効なメールアドレスを入力してください。';
                errElem.classList.add('visible');
              }
              if (!firstErrorElement) firstErrorElement = input;
            }
          } else if (field.type === 'tel') {
            // 電話番号形式チェック（10〜11桁の数字）
            const telClean = val.replace(/[-ー\s]/g, '');
            if (!/^\d{10,11}$/.test(telClean)) {
              isValid = false;
              input.classList.add('is-invalid');
              if (errElem) {
                errElem.textContent = '正しい電話番号（10〜11桁の半角数字）を入力してください。';
                errElem.classList.add('visible');
              }
              if (!firstErrorElement) firstErrorElement = input;
            }
          }
        }
      });

      track('FormSubmitAttempt');

      if (!isValid) {
        const errorFields = Array.from(form.querySelectorAll('.form-error-msg.visible'))
          .map(el => el.id.replace(/^err_/, ''))
          .join(',');
        track('FormValidationError', { fields: errorFields });
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (firstErrorElement.focus) firstErrorElement.focus();
        }
        return;
      }

      // 送信中ステート表示
      const submitBtn = form.querySelector('.submit-btn');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';

      // SSGformへ送信（通知メール・自動返信はSSGform側の設定）
      const labels = {
        shop_name: '店舗名',
        manager_name: '担当者名',
        business_type: '業態',
        shop_area: '店舗エリア',
        monthly_sales: '月商（万円）',
        takeout_status: '現在のテイクアウト',
        delivery_status: '現在のデリバリー',
        ubereats_status: 'Uber Eats等の利用状況',
        business_hours: '営業時間',
        email: 'email',
        phone: '電話番号',
        notes: 'ご相談内容・備考'
      };
      const formData = new FormData();
      Object.keys(labels).forEach(name => {
        const el = form.elements[name];
        if (!el) return;
        const value = (el.value !== undefined ? el.value : '').trim();
        const checked = el.length ? form.querySelector(`input[name="${name}"]:checked`) : null;
        formData.append(labels[name], checked ? checked.value : value);
      });

      if (adSource) formData.append('流入元（広告）', adSource);

      fetch(SSGFORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        // 送信成功時、SSGformは完了ページへリダイレクトする。追うと406になるため追わず、リダイレクトを成功とみなす
        redirect: 'manual'
      })
        .then(res => {
          if (!res.ok && res.type !== 'opaqueredirect') throw new Error('HTTP ' + res.status);
          // Meta広告の計測（申し込み完了）
          if (typeof fbq === 'function') fbq('track', 'Lead');
          // 完了モーダル表示
          if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
          form.reset();
        })
        .catch(() => {
          track('FormSubmitError');
          alert('送信できませんでした。お手数ですが、時間をおいてもう一度お試しください。');
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
    });
  }

  // 5. ユーザー行動の計測（Meta Pixel カスタムイベント）
  // スクロール深度
  const scrollMarks = [25, 50, 75, 100];
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrolled = (window.scrollY + window.innerHeight) / doc.scrollHeight * 100;
    scrollMarks.forEach(mark => {
      if (scrolled >= mark - 1) track('ScrollDepth', { percent: mark }, `scroll_${mark}`);
    });
  }, { passive: true });

  // セクション閲覧（id があれば id、なければ出現順）
  const trackedSections = document.querySelectorAll('section');
  if (trackedSections.length > 0 && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const name = el.id || `section_${Array.from(trackedSections).indexOf(el) + 1}`;
        track('SectionView', { section: name }, `section_${name}`);
        if (el.id === 'contact-form' && typeof fbq === 'function' && !sentEvents.vc) {
          sentEvents.vc = true;
          fbq('track', 'ViewContent', { content_name: 'contact-form' });
        }
        sectionObserver.unobserve(el);
      });
    }, { threshold: 0.15 });
    trackedSections.forEach(el => sectionObserver.observe(el));
  }

  // CTAクリック（どの位置のボタンが押されたか）
  const inlineCtas = Array.from(document.querySelectorAll('.btn-super-cta'));
  document.querySelectorAll('a[href="#contact-form"]').forEach(link => {
    link.addEventListener('click', () => {
      let location = 'other';
      if (link.classList.contains('header-cta-btn')) location = 'header';
      else if (link.classList.contains('floating-cta-btn')) location = 'floating';
      else if (link.classList.contains('btn-super-cta')) location = `inline_${inlineCtas.indexOf(link) + 1}`;
      track('CTAClick', { location });
    });
  });

  // 滞在時間（表示中のタブのみ）
  [30, 60].forEach(sec => {
    setTimeout(() => {
      if (document.visibilityState === 'visible') track('TimeOnPage', { seconds: sec }, `time_${sec}`);
    }, sec * 1000);
  });

  // フォーム: 入力開始・項目ごとの入力完了（値は送らない）
  if (form) {
    form.addEventListener('focusin', e => {
      const name = e.target.id || e.target.name;
      if (name) track('FormStart', { field: name }, 'form_start');
    });
    form.addEventListener('focusout', e => {
      const el = e.target;
      const name = el.id || el.name;
      if (name && el.type !== 'radio' && typeof el.value === 'string' && el.value.trim()) {
        track('FormFieldComplete', { field: name }, `field_${name}`);
      }
    });
    form.addEventListener('change', e => {
      if (e.target.type === 'radio') track('FormFieldComplete', { field: e.target.name }, `field_${e.target.name}`);
    });
  }

  // モーダルクローズ
  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});
