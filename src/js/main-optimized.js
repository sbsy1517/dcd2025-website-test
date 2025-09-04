// main-optimized.js - 優化版本

// --- 全域變數快取 ---
const CACHE = {
  elements: new Map(),
  timers: new Map()
};

// DOM元素快取系統
function getElement(selector) {
  if (!CACHE.elements.has(selector)) {
    CACHE.elements.set(selector, $(selector));
  }
  return CACHE.elements.get(selector);
}

// 統一定時器管理
function setTimer(name, callback, delay) {
  clearTimer(name);
  CACHE.timers.set(name, setTimeout(callback, delay));
}

function setInterval(name, callback, delay) {
  clearTimer(name);
  CACHE.timers.set(name, window.setInterval(callback, delay));
}

function clearTimer(name) {
  if (CACHE.timers.has(name)) {
    clearTimeout(CACHE.timers.get(name));
    clearInterval(CACHE.timers.get(name));
    CACHE.timers.delete(name);
  }
}

// --- 優化的跑馬燈 ---
const MarqueeManager = {
  tracks: null,
  originalContent: {},
  
  init() {
    this.tracks = getElement('.marquee .track');
    if (this.tracks.length === 0) return;
    
    // 只儲存一次原始內容
    this.tracks.each((index, track) => {
      this.originalContent[index] = track.innerHTML;
    });
    
    this.start();
    this.bindEvents();
  },
  
  start() {
    this.tracks.each((index, track) => {
      const $track = $(track);
      
      // 使用CSS動畫控制，避免JS重複操作
      $track[0].style.animation = 'none';
      $track[0].innerHTML = this.originalContent[index] + this.originalContent[index];
      $track[0].offsetHeight; // 觸發重排
      $track[0].style.animation = null;
    });
    
    // 減少重置頻率：從30秒改為5分鐘
    setInterval('marquee-reset', () => this.start(), 300000);
  },
  
  bindEvents() {
    // 頁面可見性變化時才重新初始化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.start();
      }
    }, { passive: true });
  }
};

// --- 統一彈窗管理器 ---
const ModalManager = {
  activeModal: null,
  scrollPosition: 0,
  
  open(modalSelector) {
    this.closeAll();
    
    const $modal = getElement(modalSelector);
    if ($modal.length === 0) return;
    
    // 保存滾動位置
    this.scrollPosition = $(window).scrollTop();
    
    // 鎖定背景滾動
    const $body = getElement('body');
    $body.data('scroll-position', this.scrollPosition)
         .addClass('modal-open')
         .css('top', -this.scrollPosition + 'px');
    
    // 禁用滾動監聽
    $(window).off('scroll.menuFix');
    
    // 顯示彈窗
    $modal.css('display', 'flex').attr('aria-hidden', 'false');
    this.activeModal = $modal;
    
    // 聚焦關閉按鈕
    const $closeBtn = $modal.find('.close-btn').first();
    if ($closeBtn.length) $closeBtn.focus();
  },
  
  close(modalSelector) {
    const $modal = modalSelector ? getElement(modalSelector) : this.activeModal;
    if (!$modal || $modal.length === 0) return;
    
    $modal.css('display', 'none').attr('aria-hidden', 'true');
    
    // 恢復滾動
    const $body = getElement('body');
    const scrollTop = $body.data('scroll-position') || 0;
    
    $body.removeClass('modal-open').css('top', '');
    $(window).scrollTop(scrollTop);
    
    // 延遲重新啟動滾動監聽
    setTimer('menu-scroll-init', () => MenuManager.initScroll(), 50);
    
    this.activeModal = null;
  },
  
  closeAll() {
    const modals = ['.video-popup', '.wallpaper-popup', '.terms-popup', '.image-popup'];
    modals.forEach(selector => {
      const $modal = getElement(selector);
      if ($modal.is(':visible')) {
        $modal.hide().attr('aria-hidden', 'true');
      }
    });
  }
};

