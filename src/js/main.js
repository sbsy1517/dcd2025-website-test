// main.js - 優化版本

// DOM 快取
var domCache = {
  $window: $(window),
  $body: $('body'),
  $videoPopup: null,
  $wallpaperPopup: null,
  $termsPopup: null,
  $imagePopup: null,
  $mobileMenu: null,
  $mobileMenuOverlay: null,
  $menuBtn: null,
  $closeBtn: null,
  
  init: function() {
    this.$videoPopup = $('.video-popup');
    this.$wallpaperPopup = $('.wallpaper-popup');
    this.$termsPopup = $('.terms-popup');
    this.$imagePopup = $('.image-popup');
    this.$mobileMenu = $('.mobile-menu');
    this.$mobileMenuOverlay = $('.mobile-menu-overlay');
    this.$menuBtn = $('.menu_btn');
    this.$closeBtn = $('.mobile-menu .close-btn');
  }
};

// 防抖函數
function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- 跑馬燈 ---
var MarqueeController = {
  tracks: null,
  originalContent: {},
  resetInterval: null,
  isInitialized: false,
  
  init: function() {
    if (this.isInitialized) return;
    
    this.tracks = document.querySelectorAll('.marquee .track');
    if (this.tracks.length === 0) return;
    
    // 儲存每個track的原始內容
    this.tracks.forEach(function(track, index) {
      MarqueeController.originalContent[index] = track.innerHTML;
    });
    
    this.isInitialized = true;
  },
  
  start: function() {
    if (!this.isInitialized) this.init();
    if (this.tracks.length === 0) return;
    
    // 清理舊的定時器
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
    
    // 初始化跑馬燈
    this.resetAnimation();
    
    // 每30秒重新初始化一次（防止任何累積問題）
    this.resetInterval = setInterval(function() {
      MarqueeController.resetAnimation();
    }, 30000);
  },
  
  resetAnimation: function() {
    var self = this;
    this.tracks.forEach(function(track, index) {
      // 停止當前動畫
      track.style.animation = 'none';
      
      // 重置到原始內容
      track.innerHTML = self.originalContent[index];
      
      // 添加一次複製以確保無縫循環
      track.innerHTML += self.originalContent[index];

      // 強制重排並重新啟動動畫
      track.offsetHeight;
      track.style.animation = null;
    });
  },
  
  stop: function() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
  }
};

// 初始化跑馬燈（但不啟動）
document.addEventListener('DOMContentLoaded', function() {
  MarqueeController.init();
});

// 監聽頁面可見性變化
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && MarqueeController.isInitialized) {
    MarqueeController.start();
  }
});

// --- 共用：開/關彈窗 ---
function openModal($modal) {
  // 關掉其它 - 使用快取的選擇器
  domCache.$videoPopup.filter(':visible').hide().attr('aria-hidden', 'true');
  domCache.$wallpaperPopup.filter(':visible').hide().attr('aria-hidden', 'true');
  domCache.$termsPopup.filter(':visible').hide().attr('aria-hidden', 'true');
  domCache.$imagePopup.filter(':visible').hide().attr('aria-hidden', 'true');

  // 保存當前滾動位置
  var scrollTop = domCache.$window.scrollTop();
  domCache.$body.data('scroll-position', scrollTop);

  // 添加 modal-open class 到 body，鎖定背景滾動
  domCache.$body.addClass('modal-open').css('top', -scrollTop + 'px');

  // 暫時禁用滾動事件監聽器
  domCache.$window.off('scroll.menuFix');

  $modal.css('display', 'flex').attr('aria-hidden', 'false');

  // 聚焦關閉鈕
  var $close = $modal.find('.close-btn').first();
  if ($close.length) $close.trigger('focus');
}

function closeModal($modal) {
  $modal.css('display', 'none').attr('aria-hidden', 'true');
  
  // 恢復滾動位置
  var scrollTop = domCache.$body.data('scroll-position') || 0;
  
  // 移除 modal-open class，恢復滾動
  domCache.$body.removeClass('modal-open').css('top', '');
  
  // 恢復到原本的滾動位置
  domCache.$window.scrollTop(scrollTop);

  // 重新啟用滾動事件監聽器
  setTimeout(function() {
    initMenuFixScroll();
  }, 50);
}

