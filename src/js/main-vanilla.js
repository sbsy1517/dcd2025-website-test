// main-vanilla.js - 原生JavaScript版本（無jQuery依賴）

// --- 工具函數 ---
const $ = (selector, context = document) => {
  if (typeof selector === 'string') {
    return context.querySelector(selector);
  }
  return selector; // 如果已經是元素，直接返回
};

const $$ = (selector, context = document) => {
  return Array.from(context.querySelectorAll(selector));
};

const createElement = (tag, attrs = {}, children = []) => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
};

const ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

const animate = (element, properties, duration = 800, easing = 'ease-in-out') => {
  return new Promise(resolve => {
    const startTime = performance.now();
    const startValues = {};
    
    // 獲取初始值
    Object.keys(properties).forEach(prop => {
      if (prop === 'scrollTop') {
        startValues[prop] = window.pageYOffset || document.documentElement.scrollTop;
      } else {
        const computed = getComputedStyle(element);
        startValues[prop] = parseFloat(computed[prop]) || 0;
      }
    });
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 簡單的緩動函數
      const easedProgress = easing === 'ease-in-out' 
        ? progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2
        : progress;
      
      // 應用動畫
      Object.entries(properties).forEach(([prop, endValue]) => {
        const startValue = startValues[prop];
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        
        if (prop === 'scrollTop') {
          window.scrollTo(0, currentValue);
        } else {
          element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px');
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

// --- 事件處理器 ---
const on = (element, events, handler, options = {}) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  if (!element) return;
  
  events.split(' ').forEach(event => {
    element.addEventListener(event, handler, options);
  });
};

const off = (element, events, handler) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  if (!element) return;
  
  events.split(' ').forEach(event => {
    element.removeEventListener(event, handler);
  });
};

const delegate = (parent, selector, events, handler) => {
  on(parent, events, (e) => {
    if (e.target.matches(selector) || e.target.closest(selector)) {
      handler(e);
    }
  });
};

// --- 快取系統 ---
const Cache = {
  elements: new Map(),
  timers: new Map(),
  
  getElement(selector) {
    if (!this.elements.has(selector)) {
      this.elements.set(selector, $(selector));
    }
    return this.elements.get(selector);
  },
  
  setTimer(name, callback, delay) {
    this.clearTimer(name);
    this.timers.set(name, setTimeout(callback, delay));
  },
  
  setInterval(name, callback, delay) {
    this.clearTimer(name);
    this.timers.set(name, setInterval(callback, delay));
  },
  
  clearTimer(name) {
    if (this.timers.has(name)) {
      clearTimeout(this.timers.get(name));
      clearInterval(this.timers.get(name));
      this.timers.delete(name);
    }
  },
  
  clearAll() {
    this.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();
    this.elements.clear();
  }
};

// --- 跑馬燈管理器 ---
const MarqueeManager = {
  tracks: [],
  originalContent: {},
  
  init() {
    this.tracks = $$('.marquee .track');
    if (this.tracks.length === 0) return;
    
    this.tracks.forEach((track, index) => {
      this.originalContent[index] = track.innerHTML;
    });
    
    this.start();
    this.bindEvents();
  },
  
  start() {
    this.tracks.forEach((track, index) => {
      track.style.animation = 'none';
      track.innerHTML = this.originalContent[index] + this.originalContent[index];
      track.offsetHeight; // 強制重排
      track.style.animation = null;
    });
    
    // 5分鐘重置一次（降低頻率）
    Cache.setInterval('marquee-reset', () => this.start(), 300000);
  },
  
  bindEvents() {
    on(document, 'visibilitychange', () => {
      if (!document.hidden) {
        this.start();
      }
    }, { passive: true });
  }
};

// --- 彈窗管理器 ---
const ModalManager = {
  activeModal: null,
  scrollPosition: 0,
  
  open(modalSelector) {
    this.closeAll();
    
    const modal = $(modalSelector);
    if (!modal) return;
    
    // 保存滾動位置
    this.scrollPosition = window.pageYOffset;
    
    // 鎖定背景滾動
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollPosition}px`;
    body.style.width = '100%';
    body.classList.add('modal-open');
    
    // 顯示彈窗
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    this.activeModal = modal;
    
    // 聚焦關閉按鈕
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) closeBtn.focus();
  },
  
  close(modal = null) {
    if (!modal) modal = this.activeModal;
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // 恢復滾動
    const body = document.body;
    body.classList.remove('modal-open');
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    
    window.scrollTo(0, this.scrollPosition);
    
    // 延遲重新啟動滾動監聽
    Cache.setTimer('menu-scroll-init', () => MenuManager.initScroll(), 50);
    
    this.activeModal = null;
  },
  
  closeAll() {
    const modals = ['.video-popup', '.wallpaper-popup', '.terms-popup', '.image-popup'];
    modals.forEach(selector => {
      const modal = $(selector);
      if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
};

// --- 選單管理器 ---
const MenuManager = {
  menu: null,
  menuFix: null,
  marqueeHeight: 0,
  ticking: false,
  
  init() {
    this.menu = $('.menu');
    this.menuFix = $('.menu_fix');
    
    if (!this.menu || !this.menuFix) return;
    
    this.calculateHeights();
    this.setupStyles();
    this.initScroll();
    this.bindEvents();
  },
  
  calculateHeights() {
    const marquee = $('.marquee');
    if (marquee) {
      this.marqueeHeight = marquee.offsetHeight;
    } else {
      const width = window.innerWidth;
      this.marqueeHeight = width <= 576 ? 40 : width <= 1024 ? 50 : 60;
    }
  },
  
  setupStyles() {
    const hideTransform = `translateY(-${this.menuFix.offsetHeight || 70}px)`;
    Object.assign(this.menuFix.style, {
      position: 'fixed',
      top: '0px',
      transform: hideTransform,
      transition: 'transform 0.3s ease-in-out, top 0.3s ease-in-out',
      boxShadow: 'none',
      zIndex: '1000'
    });
  },
  
  initScroll() {
    const handleScroll = () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
    };
    
    on(window, 'scroll', handleScroll, { passive: true });
  },
  
  handleScroll() {
    const menuRect = this.menu.getBoundingClientRect();
    const menuBottom = menuRect.bottom + window.pageYOffset;
    const scrollTop = window.pageYOffset;
    
    if (scrollTop > menuBottom) {
      Object.assign(this.menuFix.style, {
        top: this.marqueeHeight + 'px',
        transform: 'translateY(0)',
        boxShadow: '0 7px 0px rgba(0, 0, 0, 0.1)'
      });
    } else {
      Object.assign(this.menuFix.style, {
        top: '0px',
        transform: `translateY(-${this.menuFix.offsetHeight}px)`,
        boxShadow: 'none'
      });
    }
  },
  
  bindEvents() {
    let resizeTimer;
    on(window, 'resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculateHeights();
        this.handleScroll();
      }, 250);
    }, { passive: true });
  }
};

// --- 事件管理器 ---
const EventManager = {
  init() {
    this.bindGlobalEvents();
    this.bindModalEvents();
    this.bindMobileMenuEvents();
  },
  
  bindGlobalEvents() {
    // ESC鍵處理
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
    
    // 平滑滾動
    delegate(document, 'a[href="#download"], a.download', 'click', (e) => {
      e.preventDefault();
      this.smoothScrollTo('#download', -200);
    });
  },
  
  bindModalEvents() {
    // 影片彈窗
    delegate(document, '#playbtn', 'click', (e) => {
      e.preventDefault();
      ModalManager.open('.video-popup');
    });
    
    // 主題背景彈窗
    delegate(document, '.theme .download .btn', 'click keydown', (e) => {
      if (e.type === 'click' || (e.type === 'keydown' && ['Enter', ' '].includes(e.key))) {
        e.preventDefault();
        ModalManager.open('.wallpaper-popup');
      }
    });
    
    // 統一關閉按鈕
    delegate(document, '.close-btn', 'click', (e) => {
      const modal = e.target.closest('[class*="popup"]');
      if (modal) {
        if (modal.classList.contains('video-popup')) {
          const iframe = modal.querySelector('iframe');
          if (iframe) {
            iframe.src = iframe.src; // 重新載入停止播放
          }
        }
        ModalManager.close(modal);
      }
    });
    
    // 點擊遮罩關閉
    delegate(document, '[class*="popup"]', 'click', (e) => {
      if (e.target === e.currentTarget) {
        ModalManager.close(e.target);
      }
    });
  },
  
  bindMobileMenuEvents() {
    const mobileMenu = $('.mobile-menu');
    const overlay = $('.mobile-menu-overlay');
    
    if (!mobileMenu || !overlay) return;
    
    const openMenu = () => {
      mobileMenu.classList.add('active');
      overlay.classList.add('active');
    };
    
    const closeMenu = () => {
      mobileMenu.classList.remove('active');
      overlay.classList.remove('active');
    };
    
    delegate(document, '.menu_btn', 'click', (e) => {
      e.preventDefault();
      openMenu();
    });
    
    delegate(document, '.mobile-menu .close-btn, .mobile-menu-overlay', 'click', closeMenu);
    delegate(document, '.mobile-menu-item', 'click', closeMenu);
    
    // 大螢幕自動關閉
    let resizeTimer;
    on(window, 'resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 1024 && mobileMenu.classList.contains('active')) {
          closeMenu();
        }
      }, 250);
    }, { passive: true });
  },
  
  handleEscape() {
    const mobileMenu = $('.mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      const overlay = $('.mobile-menu-overlay');
      if (overlay) overlay.classList.remove('active');
      return;
    }
    
    if (ModalManager.activeModal && ModalManager.activeModal.style.display !== 'none') {
      ModalManager.close();
    }
  },
  
  smoothScrollTo(target, offset = 0) {
    const targetEl = $(target);
    if (!targetEl) return;
    
    const targetOffset = targetEl.getBoundingClientRect().top + window.pageYOffset + offset;
    animate(document.documentElement, { scrollTop: targetOffset });
  }
};

// --- 載入管理器 ---
const LoadingManager = {
  init() {
    // 延遲載入非關鍵功能
    if (window.requestIdleCallback) {
      requestIdleCallback(() => this.initNonCritical());
    } else {
      Cache.setTimer('non-critical-init', () => this.initNonCritical(), 100);
    }
  },
  
  initNonCritical() {
    this.initCarousels();
    this.initImagePopup();
  },
  
  initCarousels() {
    $$('.carousel-container').forEach(container => {
      const track = container.querySelector('.carousel-track');
      const slides = container.querySelectorAll('.carousel-slide');
      const dots = container.querySelectorAll('.dot');
      
      if (slides.length <= 1) return;
      
      let currentSlide = 0;
      const slideCount = slides.length;
      
      const updateCarousel = () => {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === currentSlide);
        });
      };
      
      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
      };
      
      dots.forEach((dot, index) => {
        on(dot, 'click', () => {
          currentSlide = index;
          updateCarousel();
        });
      });
      
      let autoPlayInterval = setInterval(nextSlide, 3000);
      
      on(container, 'mouseenter', () => clearInterval(autoPlayInterval));
      on(container, 'mouseleave', () => {
        autoPlayInterval = setInterval(nextSlide, 3000);
      });
      
      updateCarousel();
    });
  },
  
  initImagePopup() {
    delegate(document, '.weartocare .card img', 'click', (e) => {
      e.preventDefault();
      const img = e.target;
      const imgSrc = img.getAttribute('data-large') || img.src;
      const imgAlt = img.alt || '圖片預覽';
      
      const popupImg = $('.image-popup .preview img');
      if (popupImg) {
        popupImg.src = imgSrc;
        popupImg.alt = imgAlt;
      }
      
      ModalManager.open('.image-popup');
    });
  }
};

// --- 滾動動畫 ---
const ScrollAnimationManager = {
  observer: null,
  
  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          this.observer.unobserve(entry.target); // 節省效能
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    $$('.fade, .fade-fast, .fade-slow, .fade_text, .fade_text-fast, .fade_text-slow')
      .forEach(el => {
        if (!el.classList.contains('fade-in')) {
          this.observer.observe(el);
        }
      });
  }
};

// --- 主要初始化 ---
ready(() => {
  MarqueeManager.init();
  MenuManager.init();
  EventManager.init();
  LoadingManager.init();
  ScrollAnimationManager.init();
});

// --- Loading 頁面處理 ---
on(window, 'load', () => {
  Cache.setTimer('loading-hide', () => {
    const loading = $('.loading-screen');
    if (loading) {
      loading.classList.add('slide-up');
      
      Cache.setTimer('loading-remove', () => {
        loading.remove();
        
        // 階段性顯示元素
        Cache.setTimer('fade-fv', () => {
          const fv = $('.fade_fv');
          if (fv) fv.classList.add('fade-in');
        }, 300);
        
        Cache.setTimer('fade-sticker', () => {
          const sticker = $('.fade_sticker');
          if (sticker) sticker.classList.add('fade-in');
        }, 500);
        
      }, 400);
    }
  }, 1000);
});

// --- 清理函數 ---
on(window, 'beforeunload', () => {
  Cache.clearAll();
  if (ScrollAnimationManager.observer) {
    ScrollAnimationManager.observer.disconnect();
  }
});