// --- 優化的選單管理器 ---
const MenuManager = {
  $menu: null,
  $menuFix: null,
  marqueeHeight: 0,
  
  init() {
    this.$menu = getElement('.menu');
    this.$menuFix = getElement('.menu_fix');
    
    if (this.$menu.length === 0 || this.$menuFix.length === 0) return;
    
    this.calculateHeights();
    this.setupStyles();
    this.initScroll();
    this.bindEvents();
  },
  
  calculateHeights() {
    const $marquee = getElement('.marquee');
    if ($marquee.length) {
      this.marqueeHeight = $marquee.outerHeight();
    } else {
      // 響應式預設值
      const width = window.innerWidth;
      this.marqueeHeight = width <= 576 ? 40 : width <= 1024 ? 50 : 60;
    }
  },
  
  setupStyles() {
    const hideTransform = `translateY(-${this.$menuFix.outerHeight() || 70}px)`;
    this.$menuFix.css({
      'top': '0px',
      'transform': hideTransform,
      'transition': 'transform 0.3s ease-in-out, top 0.3s ease-in-out',
      'box-shadow': 'none'
    });
  },
  
  initScroll() {
    $(window).off('scroll.menuFix');
    
    // 使用 requestAnimationFrame 優化滾動效能
    let ticking = false;
    
    $(window).on('scroll.menuFix', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  },
  
  handleScroll() {
    const menuBottom = this.$menu.offset().top + this.$menu.outerHeight();
    const scrollTop = $(window).scrollTop();
    
    if (scrollTop > menuBottom) {
      this.$menuFix.css({
        'top': this.marqueeHeight + 'px',
        'transform': 'translateY(0)',
        'box-shadow': '0 7px 0px rgba(0, 0, 0, 0.1)'
      });
    } else {
      this.$menuFix.css({
        'top': '0px',
        'transform': `translateY(-${this.$menuFix.outerHeight()}px)`,
        'box-shadow': 'none'
      });
    }
  },
  
  bindEvents() {
    $(window).on('resize', debounce(() => {
      this.calculateHeights();
      this.handleScroll();
    }, 250));
  }
};

// --- 防抖函數 ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- 事件委託系統 ---
const EventManager = {
  init() {
    this.bindGlobalEvents();
    this.bindModalEvents();
    this.bindMobileMenuEvents();
  },
  
  bindGlobalEvents() {
    // 統一ESC鍵處理
    $(document).on('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
    
    // 平滑滾動到下載區
    $(document).on('click', 'a[href="#download"], a.download', (e) => {
      e.preventDefault();
      this.smoothScrollTo('#download', -200);
    });
  },
  
  bindModalEvents() {
    // 影片彈窗
    $(document).on('click', '#playbtn', (e) => {
      e.preventDefault();
      ModalManager.open('.video-popup');
    });
    
    // 主題背景彈窗
    $(document).on('click keydown', '.theme .download .btn', (e) => {
      if (e.type === 'click' || (e.type === 'keydown' && ['Enter', ' '].includes(e.key))) {
        e.preventDefault();
        ModalManager.open('.wallpaper-popup');
      }
    });
    
    // 統一關閉按鈕處理
    $(document).on('click', '.close-btn', (e) => {
      const $modal = $(e.target).closest('[class*="popup"]');
      if ($modal.length) {
        if ($modal.hasClass('video-popup')) {
          // 停止影片播放
          const $iframe = $modal.find('iframe');
          $iframe.attr('src', $iframe.attr('src'));
        }
        ModalManager.close($modal);
      }
    });
    
    // 點擊遮罩關閉
    $(document).on('click', '[class*="popup"]', (e) => {
      if (e.target === e.currentTarget) {
        ModalManager.close($(e.target));
      }
    });
  },
  
  bindMobileMenuEvents() {
    const $mobileMenu = getElement('.mobile-menu');
    const $overlay = getElement('.mobile-menu-overlay');
    
    // 開啟選單
    $(document).on('click', '.menu_btn', (e) => {
      e.preventDefault();
      $mobileMenu.addClass('active');
      $overlay.addClass('active');
    });
    
    // 關閉選單
    const closeMobileMenu = () => {
      $mobileMenu.removeClass('active');
      $overlay.removeClass('active');
    };
    
    $(document).on('click', '.mobile-menu .close-btn, .mobile-menu-overlay', closeMobileMenu);
    $(document).on('click', '.mobile-menu-item', closeMobileMenu);
    
    // 大螢幕自動關閉
    $(window).on('resize', debounce(() => {
      if (window.innerWidth > 1024 && $mobileMenu.hasClass('active')) {
        closeMobileMenu();
      }
    }, 250));
  },
  
  handleEscape() {
    // 優先處理手機選單
    const $mobileMenu = getElement('.mobile-menu');
    if ($mobileMenu.hasClass('active')) {
      $mobileMenu.removeClass('active');
      getElement('.mobile-menu-overlay').removeClass('active');
      return;
    }
    
    // 處理彈窗
    if (ModalManager.activeModal && ModalManager.activeModal.is(':visible')) {
      ModalManager.close();
    }
  },
  
  smoothScrollTo(target, offset = 0) {
    const $target = getElement(target);
    if ($target.length === 0) return;
    
    const targetOffset = $target.offset().top + offset;
    $('html, body').animate({
      scrollTop: targetOffset
    }, 800, 'easeInOutQuart');
  }
};

// --- 載入優化 ---
const LoadingManager = {
  init() {
    // 使用 requestIdleCallback 延遲非關鍵初始化
    if (window.requestIdleCallback) {
      requestIdleCallback(() => this.initNonCritical());
    } else {
      setTimer('non-critical-init', () => this.initNonCritical(), 100);
    }
  },
  
  initNonCritical() {
    // 輪播功能（非首屏）
    this.initCarousels();
    
    // 圖片放大彈窗
    this.initImagePopup();
  },
  
  initCarousels() {
    getElement('.carousel-container').each(function() {
      const $container = $(this);
      const $track = $container.find('.carousel-track');
      const $slides = $container.find('.carousel-slide');
      const $dots = $container.find('.dot');
      
      if ($slides.length <= 1) return;
      
      let currentSlide = 0;
      const slideCount = $slides.length;
      
      const updateCarousel = () => {
        $track.css('transform', `translateX(-${currentSlide * 100}%)`);
        $dots.removeClass('active').eq(currentSlide).addClass('active');
      };
      
      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
      };
      
      $dots.on('click', function() {
        currentSlide = $(this).data('slide');
        updateCarousel();
      });
      
      // 自動播放
      let autoPlayInterval = setInterval(() => nextSlide(), 3000);
      
      $container.on('mouseenter', () => clearInterval(autoPlayInterval))
               .on('mouseleave', () => {
                 autoPlayInterval = setInterval(() => nextSlide(), 3000);
               });
      
      updateCarousel();
    });
  },
  
  initImagePopup() {
    $(document).on('click', '.weartocare .card img', function(e) {
      e.preventDefault();
      const $img = $(this);
      const imgSrc = $img.attr('data-large') || $img.attr('src');
      const imgAlt = $img.attr('alt') || '圖片預覽';
      
      getElement('.image-popup .preview img')
        .attr('src', imgSrc)
        .attr('alt', imgAlt);
      
      ModalManager.open('.image-popup');
    });
  }
};

// --- 主要初始化 ---
$(document).ready(() => {
  // 立即初始化關鍵功能
  MarqueeManager.init();
  MenuManager.init();
  EventManager.init();
  
  // 延遲初始化非關鍵功能
  LoadingManager.init();
});

// --- Loading 頁面處理 ---
$(window).on('load', () => {
  setTimer('loading-hide', () => {
    const $loading = getElement('.loading-screen');
    $loading.addClass('slide-up');
    
    setTimer('loading-remove', () => {
      $loading.remove();
      
      // 階段性顯示元素
      setTimer('fade-fv', () => getElement('.fade_fv').addClass('fade-in'), 300);
      setTimer('fade-sticker', () => getElement('.fade_sticker').addClass('fade-in'), 500);
      
    }, 400);
  }, 1000);
});

// --- 滾動動畫特效（已優化） ---
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        // 停止觀察已經顯示的元素，節省效能
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });

  // 只監聽需要的元素
  document.querySelectorAll('.fade, .fade-fast, .fade-slow, .fade_text, .fade_text-fast, .fade_text-slow')
    .forEach(el => {
      if (!el.classList.contains('fade-in')) {
        observer.observe(el);
      }
    });
});

// --- 自定義緩動函數 ---
$.easing.easeInOutQuart = function (x, t, b, c, d) {
  if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
  return -c/2 * ((t-=2)*t*t*t - 2) + b;
};

// --- 清理函數（頁面卸載時） ---
window.addEventListener('beforeunload', () => {
  // 清理所有定時器
  CACHE.timers.forEach((timer, name) => {
    clearTimeout(timer);
    clearInterval(timer);
  });
  CACHE.timers.clear();
});
