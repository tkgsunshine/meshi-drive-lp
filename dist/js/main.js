/**
 * Meshi Drive (メシドライブ) Meta広告LP スクリプト
 * フォームバリデーション、UIインタラクション、フローティングCTA制御、Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {
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

      if (!isValid) {
        track('Form_ValidationError');
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
          alert('送信できませんでした。お手数ですが、時間をおいてもう一度お試しください。');
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
    });
  }

  // 5. 離脱分析用の計測（Meta Pixel カスタムイベント。入力内容は送らず、段階の名前だけ送る）
  const track = (name, params) => {
    if (typeof fbq === 'function') fbq('trackCustom', name, params || {});
  };
  const sent = {};
  const once = (name, params) => {
    if (sent[name]) return;
    sent[name] = true;
    track(name, params);
  };

  // 5-1. スクロール到達率（25/50/75/100%）
  const depthMarks = [25, 50, 75, 100];
  const onDepthScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    depthMarks.forEach(m => { if (pct >= m) once('Scroll' + m); });
  };
  window.addEventListener('scroll', onDepthScroll, { passive: true });

  // 5-2. セクション到達（どこまで読まれたか）
  const sectionMap = [
    { sel: '#hero', name: 'View_Hero' },
    { sel: '.solutions-grid', name: 'View_Solution' },
    { sel: '.tax-timing-section', name: 'View_WhyNow' },
    { sel: '.brand-showcase-grid', name: 'View_ProvenBrand' },
    { sel: '#contact-form', name: 'View_Form' }
  ];
  if ('IntersectionObserver' in window) {
    const secObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          once(entry.target.getAttribute('data-track'));
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    sectionMap.forEach(({ sel, name }) => {
      const el = document.querySelector(sel);
      if (el) { el.setAttribute('data-track', name); secObserver.observe(el); }
    });
  }

  // 5-3. 滞在時間（10秒・30秒・60秒）
  [10, 30, 60].forEach(sec => setTimeout(() => once('Stay' + sec + 's'), sec * 1000));

  // 5-4. CTAボタンのクリック
  document.querySelectorAll('a[href="#contact-form"]').forEach(a => {
    a.addEventListener('click', () => track('Click_CTA', {
      place: a.closest('header') ? 'header' : a.closest('#hero') ? 'hero' : a.closest('#floating-cta') ? 'floating' : 'section'
    }));
  });

  // 5-5. フォームの入力進捗（どの項目で止まるか）
  if (form) {
    form.addEventListener('focusin', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      once('Form_Start');
      once('Form_Focus_' + t.name);
    });
    form.addEventListener('submit', () => track('Form_SubmitAttempt'));
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