// --- YouTube 影片彈窗 ---
$(function() {
  // 初始化 DOM 快取
  domCache.init();
  
  var $videoPopup = domCache.$videoPopup;

  $('#playbtn').on('click', function(e) {
    e.preventDefault();
    openModal($videoPopup);
  });

  $('.video-popup .close-btn').on('click', function() {
    var $iframe = $videoPopup.find('iframe');
    $iframe.attr('src', $iframe.attr('src')); // 停止播放
    closeModal($videoPopup);
  });

  $videoPopup.on('click', function(e) {
    if (e.target === this) {
      var $iframe = $videoPopup.find('iframe');
      $iframe.attr('src', $iframe.attr('src'));
      closeModal($videoPopup);
    }
  });
});

// --- 主題背景彈窗（RWD 同款） ---
$(function() {
  var $popup = $('.theme .wallpaper-popup');
  var $openBtn = $('.theme .download .btn');

  $openBtn.on('click keydown', function(e) {
    if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
      e.preventDefault();
      $(document).data('lastTrigger', this);
      
      // 特別處理：將 wallpaper-popup 臨時移到 body 層級以避免 .theme 的堆疊上下文問題
      if ($popup.parent().hasClass('theme')) {
        $popup.data('original-parent', $popup.parent());
        $popup.appendTo('body');
      }
      
      openModal($popup);
    }
  });

  $('.theme .wallpaper-popup .close-btn').on('click', function() {
    closeModal($popup);
    
    // 將 popup 移回原來的位置
    var $originalParent = $popup.data('original-parent');
    if ($originalParent && $originalParent.length) {
      $popup.appendTo($originalParent);
    }
    
    var last = $(document).data('lastTrigger');
    if (last) $(last).focus();
  });

  $popup.on('click', function(e) {
    if (e.target === this) {
      closeModal($popup);
      
      // 將 popup 移回原來的位置
      var $originalParent = $popup.data('original-parent');
      if ($originalParent && $originalParent.length) {
        $popup.appendTo($originalParent);
      }
      
      var last = $(document).data('lastTrigger');
      if (last) $(last).focus();
    }
  });

  // ESC 關閉
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') {
      var $video = $('.video-popup');
      if ($video.is(':visible')) {
        var $iframe = $video.find('iframe');
        $iframe.attr('src', $iframe.attr('src'));
        closeModal($video);
        return;
      }
      if ($popup.is(':visible')) {
        closeModal($popup);
        
        // 將 popup 移回原來的位置
        var $originalParent = $popup.data('original-parent');
        if ($originalParent && $originalParent.length) {
          $popup.appendTo($originalParent);
        }
        
        var last = $(document).data('lastTrigger');
        if (last) $(last).focus();
      }
    }
  });
});
// --- 細則與條款彈窗（支援 data-popup / class） ---
$(function() {
  var $terms = $('.terms-popup');

  // 開啟
  $(document).on('click keydown', 'a[data-popup="terms"], .open-terms, .terms-btn', function(e) {
    if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
      e.preventDefault();
      $(document).data('lastTrigger', this);
      openModal($terms);
    }
  });

  // 關閉（X）
  $(document).on('click', '.terms-popup .close-btn', function() {
    closeModal($terms);
    var last = $(document).data('lastTrigger');
    if (last) $(last).focus();
  });

  // 點遮罩關閉
  $terms.on('click', function(e) {
    if (e.target === this) {
      closeModal($terms);
      var last = $(document).data('lastTrigger');
      if (last) $(last).focus();
    }
  });

  // Esc 關閉（不覆蓋別的 keydown）
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $terms.is(':visible')) {
      closeModal($terms);
      var last = $(document).data('lastTrigger');
      if (last) $(last).focus();
    }
  });
});

// --- 圖片放大彈窗 ---
$(function() {
  var $imagePopup = $('.image-popup');
  
  // 點擊 weartocare 卡片中的圖片（包含輪播中的圖片）
  $(document).on('click', '.weartocare .card img[data-large], .carousel-slide img[data-large]', function(e) {
    e.preventDefault();
    e.stopPropagation(); // 防止事件冒泡到輪播滑動處理
    
    var $img = $(this);
    var imgSrc = $img.attr('data-large') || $img.attr('src'); // 優先使用高畫質圖片
    var imgAlt = $img.attr('alt') || '圖片預覽';
    
    // 設置彈窗中的圖片
    $imagePopup.find('.preview img').attr('src', imgSrc).attr('alt', imgAlt);
    
    // 保存觸發元素
    $(document).data('lastTrigger', this);
    
    // 開啟彈窗
    openModal($imagePopup);
  });
  
  // 關閉按鈕
  $('.image-popup .close-btn').on('click', function() {
    closeModal($imagePopup);
    var last = $(document).data('lastTrigger');
    if (last) $(last).focus();
  });
  
  // 點擊遮罩關閉
  $imagePopup.on('click', function(e) {
    if (e.target === this) {
      closeModal($imagePopup);
      var last = $(document).data('lastTrigger');
      if (last) $(last).focus();
    }
  });
  
  // ESC 鍵關閉
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $imagePopup.is(':visible')) {
      closeModal($imagePopup);
      var last = $(document).data('lastTrigger');
      if (last) $(last).focus();
    }
  });
});

