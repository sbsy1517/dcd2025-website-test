// main.js

// --- 跑馬燈 ---
document.addEventListener('DOMContentLoaded', function() {
  var tracks = document.querySelectorAll('.marquee .track');
  var originalContent = {}; // 儲存原始內容
  var resetInterval;
  
  // 儲存每個track的原始內容
  tracks.forEach(function(track, index) {
    originalContent[index] = track.innerHTML;
  });
  
  function initMarquee() {
    tracks.forEach(function(track, index) {
      // 停止當前動畫
      track.style.animation = 'none';
      
      // 重置到原始內容
      track.innerHTML = originalContent[index];
      
      // 添加一次複製以確保無縫循環
      track.innerHTML += originalContent[index];

      // 強制重排並重新啟動動畫
      track.offsetHeight;
      track.style.animation = null;
    });
  }
  
  function startMarquee() {
    // 清理舊的定時器
    if (resetInterval) {
      clearInterval(resetInterval);
    }
    
    // 初始化跑馬燈
    initMarquee();
    
    // 每30秒重新初始化一次（防止任何累積問題）
    resetInterval = setInterval(function() {
      initMarquee();
    }, 30000); // 30秒重置一次
  }
  
  // 啟動跑馬燈
  startMarquee();
  
  // 監聽頁面可見性變化，當頁面重新可見時重新初始化
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      startMarquee();
    }
  });
});

// --- 共用：開/關彈窗 ---
function openModal($modal) {
  // 關掉其它
  $('.video-popup:visible, .wallpaper-popup:visible, .terms-popup:visible, .image-popup:visible').hide().attr('aria-hidden', 'true');

  // 保存當前滾動位置
  var scrollTop = $(window).scrollTop();
  $('body').data('scroll-position', scrollTop);

  // 添加 modal-open class 到 body，鎖定背景滾動
  $('body').addClass('modal-open').css('top', -scrollTop + 'px');

  // 暫時禁用滾動事件監聽器
  $(window).off('scroll.menuFix');

  $modal.css('display', 'flex').attr('aria-hidden', 'false');

  // 聚焦關閉鈕
  var $close = $modal.find('.close-btn').first();
  if ($close.length) $close.trigger('focus');
}

function closeModal($modal) {
  $modal.css('display', 'none').attr('aria-hidden', 'true');
  
  // 恢復滾動位置
  var scrollTop = $('body').data('scroll-position') || 0;
  
  // 移除 modal-open class，恢復滾動
  $('body').removeClass('modal-open').css('top', '');
  
  // 恢復到原本的滾動位置
  $(window).scrollTop(scrollTop);

  // 重新啟用滾動事件監聽器
  setTimeout(function() {
    initMenuFixScroll();
  }, 50);
}

// --- YouTube 影片彈窗 ---
$(function() {
  var $videoPopup = $('.video-popup');

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
  
  // 點擊 weartocare 卡片中的圖片
  $('.weartocare .card img').on('click', function(e) {
    e.preventDefault();
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
  // 移除現有的滾動監聽器
  $(window).off('scroll.menuFix');
  
  // 重新綁定滾動監聽器
  $(window).on('scroll.menuFix', function() {
    var $menu = $('.menu');
    var $menuFix = $('.menu_fix');
    
    if ($menu.length && $menuFix.length) {
      var menuBottom = $menu.offset().top + $menu.outerHeight();
      var scrollTop = $(window).scrollTop();
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
  });
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
    
    // 監聽視窗大小變化，重新計算位置
    $(window).on('resize', function() {
      var scrollTop = $(window).scrollTop();
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
    });
  }
});

// --- 手機版選單功能 ---
$(function() {
  var $menuBtn = $('.menu_btn');
  var $mobileMenu = $('.mobile-menu');
  var $mobileMenuOverlay = $('.mobile-menu-overlay');
  var $closeBtn = $('.mobile-menu .close-btn');
  
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
  $(window).on('resize', function() {
    if (window.innerWidth > 1024 && $mobileMenu.hasClass('active')) {
      closeMobileMenu();
    }
  });
});

// --- Loading Page 功能 ---
$(window).on('load', function() {
  // 頁面完全載入後，向上滑動 loading screen
  setTimeout(function() {
    $('.loading-screen').addClass('slide-up');
    
    // 動畫完成後移除元素
    setTimeout(function() {
      $('.loading-screen').remove();
      
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

// --- 輪播功能 ---
$(function() {
  $('.carousel-container').each(function() {
    var $container = $(this);
    var $track = $container.find('.carousel-track');
    var $slides = $container.find('.carousel-slide');
    var $dots = $container.find('.dot');
    var currentSlide = 0;
    var slideCount = $slides.length;
    
    // 如果只有一張圖片，不需要輪播功能
    if (slideCount <= 1) return;
    
    // 更新輪播位置
    function updateCarousel() {
      var translateX = -currentSlide * 100;
      $track.css('transform', 'translateX(' + translateX + '%)');
      
      // 更新圓點狀態
      $dots.removeClass('active');
      $dots.eq(currentSlide).addClass('active');
    }
    
    // 下一張
    function nextSlide() {
      currentSlide = (currentSlide + 1) % slideCount;
      updateCarousel();
    }
    
    // 前一張
    function prevSlide() {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateCarousel();
    }
    
    // 跳到指定張
    function goToSlide(index) {
      currentSlide = index;
      updateCarousel();
    }
    
    // 圓點點擊事件
    $dots.on('click', function() {
      var index = $(this).data('slide');
      goToSlide(index);
    });
    
    // 自動播放
    var autoPlayInterval = setInterval(nextSlide, 3000); // 3秒切換一次
    
    // 滑鼠懸停時暫停自動播放
    $container.on('mouseenter', function() {
      clearInterval(autoPlayInterval);
    });
    
    // 滑鼠離開時恢復自動播放
    $container.on('mouseleave', function() {
      autoPlayInterval = setInterval(nextSlide, 3000);
    });
    
    // 初始化
    updateCarousel();
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
