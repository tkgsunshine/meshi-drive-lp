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
    // 必須項目の定義
    const requiredFields = [
      { id: 'shop_name', name: '店舗名', type: 'text' },
      { id: 'manager_name', name: '担当者名', type: 'text' },
      { id: 'shop_area', name: '店舗エリア', type: 'text' },
      { name: 'takeout_status', label: '現在のテイクアウト', type: 'radio' },
      { name: 'delivery_status', label: '現在のデリバリー', type: 'radio' },
      { name: 'ubereats_status', label: 'Uber Eats等の利用状況', type: 'radio' },
      { id: 'email', name: '返信先（メアド）', type: 'email' },
      { id: 'phone', name: '返信先（電話番号）', type: 'tel' }
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

      // 送信シミュレーション
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        
        // 完了モーダル表示
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
        
        // フォームリセット
        form.reset();
      }, 900);
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