// --- 固定選單滑入效果 ---
// 獲取跑馬燈的高度並計算選單應該出現的位置
function getMarqueeHeight() {
  var $marquee = $('.marquee');
  if ($marquee.length) {
    return $marquee.outerHeight();
  }
  // 如果找不到跑馬燈，使用預設值
  if (window.innerWidth <= 576) {
    return 40;
  } else if (window.innerWidth <= 1024) {
    return 50;
  } else {
    return 60;
  }
}

// 獲取選單應該顯示的位置（在跑馬燈下方）
function getMenuFixPosition() {
  return getMarqueeHeight();
}

// 計算隱藏位置 - 隱藏在螢幕頂部
function getHideTransform() {
  var $menuFix = $('.menu_fix');
  var menuFixHeight = $menuFix.outerHeight() || 70;
  return 'translateY(-' + menuFixHeight + 'px)';
}

function initMenuFixScroll() {
  // 重新綁定滾動監聽器 - 使用防抖優化
  domCache.$window.on('scroll.menuFix', debounce(function() {
    var $menu = $('.menu');
    var $menuFix = $('.menu_fix');
    
    if ($menu.length && $menuFix.length) {
      var menuBottom = $menu.offset().top + $menu.outerHeight();
      var scrollTop = domCache.$window.scrollTop();
      var marqueeHeight = getMarqueeHeight();
      
      if (scrollTop > menuBottom) {
        // 超過 .menu 時滑入到跑馬燈下方
        $menuFix.css({
          'top': marqueeHeight + 'px',
          'transform': 'translateY(0)',
          'box-shadow': '0 7px 0px rgba(0, 0, 0, 0.1)'
        });
      } else {
        // 還能看到 .menu 時隱藏
        $menuFix.css({
          'top': '0px',
          'transform': getHideTransform(),
          'box-shadow': 'none'
        });
      }
    }
  }, 16)); // 約 60fps
}

$(function() {
  var $menu = $('.menu');
  var $menuFix = $('.menu_fix');
  var $marquee = $('.marquee');
  
  if ($menu.length && $menuFix.length) {
    // 初始設置固定選單樣式 - 隱藏狀態
    $menuFix.css({
      'top': '0px',
      'transform': getHideTransform(),
      'transition': 'transform 0.3s ease-in-out, top 0.3s ease-in-out',
      'box-shadow': 'none'
    });
    
    // 初始化滾動監聽器
    initMenuFixScroll();
    
    // 監聽視窗大小變化，重新計算位置 - 使用防抖優化
    domCache.$window.on('resize', debounce(function() {
      var scrollTop = domCache.$window.scrollTop();
      var menuBottom = $menu.offset().top + $menu.outerHeight();
      
      if (scrollTop > menuBottom) {
        // 如果當前是顯示狀態，更新到新的正確位置
        var marqueeHeight = getMarqueeHeight();
        $menuFix.css({
          'top': marqueeHeight + 'px',
          'transform': 'translateY(0)'
        });
      } else {
        // 如果當前是隱藏狀態，更新隱藏位置
        $menuFix.css({
          'top': '0px',
          'transform': getHideTransform()
        });
      }
    }, 250)); // 防抖延遲 250ms
  }
});

// --- 手機版選單功能 ---
$(function() {
  var $menuBtn = domCache.$menuBtn;
  var $mobileMenu = domCache.$mobileMenu;
  var $mobileMenuOverlay = domCache.$mobileMenuOverlay;
  var $closeBtn = domCache.$closeBtn;
  
  // 開啟選單
  function openMobileMenu() {
    $mobileMenu.addClass('active');
    $mobileMenuOverlay.addClass('active');
    // 不鎖定滾動，讓用戶可以繼續滾動背景頁面
  }
  
  // 關閉選單
  function closeMobileMenu() {
    $mobileMenu.removeClass('active');
    $mobileMenuOverlay.removeClass('active');
    // 不需要恢復滾動設定
  }
  
  // 點擊漢堡選單按鈕
  $menuBtn.on('click', function(e) {
    e.preventDefault();
    openMobileMenu();
  });
  
  // 點擊關閉按鈕
  $closeBtn.on('click', function(e) {
    e.preventDefault();
    closeMobileMenu();
  });
  
  // 點擊遮罩關閉
  $mobileMenuOverlay.on('click', function(e) {
    if (e.target === this) {
      closeMobileMenu();
    }
  });
  
  // 點擊選單項目後關閉選單
  $('.mobile-menu-item').on('click', function() {
    closeMobileMenu();
  });
  
  // ESC 鍵關閉選單
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $mobileMenu.hasClass('active')) {
      closeMobileMenu();
    }
  });
  
  // 監聽視窗大小變化，在大螢幕時自動關閉手機版選單
  domCache.$window.on('resize', debounce(function() {
    if (window.innerWidth > 1024 && $mobileMenu.hasClass('active')) {
      closeMobileMenu();
    }
  }, 250));
});

// --- Loading Page 功能 ---
$(document).ready(function() {
  // 頁面開始載入時立即鎖定滾動並回到頂部
  $('body').addClass('loading-lock');
  window.scrollTo(0, 0);
});

domCache.$window.on('load', function() {
  // 頁面完全載入後，向上滑動 loading screen
  setTimeout(function() {
    $('.loading-screen').addClass('slide-up');
    
    // 動畫完成後移除元素
    setTimeout(function() {
      $('.loading-screen').remove();
      
      // 解除滾動鎖定
      $('body').removeClass('loading-lock');
      
      // Loading 結束後立即啟動跑馬燈
      if (typeof MarqueeController !== 'undefined') {
        MarqueeController.start();
      }
      
      // Loading 結束後延遲 0.3 秒觸發 fade_fv 元素
      setTimeout(function() {
        $('.fade_fv').addClass('fade-in');
      }, 300); // 延遲 0.3 秒
      
      // Loading 結束後延遲 0.5 秒觸發 fade_sticker 元素
      setTimeout(function() {
        $('.fade_sticker').addClass('fade-in');
      }, 500); // 延遲 0.5 秒
      
    }, 400); // 等待滑動動畫完成
  }, 1000); // 顯示 loading 1 秒鐘
});

// --- 平滑滾動到下載區功能 ---
$(function() {
  // 為所有下載區連結添加平滑滾動
  $('a[href="#download"], a.download').on('click', function(e) {
    e.preventDefault();
    
    var target = $('#download');
    if (target.length) {
      var targetOffset = target.offset().top - 200; // 減去 200px
      
      $('html, body').animate({
        scrollTop: targetOffset
      }, 800, 'easeInOutQuart'); // 800ms 的平滑動畫
    }
  });
  
  // 自定義緩動函數
  $.easing.easeInOutQuart = function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
  };
});

// --- 優化的無限循環輪播功能 (支援觸控滑動) ---
$(function() {
  $('.carousel-container').each(function() {
    var $container = $(this);
    var $track = $container.find('.carousel-track');
    var $originalSlides = $container.find('.carousel-slide');
    var $dots = $container.find('.dot');
    var originalSlideCount = $originalSlides.length;
    var currentSlide = 1; // 從1開始，因為前面有複製的最後一張
    var isTransitioning = false;
    
    // 觸控滑動變數
    var touchData = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      isVerticalScroll: false,
      startTime: 0,
      moved: false
    };
    var autoPlayInterval;
    
    // 如果只有一張圖片，不需要輪播功能
    if (originalSlideCount <= 1) return;
    
    // 創建無限循環的幻燈片結構
    function setupInfiniteSlides() {
      // 複製最後一張到最前面
      var $lastSlide = $originalSlides.last().clone();
      $track.prepend($lastSlide);
      
      // 複製第一張到最後面
      var $firstSlide = $originalSlides.first().clone();
      $track.append($firstSlide);
      
      // 設置初始位置（顯示真正的第一張）
      $track.css({
        'transform': 'translateX(-100%)',
        'transition': 'none'
      });
    }
    
    // 更新輪播位置
    function updateCarousel(instant) {
      var translateX = -currentSlide * 100;
      
      if (instant) {
        $track.css({
          'transform': 'translateX(' + translateX + '%)',
          'transition': 'none'
        });
      } else {
        $track.css({
          'transform': 'translateX(' + translateX + '%)',
          'transition': 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
        });
      }
      
      // 更新圓點狀態
      var dotIndex = ((currentSlide - 1) % originalSlideCount + originalSlideCount) % originalSlideCount;
      $dots.removeClass('active');
      $dots.eq(dotIndex).addClass('active');
    }
    
    // 檢查並處理無限循環邊界
    function checkInfiniteLoop() {
      if (isTransitioning) return;
      
      if (currentSlide >= originalSlideCount + 1) {
        // 滑到複製的第一張，瞬間跳回真正的第一張
        isTransitioning = true;
        setTimeout(function() {
          currentSlide = 1;
          updateCarousel(true);
          isTransitioning = false;
        }, 300);
      } else if (currentSlide <= 0) {
        // 滑到複製的最後一張，瞬間跳回真正的最後一張
        isTransitioning = true;
        setTimeout(function() {
          currentSlide = originalSlideCount;
          updateCarousel(true);
          isTransitioning = false;
        }, 300);
      }
    }
    
    // 下一張
    function nextSlide() {
      if (isTransitioning) return;
      currentSlide++;
      updateCarousel();
      checkInfiniteLoop();
    }
    
    // 前一張
    function prevSlide() {
      if (isTransitioning) return;
      currentSlide--;
      updateCarousel();
      checkInfiniteLoop();
    }
    
    // 跳到指定張
    function goToSlide(index) {
      if (isTransitioning) return;
      currentSlide = index + 1; // +1 因為前面有複製的幻燈片
      updateCarousel();
    }
    
    // 觸控開始
    function handleTouchStart(e) {
      if (isTransitioning) return;

      var touch = e.touches ? e.touches[0] : e;
      touchData.startX = touch.clientX;
      touchData.startY = touch.clientY;
      touchData.currentX = touch.clientX;
      touchData.currentY = touch.clientY;
      touchData.isDragging = true;
      touchData.isVerticalScroll = false;
      touchData.startTime = Date.now();
      touchData.moved = false;

      clearInterval(autoPlayInterval);
      $track.css('transition', 'none');
    }

    // 觸控移動
    function handleTouchMove(e) {
      if (!touchData.isDragging || isTransitioning) return;

      var touch = e.touches ? e.touches[0] : e;
      touchData.currentX = touch.clientX;
      touchData.currentY = touch.clientY;
      
      var deltaX = touchData.currentX - touchData.startX;
      var deltaY = touchData.currentY - touchData.startY;
      var absX = Math.abs(deltaX);
      var absY = Math.abs(deltaY);
      
      // 第一次移動時決定滑動方向
      if (!touchData.moved && (absX > 5 || absY > 5)) {
        touchData.moved = true;
        
        // 如果垂直移動大於水平移動，認為是垂直滾動
        if (absY > absX * 1.5) {
          touchData.isVerticalScroll = true;
        }
      }
      
      // 如果是垂直滾動，讓瀏覽器處理
      if (touchData.isVerticalScroll) {
        return;
      }
      
      // 水平滑動處理
      if (touchData.moved) {
        e.preventDefault(); // 阻止垂直滾動
        
        // 計算滑動百分比
        var movePercent = (deltaX / $container.width()) * 100;
        var newTransform = (-currentSlide * 100) + movePercent;
        
        $track.css('transform', 'translateX(' + newTransform + '%)');
      }
    }
    
    // 觸控結束
    function handleTouchEnd(e) {
      if (!touchData.isDragging) return;
      
      touchData.isDragging = false;
      
      // 如果是垂直滾動，直接返回
      if (touchData.isVerticalScroll) {
        updateCarousel();
        startAutoPlay();
        return;
      }
      
      var deltaX = touchData.currentX - touchData.startX;
      var deltaTime = Date.now() - touchData.startTime;
      var velocity = Math.abs(deltaX) / deltaTime; // 像素/毫秒
      
      // 判斷是否需要切換幻燈片
      var threshold = $container.width() * 0.15; // 15% 寬度閾值
      var shouldSwipe = Math.abs(deltaX) > threshold || velocity > 0.3; // 距離閾值或速度閾值
      
      if (shouldSwipe && touchData.moved) {
        if (deltaX > 0) {
          // 向右滑動 - 前一張
          prevSlide();
        } else {
          // 向左滑動 - 下一張
          nextSlide();
        }
      } else {
        // 滑動距離不足，回到原位
        updateCarousel();
      }
      
      // 恢復自動播放
      startAutoPlay();
    }
    
    // 綁定觸控事件 (使用非被動監聽避免預設行為)
    var trackEl = $track[0];
    trackEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    trackEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    trackEl.addEventListener('touchend', handleTouchEnd, { passive: false });
    trackEl.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // 滑鼠事件 (只在桌面環境)
    if (!('ontouchstart' in window)) {
      $track.on('mousedown', function(e) {
        handleTouchStart(e);
      });
      
      $(document).on('mousemove', function(e) {
        if (touchData.isDragging) {
          handleTouchMove(e);
        }
      });
      
      $(document).on('mouseup', function(e) {
        if (touchData.isDragging) {
          handleTouchEnd(e);
        }
      });
    }
    
    // 防止拖拽時的點擊事件（但允許輕觸圖片）
    $track.on('click', function(e) {
      if (touchData.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    // 開始自動播放
    function startAutoPlay() {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(nextSlide, 4000);
    }
    
    // 圓點點擊事件
    $dots.on('click', function() {
      var index = $(this).data('slide');
      goToSlide(index);
      clearInterval(autoPlayInterval);
      startAutoPlay();
    });
    
    // 滑鼠懸停時暫停自動播放
    $container.on('mouseenter', function() {
      clearInterval(autoPlayInterval);
    });
    
    // 滑鼠離開時恢復自動播放
    $container.on('mouseleave', function() {
      if (!touchData.isDragging) {
        startAutoPlay();
      }
    });
    
    // 初始化
    setupInfiniteSlides();
    updateCarousel();
    startAutoPlay();
  });
});

// --- 滾動動畫特效 ---
document.addEventListener('DOMContentLoaded', function() {
  // 創建 Intersection Observer 來監測元素是否進入視窗
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // 當元素進入視窗時，添加 fade-in class
        entry.target.classList.add('fade-in');
      }
    });
  }, {
    // 當元素 20% 進入視窗時觸發
    threshold: 0.2,
    // 提前 50px 開始觸發
    rootMargin: '0px 0px -50px 0px'
  });

  // 監聽所有帶有 .fade class 的元素
  function initFadeAnimation() {
    const fadeElements = document.querySelectorAll('.fade, .fade-fast, .fade-slow, .fade_text, .fade_text-fast, .fade_text-slow');
    fadeElements.forEach(function(element) {
      // 確保元素還沒有 fade-in class（避免重複監聽）
      if (!element.classList.contains('fade-in')) {
        observer.observe(element);
      }
    });
  }

  // 初始化動畫
  initFadeAnimation();

  // 如果需要重新掃描新增的元素，可以調用這個函數
  window.refreshFadeAnimation = function() {
    initFadeAnimation();
  };
});

// --- 跑馬燈保險機制 ---
// 確保跑馬燈在任何情況下都能正常啟動
setTimeout(function() {
  if (typeof MarqueeController !== 'undefined') {
    // 檢查 loading screen 是否還存在
    var loadingScreen = document.querySelector('.loading-screen');
    if (!loadingScreen) {
      // loading screen 已移除，啟動跑馬燈
      MarqueeController.start();
    } else {
      // loading screen 還存在，等待更長時間後再次檢查
      setTimeout(function() {
        MarqueeController.start();
      }, 2000);
    }
  }
}, 3000); // 3秒後檢查

// 針對手機設備的額外保險機制
if (/Mobi|Android/i.test(navigator.userAgent)) {
  window.addEventListener('focus', function() {
    setTimeout(function() {
      if (typeof MarqueeController !== 'undefined' && MarqueeController.isInitialized) {
        MarqueeController.start();
      }
    }, 500);
  });
  
  // 觸摸事件後也重新啟動跑馬燈
  document.addEventListener('touchstart', function() {
    setTimeout(function() {
      if (typeof MarqueeController !== 'undefined' && MarqueeController.isInitialized) {
        var tracks = document.querySelectorAll('.marquee .track');
        var hasAnimation = false;
        tracks.forEach(function(track) {
          if (track.style.animation && track.style.animation !== 'none') {
            hasAnimation = true;
          }
        });
        
        // 如果沒有動畫在運行，重新啟動
        if (!hasAnimation) {
          MarqueeController.start();
        }
      }
    }, 1000);
  }, { once: true }); // 只執行一次
}
