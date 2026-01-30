const media = {
  xs: 459.98,
  sm: 575.98,
  md: 767.98,
  lg: 991.98,
  xl: 1365.98,
  xxl: 2499.98,
};

if (typeof Swiper !== 'undefined' && window.SwiperModules) {
  const { Navigation, Pagination, Scrollbar, Autoplay, Grid, Thumbs, FreeMode } = window.SwiperModules;
  Swiper.use([Navigation, Pagination, Scrollbar, Autoplay, Grid, Thumbs, FreeMode]);
  Swiper.defaults.touchStartPreventDefault = false;
}

function initRooms() {
  const roomsGrid = document.getElementById('roomsGrid');
  if (!roomsGrid) return;

  const activeTab = document.querySelector('.rooms__tab--active');
  const activeCategory = activeTab ? activeTab.dataset.tab : 'all';
  const allRooms = roomsGrid.querySelectorAll('[data-room-id]');

  allRooms.forEach(room => {
    const roomCategory = room.dataset.roomCategory;
    
    if (activeCategory === 'all' || roomCategory === activeCategory) {
      room.style.display = '';
    } else {
      room.style.display = 'none';
    }
  });
}

function initRoomsTabs() {
  const tabsContainer = document.querySelector('.rooms__tabs');
  if (!tabsContainer) return;

  if (window.innerWidth <= 768 && typeof Swiper !== 'undefined') {
    const slider = document.querySelector('[data-slider="rooms-tabs"]');
    if (slider) {
      const swiper = slider.querySelector('[data-slider-swiper="rooms-tabs"]');
      if (swiper) {
        const { FreeMode } = window.SwiperModules || {};
        new Swiper(swiper, {
          modules: FreeMode ? [FreeMode] : [],
          slidesPerView: 'auto',
          spaceBetween: 8,
          freeMode: true,
        });
      }
    }
  }

  const tabs = document.querySelectorAll('.rooms__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('rooms__tab--active');
      });
      tab.classList.add('rooms__tab--active');
      initRooms();
    });
  });
}

function initCounters() {
  const heroForm = document.querySelector('.hero__form');
  if (!heroForm) return;
  
  if (heroForm.dataset.countersInitialized === 'true') return;
  heroForm.dataset.countersInitialized = 'true';
  
  heroForm.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.matches('[data-counter-minus], [data-counter-plus]')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    let counterWrapper = target.closest('.hero__form-counter-wrapper');
    if (!counterWrapper) {
      counterWrapper = target.closest('.flex.items-center.gap-2');
    }
    if (!counterWrapper) return;
    
    const valueEl = counterWrapper.querySelector('[data-counter-value]');
    if (!valueEl) return;
    
    let formGroup = counterWrapper.closest('.hero__form-group');
    if (!formGroup) {
      formGroup = counterWrapper.closest('.relative');
    }
    const label = formGroup?.querySelector('label');
    const maxValue = 15;
    const minValue = 0;
    
    let value = parseInt(valueEl.value) || 0;
    
    if (target.matches('[data-counter-minus]')) {
      if (value > minValue) {
        value--;
        valueEl.value = value;
      }
    } else if (target.matches('[data-counter-plus]')) {
      if (value < maxValue) {
        value++;
        valueEl.value = value;
      }
    }
  });
}

function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Читает данные бронирований из data-атрибутов элемента
 * @param {HTMLElement} element - Элемент с data-bookings или data-room-bookings
 * @param {string|null} roomId - ID номера для фильтрации (опционально)
 * @returns {Array} Массив бронирований
 */
function getBookingsFromData(element, roomId = null) {
  let bookings = [];
  
  const bookingsData = element?.dataset?.bookings || element?.dataset?.roomBookings;
  
  if (bookingsData) {
    try {
      bookings = JSON.parse(bookingsData);
    } catch (e) {
      bookings = [];
    }
  }
  
  if (roomId !== null && roomId !== undefined) {
    bookings = bookings.filter(booking => {
      const bookingRoomId = booking.roomId ? String(booking.roomId) : null;
      return bookingRoomId === String(roomId);
    });
  }
  
  return bookings;
}

// Функция для проверки, забронирована ли дата
function isDateBookedGlobal(date, roomId, bookings = null) {
  if (!bookings) {
    bookings = [];
  }
  
  const dateStr = toISODateGlobal(date);
  return bookings.some(booking => {
    const inRange = dateStr >= booking.checkin && dateStr < booking.checkout;
    if (!inRange) return false;
    if (!roomId) {
      return !booking.roomId;
    }
    return booking.roomId ? booking.roomId === String(roomId) : true;
  });
}

function toISODateGlobal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getToday() {
  return normalizeDate(new Date());
}

function getMaxDate() {
  const today = getToday();
  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 1);
  return max;
}

/**
 * Получает массив заблокированных дат для календаря
 * @param {Array} bookings - Массив бронирований
 * @param {string|null} roomId - ID номера для фильтрации
 * @returns {Array} Массив объектов {from: Date, to: Date}
 */
function getDisabledDates(bookings, roomId) {
  const disabledDates = [];
  const today = getToday();
  const maxDate = getMaxDate();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 365);
  
  for (let d = new Date(startDate); d < today; d.setDate(d.getDate() + 1)) {
    disabledDates.push(new Date(d));
  }
  
  // Блокируем даты после maxDate
  for (let d = new Date(maxDate); d <= new Date(maxDate.getTime() + 365 * 24 * 60 * 60 * 1000); d.setDate(d.getDate() + 1)) {
    disabledDates.push(new Date(d));
  }
  
  // Блокируем забронированные даты
  if (bookings && bookings.length > 0) {
    bookings.forEach(booking => {
      if (roomId !== null && booking.roomId && String(booking.roomId) !== String(roomId)) {
        return; // Пропускаем бронирования других номеров
      }
      
      const checkin = new Date(booking.checkin);
      const checkout = new Date(booking.checkout);
      
      for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
        disabledDates.push(new Date(d));
      }
    });
  }
  
  return disabledDates;
}

let modalDatePickerApi = null;

function initDatePickers() {
  if (typeof AirDatepicker === 'undefined') {
    return;
  }

  const MONTHS_RU = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  function formatDate(date) {
    if (!date) return '';
    const day = date.getDate();
    const month = MONTHS_RU[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function parseDate(str) {
    if (!str || !str.trim()) return null;

    const monthMap = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };

    const parts = str.trim().toLowerCase().split(/\s+/);
    if (parts.length < 2) return null;

    const day = parseInt(parts[0]);
    const monthName = parts[1];
    const month = monthMap[monthName];

    if (isNaN(day) || month === undefined) return null;

    let year;
    if (parts.length >= 3) {
      year = parseInt(parts[2]);
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const testDate = new Date(currentYear, month, day);
      
      if (normalizeDate(testDate) < normalizeDate(now)) {
        year = currentYear + 1;
      } else {
        year = currentYear;
      }
    }

    const result = new Date(year, month, day);
    if (isNaN(result.getTime())) return null;

    return normalizeDate(result);
  }

  function formatAdminDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function parseAdminDate(str) {
    if (!str || !str.trim()) return null;
    const parts = str.trim().split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(part => parseInt(part, 10));
    if (!day || !month || !year) return null;
    const result = new Date(year, month - 1, day);
    if (isNaN(result.getTime())) return null;
    return normalizeDate(result);
  }


  function createDatePicker(config) {
    const {
      checkinInput,
      checkoutInput,
      checkinBtn,
      checkoutBtn,
      checkinDropdown,
      checkoutDropdown,
      getRoomId,
      onSelect,
      formatValue,
      parseValue,
      dataSource, // Элемент для получения данных из data-атрибутов
      container // Контейнер для календаря (hero__form)
    } = config;

    if (!checkinInput || !checkoutInput) return;

    const formatOutput = typeof formatValue === 'function' ? formatValue : formatDate;
    const parseInput = typeof parseValue === 'function' ? parseValue : parseDate;
    const today = getToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maxDate = getMaxDate();

    checkinInput.placeholder = formatOutput(today);
    checkoutInput.placeholder = formatOutput(tomorrow);

    checkinInput.setAttribute('readonly', 'readonly');
    checkinInput.setAttribute('inputmode', 'none');
    if (checkoutInput) {
      checkoutInput.setAttribute('readonly', 'readonly');
      checkoutInput.setAttribute('inputmode', 'none');
    }

    const bookings = dataSource ? getBookingsFromData(dataSource, getRoomId ? getRoomId() : null) : [];
    const disabledDates = getDisabledDates(bookings, getRoomId ? getRoomId() : null);

    const useShortFormat = formatValue !== undefined && formatValue !== formatDate;
    const dateFormat = useShortFormat ? 'dd.MM.yyyy' : 'd MMMM yyyy';
    
    const datepickerOptions = {
      range: true,
      multipleDatesSeparator: ' - ',
      dateFormat: dateFormat,
      minDate: today,
      maxDate: maxDate,
      disabledDates: disabledDates,
      container: container || undefined, // Контейнер для календаря (hero__form)
      onSelect({date}) {
        if (date && Array.isArray(date) && date.length === 2) {
          const [checkin, checkout] = date;
          checkinInput.value = formatOutput(checkin);
          checkoutInput.value = formatOutput(checkout);
          
          if (typeof onSelect === 'function') {
            onSelect();
          }
        } else if (date && Array.isArray(date) && date.length === 1) {
          checkinInput.value = formatOutput(date[0]);
          checkoutInput.value = '';
        }
      },
      buttons: [],
      isMobile: window.innerWidth < 768,
      locale: {
        days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        daysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        daysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
        today: 'Сегодня',
        clear: 'Очистить',
        dateFormat: dateFormat,
        timeFormat: 'HH:mm',
        firstDay: 1
      }
    };
    
    let datepicker;
    try {
      datepicker = new AirDatepicker(checkinInput, datepickerOptions);
      
      if (!datepicker) {
        return null;
      }
      
      const showCalendar = () => {
        try {
          datepicker.show();
        } catch (err) {}
      };
      
      const hideCalendar = () => {
        try {
          if (datepicker.visible) {
            datepicker.hide();
          }
        } catch (err) {}
      };
      
      if (checkinBtn) {
        checkinBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (datepicker.visible) {
            hideCalendar();
          } else {
            showCalendar();
          }
        });
      }

      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (datepicker.visible) {
            hideCalendar();
          } else {
            showCalendar();
          }
        });
      }

      checkinInput.addEventListener('click', (e) => {
        e.stopPropagation();
        showCalendar();
      });

      if (checkoutInput) {
        checkoutInput.addEventListener('click', (e) => {
          e.stopPropagation();
          showCalendar();
        });
      }
      
      checkinInput.addEventListener('focus', () => {
        showCalendar();
      });

      if (checkoutInput) {
        checkoutInput.addEventListener('focus', () => {
          showCalendar();
        });
      }
      
    } catch (err) {
      console.error('Error initializing datepicker:', err);
      return null;
    }

    return {
      setRange: (checkin, checkout) => {
        if (checkin && checkout) {
          datepicker.selectDate([checkin, checkout]);
        } else if (checkin) {
          datepicker.selectDate([checkin]);
        }
      },
      datepicker: datepicker
    };
  }

  const heroForm = document.querySelector('.hero__form');
  const heroConfig = {
    checkinInput: document.getElementById('checkin-input'),
    checkoutInput: document.getElementById('checkout-input'),
    checkinBtn: document.getElementById('checkin-btn'),
    checkoutBtn: document.getElementById('checkout-btn'),
    checkinDropdown: document.getElementById('checkin-date-picker'),
    checkoutDropdown: document.getElementById('checkout-date-picker'),
    getRoomId: () => null,
    dataSource: heroForm, // Источник данных из data-bookings
    container: heroForm // Контейнер для календаря - растягивается на всю ширину формы
  };

  if (heroConfig.checkinInput && heroConfig.checkoutInput) {
    createDatePicker(heroConfig);
  }

  // Для модалки комнаты - данные берутся из карточки комнаты
  const modalConfig = {
    checkinInput: document.getElementById('modalCheckin'),
    checkoutInput: document.getElementById('modalCheckout'),
    checkinBtn: document.getElementById('modalCheckinBtn'),
    checkoutBtn: document.getElementById('modalCheckoutBtn'),
    checkinDropdown: document.getElementById('modal-checkin-date-picker'),
    checkoutDropdown: document.getElementById('modal-checkout-date-picker'),
    getRoomId: () => (selectedRoomData ? selectedRoomData.id : null),
    onSelect: () => {
      syncRoomCalendarFromForm();
    },
    formatValue: formatDateForForm,
    parseValue: parseFormDate,
    dataSource: null // Будет установлен динамически при открытии модалки
  };

  if (modalConfig.checkinInput && modalConfig.checkoutInput) {
    modalDatePickerApi = createDatePicker(modalConfig);
  }
  
  const adminForm = document.querySelector('.admin-form');
  let adminDatePickerApi = null;
  const adminConfig = {
    checkinInput: document.getElementById('adminCheckin'),
    checkoutInput: document.getElementById('adminCheckout'),
    checkinBtn: document.getElementById('adminCheckinBtn'),
    checkoutBtn: document.getElementById('adminCheckoutBtn'),
    checkinDropdown: document.getElementById('admin-checkin-date-picker'),
    checkoutDropdown: document.getElementById('admin-checkout-date-picker'),
    getRoomId: () => {
      const activeTab = document.querySelector('.admin-tabs__btn--active');
      if (activeTab && activeTab.dataset.roomId) {
        return activeTab.dataset.roomId;
      }
      return document.getElementById('adminRoomInput')?.value || null;
    },
    formatValue: formatAdminDate,
    parseValue: parseAdminDate,
    onSelect: () => updateAdminDaysCount(),
    dataSource: adminForm // Источник данных из data-bookings
  };

  if (adminConfig.checkinInput && adminConfig.checkoutInput) {
    adminDatePickerApi = createDatePicker(adminConfig);
    window.adminDatePickerApi = adminDatePickerApi;
  }
  }

  const form = document.querySelector('.hero__form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }


function initGallery() {
  const mobileGrid = document.querySelector('.fine__grid--mobile');
  const moreBtn = document.getElementById('fineMoreBtn');
  
  // Инициализация кнопки "еще фото" на мобилке
  if (moreBtn && mobileGrid) {
    moreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.innerWidth <= 768) {
        mobileGrid.classList.add('show-more');
        const hiddenItems = mobileGrid.querySelectorAll('.fine__grid-item--hidden');
        hiddenItems.forEach(item => {
          item.style.display = 'flex';
        });
        this.style.display = 'none';
      }
    });
  }
  
  if (typeof Fancybox !== 'undefined') {
    try {
      Fancybox.bind('[data-fancybox="gallery"]', {
        Toolbar: {
          display: {
            left: ['counter'],
            middle: [],
            right: ['zoom', 'slideshow', 'fullscreen', 'thumbs', 'close'],
          },
        },
        Thumbs: {
          autoStart: true,
        },
        Image: {
          zoom: true,
          fit: 'contain',
          wheel: 'slide',
        },
        on: {
          load: (fancybox, slide) => {
            try {
              if (!slide || !slide.contentEl) return;
              const img = slide.contentEl.querySelector('img');
              if (img) {
                img.removeAttribute('loading');
                img.style.objectFit = 'contain';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.width = 'auto';
                img.style.height = 'auto';
              }
            } catch (e) {
            }
          },
        },
      });
    } catch (err) {
    }
  }
}

function initAboutDropsParallax() {
  const leftDrop = document.querySelector('.about__drop--left');
  const rightDrop = document.querySelector('.about__drop--right');
  if (!leftDrop || !rightDrop) return;

  const aboutSection = document.querySelector('.about');
  if (!aboutSection) return;

  let ticking = false;
  let lastScrollY = window.scrollY;
  let accumulatedXLeft = 0;
  let accumulatedXRight = 0;

  function updateParallax() {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    const rect = aboutSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    const scrollProgress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)));

    const scale = 0.95 + scrollProgress * 0.15 + Math.sin(scrollY * 0.002) * 0.03;
    const translateY = scrollProgress * 20 - 10;

    if (scrollDelta > 0) {
      accumulatedXLeft = Math.min(accumulatedXLeft + scrollDelta * 0.02, 15);
      accumulatedXRight = Math.max(accumulatedXRight - scrollDelta * 0.02, -15);
    } else if (scrollDelta < 0) {
      accumulatedXLeft = Math.max(accumulatedXLeft + scrollDelta * 0.02, -15);
      accumulatedXRight = Math.min(accumulatedXRight - scrollDelta * 0.02, 15);
    } else {
      accumulatedXLeft *= 0.95;
      accumulatedXRight *= 0.95;
    }

    leftDrop.style.transform = `translate(${accumulatedXLeft}px, ${translateY}px) scale(${scale})`;
    rightDrop.style.transform = `translate(${accumulatedXRight}px, ${translateY}px) scale(${scale})`;

    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  updateParallax();
}

function initEntranceAnimations() {
  const aboutSection = document.querySelector('.about');
  const provenceSection = document.querySelector('.provence');

  const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('about')) {
          const leftDrop = entry.target.querySelector('.about__drop--left');
          const rightDrop = entry.target.querySelector('.about__drop--right');
          if (leftDrop && !leftDrop.classList.contains('about__drop--animated')) {
            leftDrop.classList.add('about__drop--animated');
          }
          if (rightDrop && !rightDrop.classList.contains('about__drop--animated')) {
            rightDrop.classList.add('about__drop--animated');
          }
        } else if (entry.target.classList.contains('provence')) {
          const leaves = entry.target.querySelectorAll('.provence__leaf');
          const flowers = entry.target.querySelectorAll('.provence__flower');
          
          leaves.forEach((leaf, index) => {
            if (!leaf.classList.contains('provence__leaf--animated')) {
              setTimeout(() => {
                leaf.classList.add('provence__leaf--animated');
              }, index * 100);
            }
          });

          flowers.forEach((flower, index) => {
            if (!flower.classList.contains('provence__flower--animated')) {
              setTimeout(() => {
                flower.classList.add('provence__flower--animated');
              }, 300 + index * 50);
            }
          });
        }
      }
    });
  }, observerOptions);

  if (aboutSection) {
    observer.observe(aboutSection);
  }
  if (provenceSection) {
    observer.observe(provenceSection);
  }
}

function initAdvantages() {
  const advantagesSwiper = document.querySelector('.advantages-swiper');
  if (!advantagesSwiper || typeof Swiper === 'undefined') return;

  try {
    const { Pagination, Autoplay } = window.SwiperModules || {};

    new Swiper(advantagesSwiper, {
      modules: [Pagination, Autoplay],
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 500,
      watchOverflow: false,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.advantages-pagination',
        clickable: true,
        type: 'bullets',
      },
      allowTouchMove: true,
      grabCursor: true,
    });
  } catch (err) {
  }
}

function initAttractions() {
  const mobileGrid = document.querySelector('.attractions__grid--mobile');
  const moreBtn = document.getElementById('attractionsMoreBtn');

  // Инициализация кнопки "еще фото" на мобилке
  if (moreBtn && mobileGrid) {
    moreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.innerWidth <= 768) {
        mobileGrid.classList.add('show-more');
        const hiddenItems = mobileGrid.querySelectorAll('.attractions__grid-item--hidden');
        hiddenItems.forEach(item => {
          item.style.display = 'flex';
        });
        this.style.display = 'none';
      }
    });
  }
  
}

function initAttractionSliders() {
  if (typeof Swiper === 'undefined' || window.innerWidth <= 768) return;

  // Инициализация attraction-swiper-top
  const attractionSwiperTop = document.querySelector('.attraction-swiper-top');
  if (attractionSwiperTop) {
    new Swiper(attractionSwiperTop, {
      modules: [window.SwiperModules.Autoplay],
      slidesPerView: 'auto',
      spaceBetween: 20,
      loop: true,
      speed: 15000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
      freeMode: false,
      allowTouchMove: false,
    });
  }

  // Инициализация attraction-swiper-bottom
  const attractionSwiperBottom = document.querySelector('.attraction-swiper-bottom');
  if (attractionSwiperBottom) {
    new Swiper(attractionSwiperBottom, {
      modules: [window.SwiperModules.Autoplay],
      slidesPerView: 'auto',
      spaceBetween: 20,
      loop: true,
      speed: 15000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        reverseDirection: true,
      },
      freeMode: false,
      allowTouchMove: false,
    });
  }
}

function initMobileMenu() {
  const menuBtn = document.getElementById('headerMenuBtn');
  const nav = document.getElementById('headerNav');
  const closeBtn = document.getElementById('headerNavClose');
  
  if (!menuBtn || !nav) return;
  
  const openMenu = () => {
    nav.classList.add('header__nav--open');
    document.body.style.overflow = 'hidden';
  };
  
  const closeMenu = () => {
    nav.classList.remove('header__nav--open');
    document.body.style.overflow = '';
  };
  
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenu();
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }
  
  // Закрытие меню при клике на ссылку
  const navLinks = nav.querySelectorAll('.header__nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
  
  nav.addEventListener('click', (e) => {
    if (e.target === nav) {
      closeMenu();
    }
  });
  
  // Закрытие меню при клике на кнопку бронирования в меню
  const navBookingBtn = nav.querySelector('.header__nav-booking');
  if (navBookingBtn) {
    navBookingBtn.addEventListener('click', () => {
      closeMenu();
      scrollToHero();
    });
  }
}

function applyPhoneMask(phoneInput) {
  if (!phoneInput) return;
  
  // Проверяем, не инициализирована ли уже маска для этого элемента
  if (phoneInput.dataset.phoneMaskInitialized === 'true') {
    return;
  }
  phoneInput.dataset.phoneMaskInitialized = 'true';
  
  if (!phoneInput.value) {
    phoneInput.value = '+7';
  }

  phoneInput.addEventListener('focus', () => {
    if (phoneInput.value === '' || phoneInput.value === '+7') {
      phoneInput.setSelectionRange(2, 2);
    }
  });

  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.startsWith('8')) {
      value = '7' + value.substring(1);
    }
    
    if (!value.startsWith('7')) {
      value = '7' + value;
    }
    
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    let formattedValue = '+7';
    if (value.length > 1) {
      formattedValue += ' (' + value.substring(1, 4);
    }
    if (value.length >= 4) {
      formattedValue += ') ' + value.substring(4, 7);
    }
    if (value.length >= 7) {
      formattedValue += '-' + value.substring(7, 9);
    }
    if (value.length >= 9) {
      formattedValue += '-' + value.substring(9, 11);
    }
    
    e.target.value = formattedValue;
  });

  phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && phoneInput.value === '+7') {
      e.preventDefault();
    }
  });
}

// Phone mask function
function initPhoneMask() {
  const inputs = [
    document.getElementById('modalPhone'),
    document.getElementById('leadPhone'),
    document.getElementById('adminPhone')
  ].filter(Boolean);

  inputs.forEach(applyPhoneMask);
}

let selectedRoomData = null;
let openPriceModalFromRoom = null;
let openStatusModal = null;

/**
 * Обработчик валидации формы бронирования
 * Форма отправляется стандартным способом через HTML form submit
 * @param {Event} e - Событие submit формы
 */
function handleBookingSubmit(e) {
  const form = e.target;
  if (form && !form.checkValidity()) {
    e.preventDefault();
    form.reportValidity();
    return;
  }
  // Если валидация прошла, форма отправится стандартным способом
  // Обработка успешной отправки и закрытие модального окна - забота бекендера
}

function initModal() {
  const modal = document.getElementById('priceModal');
  const openBtn = document.getElementById('openPriceModal');
  const closeBtn = document.getElementById('modalClose');
  const overlay = modal?.querySelector('.modal__overlay');
  const form = document.getElementById('priceForm');

  if (!modal) return;

  function openModal() {
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    if (form) {
      form.reset();
    }
  }

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      selectedRoomData = null;
      openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });

  // Modal counters
  const adultsMinus = document.getElementById('modalAdultsMinus');
  const adultsPlus = document.getElementById('modalAdultsPlus');
  const adultsValue = document.getElementById('modalAdultsValue');
  const childrenMinus = document.getElementById('modalChildrenMinus');
  const childrenPlus = document.getElementById('modalChildrenPlus');
  const childrenValue = document.getElementById('modalChildrenValue');

  if (adultsMinus && adultsPlus && adultsValue) {
    const maxAdults = 15;
    const minAdults = 0;

    const updateAdultsValue = () => {
      let value = parseInt(adultsValue.value) || 0;
      if (value < minAdults) value = minAdults;
      if (value > maxAdults) value = maxAdults;
      adultsValue.value = value;
    };

    adultsMinus.addEventListener('click', () => {
      let value = parseInt(adultsValue.value) || 0;
      if (value > minAdults) {
        value--;
        adultsValue.value = value;
      }
    });
    adultsPlus.addEventListener('click', () => {
      let value = parseInt(adultsValue.value) || 0;
      if (value < maxAdults) {
        value++;
        adultsValue.value = value;
      }
    });

    // Обработка ввода с клавиатуры
    adultsValue.addEventListener('input', () => {
      updateAdultsValue();
    });

    adultsValue.addEventListener('blur', () => {
      updateAdultsValue();
    });

    adultsValue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateAdultsValue();
        adultsValue.blur();
      }
    });
  }

  if (childrenMinus && childrenPlus && childrenValue) {
    const maxChildren = 15;
    const minChildren = 0;

    const updateChildrenValue = () => {
      let value = parseInt(childrenValue.value) || 0;
      if (value < minChildren) value = minChildren;
      if (value > maxChildren) value = maxChildren;
      childrenValue.value = value;
    };

    childrenMinus.addEventListener('click', () => {
      let value = parseInt(childrenValue.value) || 0;
      if (value > minChildren) {
        value--;
        childrenValue.value = value;
      }
    });
    childrenPlus.addEventListener('click', () => {
      let value = parseInt(childrenValue.value) || 0;
      if (value < maxChildren) {
        value++;
        childrenValue.value = value;
      }
    });

    // Обработка ввода с клавиатуры
    childrenValue.addEventListener('input', () => {
      updateChildrenValue();
    });

    childrenValue.addEventListener('blur', () => {
      updateChildrenValue();
    });

    childrenValue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateChildrenValue();
        childrenValue.blur();
      }
    });
  }

  openPriceModalFromRoom = () => {
    openModal();
  };

  if (form) {
    form.addEventListener('submit', handleBookingSubmit);
  }
}

// Lead modal (hero)
function initLeadModal() {
  const modal = document.getElementById('leadModal');
  const openBtn = document.getElementById('openLeadModal');
  const closeBtn = document.getElementById('leadModalClose');
  const overlay = modal?.querySelector('.modal__overlay');
  const form = document.getElementById('leadForm');

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    if (form) {
      form.reset();
    }
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }
      // Если валидация прошла, форма отправится стандартным способом
      // Обработка успешной отправки и закрытие модального окна - забота бекендера
    });
  }
}

function initStatusModals() {
  const successModal = document.getElementById('successModal');
  const errorModal = document.getElementById('errorModal');
  const successClose = document.getElementById('successModalClose');
  const errorClose = document.getElementById('errorModalClose');
  const successOverlay = successModal?.querySelector('.modal__overlay');
  const errorOverlay = errorModal?.querySelector('.modal__overlay');

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  };

  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  };

  if (successClose) {
    successClose.addEventListener('click', () => closeModal(successModal));
  }
  if (errorClose) {
    errorClose.addEventListener('click', () => closeModal(errorModal));
  }

  if (successOverlay) {
    successOverlay.addEventListener('click', () => closeModal(successModal));
  }
  if (errorOverlay) {
    errorOverlay.addEventListener('click', () => closeModal(errorModal));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (successModal?.classList.contains('modal--open')) {
        closeModal(successModal);
      }
      if (errorModal?.classList.contains('modal--open')) {
        closeModal(errorModal);
      }
    }
  });

  openStatusModal = (status) => {
    if (status === 'error') {
      openModal(errorModal);
    } else {
      openModal(successModal);
    }
  };
}

function initConsentModal() {
  const modal = document.getElementById('consentModal');
  const closeBtn = document.getElementById('consentModalClose');
  const overlay = modal?.querySelector('.modal__overlay');
  const openButtons = document.querySelectorAll('[data-consent-open]');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('modal--open');
  };

  const closeModal = () => {
    modal.classList.remove('modal--open');
  };

  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });
}

function initAdminDeleteModal() {
  const modal = document.getElementById('adminDeleteModal');
  const closeBtn = document.getElementById('adminDeleteModalClose');
  const overlay = modal?.querySelector('.modal__overlay');
  const cancelBtn = modal?.querySelector('[data-admin-delete-cancel]');
  const confirmBtn = modal?.querySelector('[data-admin-delete-confirm]');
  const bookingsBody = document.querySelector('[data-admin-bookings-body]');
  const totalEl = document.querySelector('[data-admin-total]');
  let pendingRow = null;

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    pendingRow = null;
  };

  document.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('[data-admin-delete]');
    if (!deleteBtn) return;
    event.preventDefault();
    pendingRow = deleteBtn.closest('.admin-table__row');
    openModal();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (pendingRow) {
        pendingRow.remove();
        if (bookingsBody && bookingsBody.children.length === 0) {
          bookingsBody.innerHTML = '<div class="admin-table__empty">Нет броней</div>';
          if (totalEl) {
            totalEl.textContent = '0';
          }
        }
      }
      closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });
}

// Room Modal functions
let roomModalSlider = {
  currentIndex: 0,
  images: [],
  track: null,
  pagination: null
};

function initRoomModal() {
  const modal = document.getElementById('roomModal');
  const closeBtn = document.getElementById('roomModalClose');
  const cancelBtn = document.getElementById('roomModalCancel');
  const overlay = modal?.querySelector('.room-modal__overlay');
  const roomCards = document.querySelectorAll('.rooms__card');

  if (!modal) return;

  function openRoomModal(roomData, roomCardElement) {
    // Сохраняем данные о номере для последующего использования при бронировании
    selectedRoomData = {
      id: roomData.id || null,
      title: roomData.title || null,
      price: roomData.price || null,
      capacity: roomData.capacity || null,
      capacityNumber: roomData.capacityNumber || null
    };

    if (modalDatePickerApi && modalDatePickerApi.datepicker && roomCardElement) {
      try {
        const bookings = getBookingsFromData(roomCardElement, roomData.id);
        const disabledDates = getDisabledDates(bookings, roomData.id);
        modalDatePickerApi.datepicker.update({ disabledDates: disabledDates });
      } catch (e) {
        // Игнорируем ошибку "can't access property destroy, this.nav is undefined"
        console.warn('Datepicker update error (ignored):', e);
      }
    }

    const titleEl = document.getElementById('roomModalTitle');
    const priceEl = document.getElementById('roomModalPrice');
    const sizeEl = document.getElementById('roomModalSize');
    const capacityEl = document.getElementById('roomModalCapacity');
    const descriptionEl = document.getElementById('roomModalDescription');
    const amenitiesEl = document.getElementById('roomModalAmenities');

    if (titleEl) titleEl.textContent = roomData.title || '';
    if (priceEl) priceEl.textContent = roomData.price || '';
    if (sizeEl) sizeEl.textContent = roomData.size || '22 м²';
    if (capacityEl) capacityEl.textContent = roomData.capacity || '';
    if (descriptionEl) descriptionEl.textContent = roomData.description || '';

    if (roomData.images && roomData.images.length > 0) {
      setupRoomSlider(roomData.images);
    }

    // Set up calendar with air-datepicker
    setupRoomModalDatePicker(roomCardElement, roomData.id);

    if (amenitiesEl && roomData.amenities) {
      amenitiesEl.innerHTML = '';
      roomData.amenities.forEach(amenity => {
        const amenityEl = document.createElement('div');
        amenityEl.className = 'room-modal__amenity';
        if (amenity.icon) {
          amenityEl.innerHTML = `<img src="${amenity.icon}" alt="${amenity.name}">`;
        }
        amenitiesEl.appendChild(amenityEl);
      });
    }

    modal.classList.add('room-modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeRoomModal() {
    modal.classList.remove('room-modal--open');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeRoomModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeRoomModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closeRoomModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('room-modal--open')) {
      closeRoomModal();
    }
  });

  // Book button - сохраняет данные о номере и открывает форму бронирования
  const bookBtn = document.getElementById('roomModalBook');
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      // Значения уже синхронизированы через onSelect в setupRoomModalDatePicker

      // Данные о номере уже сохранены в selectedRoomData при открытии room modal
      // Закрываем room modal и открываем форму бронирования
      closeRoomModal();
      if (typeof openPriceModalFromRoom === 'function') {
        openPriceModalFromRoom();
      } else {
        const priceModal = document.getElementById('priceModal');
        const openPriceBtn = document.getElementById('openPriceModal');
        if (priceModal && openPriceBtn) {
          openPriceBtn.click();
        }
      }
    });
  }
}

function setupRoomSlider(images) {
  const track = document.querySelector('.room-modal__slider-track');
  const pagination = document.getElementById('roomSliderPagination');
  const prevBtn = document.getElementById('roomSliderPrev');
  const nextBtn = document.getElementById('roomSliderNext');

  if (!track) return;

  roomModalSlider.images = images;
  roomModalSlider.currentIndex = 0;
  roomModalSlider.track = track;
  roomModalSlider.pagination = pagination;

  // Clear and populate slider
  track.innerHTML = '';
  if (pagination) pagination.innerHTML = '';

  images.forEach((img, index) => {
    const slide = document.createElement('div');
    slide.className = 'room-modal__slider-slide';
    slide.innerHTML = `<img src="${img}" alt="Room image ${index + 1}">`;
    track.appendChild(slide);

    if (pagination) {
      const dot = document.createElement('button');
      dot.className = `room-modal__slider-dot ${index === 0 ? 'room-modal__slider-dot--active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      pagination.appendChild(dot);
    }
  });

  updateSlider();

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      roomModalSlider.currentIndex = (roomModalSlider.currentIndex - 1 + images.length) % images.length;
      updateSlider();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
    roomModalSlider.currentIndex = (roomModalSlider.currentIndex + 1) % images.length;
      updateSlider();
    });
  }
}

function goToSlide(index) {
  roomModalSlider.currentIndex = index;
  updateSlider();
}

function updateSlider() {
  if (!roomModalSlider.track) return;

  const offset = -roomModalSlider.currentIndex * 100;
  roomModalSlider.track.style.transform = `translateX(${offset}%)`;

  // Update pagination
  if (roomModalSlider.pagination) {
    const dots = roomModalSlider.pagination.querySelectorAll('.room-modal__slider-dot');
    dots.forEach((dot, index) => {
      if (index === roomModalSlider.currentIndex) {
        dot.classList.add('room-modal__slider-dot--active');
      } else {
        dot.classList.remove('room-modal__slider-dot--active');
      }
    });
  }
}

function formatDateForForm(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function parseFormDate(value) {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

let roomModalDatePickerApi = null;

function setupRoomModalDatePicker(roomCardElement, roomId) {
  if (!window.AirDatepicker) return;
  
  const bookings = roomCardElement ? getBookingsFromData(roomCardElement, roomId) : [];
  const disabledDates = getDisabledDates(bookings, roomId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  const datepickerOptions = {
    range: true,
    multipleDatesSeparator: ' - ',
    dateFormat: 'dd.MM.yyyy',
    minDate: today,
    maxDate: maxDate,
    disabledDates: disabledDates,
    onSelect: ({ date, formattedDate, datepicker }) => {
      // Обновляем значения в форме бронирования, если она открыта
      const modalCheckinInput = document.getElementById('modalCheckin');
      const modalCheckoutInput = document.getElementById('modalCheckout');
      
      if (modalCheckinInput && modalCheckoutInput) {
        if (Array.isArray(date) && date.length === 2) {
          modalCheckinInput.value = formatDateForForm(date[0]);
          modalCheckoutInput.value = formatDateForForm(date[1]);
        } else if (Array.isArray(date) && date.length === 1) {
          modalCheckinInput.value = formatDateForForm(date[0]);
          modalCheckoutInput.value = '';
        } else {
          modalCheckinInput.value = '';
          modalCheckoutInput.value = '';
        }
      }
    },
    buttons: [],
    isMobile: false,
    locale: {
      days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
      daysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      daysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      today: 'Сегодня',
      clear: 'Очистить',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'hh:mm',
      firstDay: 1
    },
    container: document.getElementById('roomModalCalendarContainer'),
    inline: true
  };
  
  if (roomModalDatePickerApi && roomModalDatePickerApi.datepicker) {
    roomModalDatePickerApi.datepicker.destroy();
    roomModalDatePickerApi = null;
  }
  
  const container = document.getElementById('roomModalCalendarContainer');
  if (!container) return;
  
  // Очищаем контейнер перед созданием нового календаря
  container.innerHTML = '';
  
  const datepicker = new window.AirDatepicker(container, datepickerOptions);
  
  roomModalDatePickerApi = {
    datepicker: datepicker,
    setRange: (checkin, checkout) => {
      if (checkin && checkout) {
        datepicker.selectDate([checkin, checkout]);
      } else if (checkin) {
        datepicker.selectDate([checkin]);
      }
    }
  };
  
  // Календарь всегда виден (inline)
  datepicker.show();
}

function syncRoomCalendarFromForm() {
  // Синхронизирует inline календарь с датами из полей формы
  if (!roomModalDatePickerApi || !roomModalDatePickerApi.datepicker) {
    return;
  }

  const modalCheckinInput = document.getElementById('modalCheckin');
  const modalCheckoutInput = document.getElementById('modalCheckout');

  if (!modalCheckinInput || !modalCheckoutInput) {
    return;
  }

  const checkinDate = parseFormDate(modalCheckinInput.value);
  const checkoutDate = parseFormDate(modalCheckoutInput.value);

  if (checkinDate && checkoutDate) {
    // Обе даты заполнены - устанавливаем диапазон
    roomModalDatePickerApi.datepicker.selectDate([checkinDate, checkoutDate]);
  } else if (checkinDate) {
    // Только дата заезда - устанавливаем только её
    roomModalDatePickerApi.datepicker.selectDate([checkinDate]);
  } else {
    // Нет дат - очищаем календарь
    roomModalDatePickerApi.datepicker.clear();
  }
}

function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAcceptBtn');
  if (!banner || !acceptBtn) return;

  const storageKey = 'milahouse_cookie_consent';
  const hasConsent = localStorage.getItem(storageKey) === 'true';

  if (!hasConsent) {
    banner.classList.add('cookie-banner--visible');
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(storageKey, 'true');
    banner.classList.remove('cookie-banner--visible');
  });
}

function scrollToHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const checkinInput = document.getElementById('checkin-input');
  if (checkinInput) {
    setTimeout(() => checkinInput.focus(), 300);
  }
}

function initHeaderBookingScroll() {
  const bookingBtn = document.querySelector('.header__booking-btn');
  if (bookingBtn) {
    bookingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToHero();
    });
  }
}

function initHeaderNavFixed() {
  const nav = document.querySelector('.header__nav');
  const headerTop = document.querySelector('.header__top');
  if (!nav || !headerTop) return;

  const onScroll = () => {
    const isDesktop = window.innerWidth > 768;
    const trigger = headerTop.offsetHeight || 92;
    if (isDesktop && window.scrollY > trigger) {
      nav.classList.add('is-fixed');
      document.body.classList.add('has-fixed-nav');
    } else {
      nav.classList.remove('is-fixed');
      document.body.classList.remove('has-fixed-nav');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

function initNotFoundBack() {
  const backBtn = document.getElementById('notFoundBack');
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  });
}

function initPrivacyBack() {
  const backBtn = document.getElementById('privacyBack');
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  });
}

function initAdminBack() {
  const backBtn = document.getElementById('adminBack');
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  });
}

function initAdminSelect() {
  const selects = document.querySelectorAll('[data-admin-select]');
  selects.forEach(select => {
    const control = select.querySelector('.admin-select__control');
    const list = select.querySelector('.admin-select__list');
    const valueEl = select.querySelector('[data-admin-select-value]');
    const hiddenInput = select.querySelector('input[type="hidden"]');

    if (!control || !list || !valueEl || !hiddenInput) return;

    const closeSelect = () => {
      select.classList.remove('admin-select--open');
      control.setAttribute('aria-expanded', 'false');
    };

    control.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = select.classList.toggle('admin-select--open');
      control.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    list.addEventListener('click', (e) => {
      const option = e.target.closest('.admin-select__option');
      if (!option) return;
      valueEl.textContent = option.textContent;
      hiddenInput.value = option.dataset.value || '';
      closeSelect();
    });

    document.addEventListener('click', (e) => {
      if (!select.contains(e.target)) {
        closeSelect();
      }
    });
  });
}

function initAdminCounters() {
  const counters = document.querySelectorAll('[data-admin-counter]');
  counters.forEach(counter => {
    const valueEl = counter.querySelector('.admin-counter__value');
    const minusBtn = counter.querySelector('[data-action="minus"]');
    const plusBtn = counter.querySelector('[data-action="plus"]');
    const min = parseInt(counter.dataset.min || '0', 10);

    // Все счетчики имеют максимум 15
    const maxValue = 15;

    const updateValue = () => {
      if (valueEl) {
        let value = parseInt(valueEl.value) || 0;
        if (value < min) value = min;
        if (value > maxValue) value = maxValue;
        valueEl.value = value;
        counter.dataset.value = String(value);
      }
    };

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        if (valueEl) {
          let value = parseInt(valueEl.value) || 0;
          if (value > min) {
            value -= 1;
            valueEl.value = value;
            counter.dataset.value = String(value);
          }
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        if (valueEl) {
          let value = parseInt(valueEl.value) || 0;
          if (value < maxValue) {
            value += 1;
            valueEl.value = value;
            counter.dataset.value = String(value);
          }
        }
      });
    }

    // Обработка ввода с клавиатуры
    if (valueEl) {
      valueEl.addEventListener('input', () => {
        updateValue();
      });

      valueEl.addEventListener('blur', () => {
        updateValue();
      });

      valueEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          updateValue();
          valueEl.blur();
        }
      });

      // Инициализация значения
      updateValue();
    }
  });
}

function updateAdminDaysCount() {
  const daysEl = document.querySelector('[data-admin-days]');
  const checkinInput = document.getElementById('adminCheckin');
  const checkoutInput = document.getElementById('adminCheckout');
  if (!daysEl || !checkinInput || !checkoutInput) return;

  const parseDate = (value) => {
    if (!value) return null;
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(part => parseInt(part, 10));
    if (!day || !month || !year) return null;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const checkin = parseDate(checkinInput.value);
  const checkout = parseDate(checkoutInput.value);
  if (!checkin || !checkout || checkout <= checkin) {
    daysEl.textContent = '0';
    return;
  }

  const diff = Math.round((checkout - checkin) / (1000 * 60 * 60 * 24));
  daysEl.textContent = String(diff);
}

function initAdminPanel() {
  const adminRoot = document.querySelector('.admin');
  if (!adminRoot) return;

  const tabs = adminRoot.querySelectorAll('[data-admin-room-tab]');
  const calendarsEl = adminRoot.querySelector('[data-admin-calendars]');
  const bookingsBody = adminRoot.querySelector('[data-admin-bookings-body]');
  const totalEl = adminRoot.querySelector('[data-admin-total]');
  const yearEl = adminRoot.querySelector('[data-admin-year]');
  const checkinInput = document.getElementById('adminCheckin');
  const checkoutInput = document.getElementById('adminCheckout');

  if (!calendarsEl || !bookingsBody || !totalEl) return;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  const formatShortDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('ru-RU');
  };

  const getActiveRoomId = () => {
    const active = adminRoot.querySelector('.admin-tabs__btn--active');
    return active ? active.dataset.roomId : null;
  };

  const setStaticCalendar = (roomId) => {
    if (!calendarsEl || calendarsEl.dataset.adminStatic !== 'true') return;
    const calendars = Array.from(calendarsEl.querySelectorAll('.admin-calendar'));
    if (!calendars.length) return;
    const activeIndex = Math.max(0, Number(roomId || 1) - 1);
    calendars.forEach((calendar, index) => {
      calendar.classList.toggle('is-active', index === activeIndex);
    });
  };

  const getBookingsForRoom = (roomId) => {
    // Сначала пытаемся получить данные из data-атрибутов табов
    const activeTab = adminRoot.querySelector('.admin-tabs__btn--active');
    if (activeTab && activeTab.dataset.roomBookings) {
      try {
        const bookings = JSON.parse(activeTab.dataset.roomBookings);
        if (roomId) {
          return bookings.filter(booking => String(booking.roomId || '') === String(roomId));
        }
        return bookings;
      } catch (e) {
      }
    }
    
    // Если не удалось получить данные из data-атрибутов, возвращаем пустой массив
    return [];
  };

  const renderCalendars = (roomId) => {
    // Всегда перегенерируем календари при смене таба
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    
    // Генерируем все 12 месяцев текущего года (с января по декабрь)
    const months = Array.from({ length: 12 }, (_, idx) => new Date(currentYear, idx, 1));
    
    // Получаем бронирования для текущего номера
    const bookings = getBookingsForRoom(roomId);

    calendarsEl.innerHTML = months.map(monthDate => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const offset = (firstDay.getDay() + 6) % 7; // Понедельник = 0
      
      // Получаем последние дни предыдущего месяца
      const prevMonthDays = new Date(year, month, 0).getDate();
      
      // Получаем количество дней для следующего месяца
      const totalDaysShown = offset + daysInMonth;
      const nextMonthDays = totalDaysShown <= 35 ? 35 - totalDaysShown : 42 - totalDaysShown;
      
      let daysHtml = '';

      // Дни предыдущего месяца
      for (let i = offset - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        daysHtml += `<div class="admin-calendar__day admin-calendar__day--muted">${day}</div>`;
      }

      // Дни текущего месяца
      for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
        const date = new Date(year, month, dayNumber);
        date.setHours(0, 0, 0, 0);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        
        // Проверяем забронирована ли дата
        const isBooked = bookings.some(booking => {
          if (!booking.checkin || !booking.checkout) return false;
          return dateStr >= booking.checkin && dateStr < booking.checkout;
        });
        
        const isFuture = date >= today;
        let className = 'admin-calendar__day';
        
        if (isBooked) {
          className += ' admin-calendar__day--booked';
        } else if (isFuture) {
          className += ' admin-calendar__day--free';
        }
        
        daysHtml += `<div class="${className}" data-date="${dateStr}">${dayNumber}</div>`;
      }

      // Дни следующего месяца
      for (let i = 1; i <= nextMonthDays; i++) {
        daysHtml += `<div class="admin-calendar__day admin-calendar__day--muted">${i}</div>`;
      }

      return `
        <div class="admin-calendar">
          <div class="admin-calendar__title">${monthNames[month]}, ${year}</div>
          <div class="admin-calendar__weekdays">
            ${weekdays.map(day => `<div class="admin-calendar__weekday">${day}</div>`).join('')}
          </div>
          <div class="admin-calendar__days">
            ${daysHtml}
          </div>
        </div>
      `;
    }).join('');
  };

  const renderBookings = (roomId) => {
    // Всегда перегенерируем таблицу бронирований при смене таба
    const bookings = getBookingsForRoom(roomId);

    if (!bookings.length) {
      bookingsBody.innerHTML = '<div class="admin-table__empty">Нет броней</div>';
      totalEl.textContent = '0';
      return;
    }

    let totalSum = 0;
    bookingsBody.innerHTML = bookings.map((booking, index) => {
      const checkin = booking.checkin ? new Date(`${booking.checkin}T00:00:00`) : null;
      const checkout = booking.checkout ? new Date(`${booking.checkout}T00:00:00`) : null;
      const nights = checkin && checkout ? Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)) : 0;
      const pricePerNight = Number(booking.price || 0);
      const totalPrice = Number(booking.total || booking.totalPrice || booking.priceTotal || pricePerNight || 0);
      totalSum += totalPrice || 0;

      // Поддержка разных форматов данных
      const guestName = booking.guest?.name || booking.guest || booking.name || '—';
      const guestCity = booking.city || '—';
      const guestsCount = booking.guests?.adults 
        ? `${booking.guests.adults + (booking.guests.children || 0)}`
        : booking.guests || booking.guestsCount || '—';

      return `
        <div class="admin-table__row" data-booking-id="${booking.id || index + 1}">
          <span class="admin-table__id">
            <img src="/img/svg/icon-change.svg" alt="" class="admin-table__edit-icon">
            ${booking.id || index + 1}
          </span>
          <span>${guestName}</span>
          <span>${guestCity}</span>
          <span>${checkin ? formatShortDate(checkin) : '—'}</span>
          <span>${checkout ? formatShortDate(checkout) : '—'}</span>
          <span>${guestsCount}</span>
          <span>${formatNumber(totalPrice)}</span>
          <span>${booking.comment || '—'}</span>
          <button type="button" class="admin-table__delete" aria-label="Удалить" data-admin-delete data-booking-id="${booking.id || index + 1}">
            <img src="/img/svg/icon-admin-delete.svg" alt="">
          </button>
        </div>
      `;
    }).join('');

    totalEl.textContent = formatNumber(totalSum);
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('admin-tabs__btn--active'));
      tab.classList.add('admin-tabs__btn--active');
      const roomId = tab.dataset.roomId || null;
      renderCalendars(roomId);
      renderBookings(roomId);
      setStaticCalendar(roomId);
      
      // Примечание: не вызываем datepicker.update() так как это вызывает ошибку 
      // "can't access property destroy, this.nav is undefined" в AirDatepicker
      // Календарь будет использовать данные из формы при следующем открытии
    });
  });

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  updateAdminDaysCount();
  renderCalendars(getActiveRoomId());
  renderBookings(getActiveRoomId());
  setStaticCalendar(getActiveRoomId());

  if (checkinInput) {
    checkinInput.addEventListener('change', updateAdminDaysCount);
    checkinInput.addEventListener('blur', updateAdminDaysCount);
  }
  if (checkoutInput) {
    checkoutInput.addEventListener('change', updateAdminDaysCount);
    checkoutInput.addEventListener('blur', updateAdminDaysCount);
  }
}

function initPreloader() {
  const preloader = document.getElementById('sitePreloader');
  if (!preloader) return;
  window.addEventListener('load', () => {
    preloader.classList.add('preloader--hidden');
  });
}


// Initialize Fancybox (v5 like hodlerexchange)
if (typeof Fancybox !== 'undefined') {
  // Fancybox v5 has defaults
  Fancybox.defaults.mainClass = 'fancybox-custom';
  Fancybox.defaults.trapFocus = false;
  Fancybox.defaults.autoFocus = false;
  Fancybox.defaults.placeFocusBack = false;
  
  // Очищаем календарь при закрытии модалки и инициализируем маску телефона при открытии
  Fancybox.defaults.on = {
    close: () => {
      if (window.roomModalFancyboxDatePicker) {
        try {
          window.roomModalFancyboxDatePicker.destroy();
        } catch (e) {
          console.warn('Error destroying datepicker on close:', e);
        }
        window.roomModalFancyboxDatePicker = null;
      }
    },
    reveal: () => {
      // Инициализируем маску телефона при открытии любого модального окна
      setTimeout(() => {
        const content = document.querySelector('.fancybox__content');
        if (content) {
          const phoneInputs = content.querySelectorAll('input[type="tel"]');
          phoneInputs.forEach(input => {
            delete input.dataset.phoneMaskInitialized;
            applyPhoneMask(input);
          });
          // Дополнительно ищем поле bookingPhone
          const bookingPhone = document.getElementById('bookingPhone');
          if (bookingPhone && !bookingPhone.dataset.phoneMaskInitialized) {
            delete bookingPhone.dataset.phoneMaskInitialized;
            applyPhoneMask(bookingPhone);
          }
        }
      }, 100);
    }
  };
  window.Fancybox = Fancybox;

  // Глобальное делегирование для счетчиков в модалках (работает для всех модалок)
  if (!window.modalCountersGlobalHandlerInitialized) {
    window.modalCountersGlobalHandlerInitialized = true;
    document.addEventListener('click', (e) => {
      const target = e.target;
      // Проверяем, что клик был внутри модалки
      const modalContent = target.closest('.fancybox__content, .modal__content');
      if (!modalContent) return;
      
      if (target.matches('[data-counter-minus], .modal__counter-btn--minus, [data-counter-plus], .modal__counter-btn--plus')) {
        e.preventDefault();
        e.stopPropagation();
        
        const wrapper = target.closest('.modal__form-counter-group') || target.closest('.room-modal__counter-group') || target.closest('.modal__counter');
        if (!wrapper) return;
        
        const valueEl = wrapper.querySelector('[data-counter-value], .modal__counter-value');
        if (!valueEl) return;
        
        // Все счетчики имеют максимум 15
        const maxValue = 15;
        const minValue = 0;
        let value = parseInt(valueEl.value) || 0;
        
        if (target.matches('[data-counter-minus], .modal__counter-btn--minus')) {
          if (value > minValue) {
            value--;
            valueEl.value = value;
          }
        } else if (target.matches('[data-counter-plus], .modal__counter-btn--plus')) {
          if (value < maxValue) {
            value++;
            valueEl.value = value;
          }
        }
      }
    });
  }

  // Helper function to initialize modal content
  function initModalContent() {
    const content = document.querySelector('.fancybox__content');
    if (!content) return;

    // Re-initialize phone mask in modal
    // Используем setTimeout для гарантии, что контент полностью загружен
    setTimeout(() => {
      // Ищем все поля телефона в модальном окне
      const phoneInputs = content.querySelectorAll('input[type="tel"]');
      phoneInputs.forEach(input => {
        // Сбрасываем флаг инициализации, если элемент был пересоздан
        delete input.dataset.phoneMaskInitialized;
        applyPhoneMask(input);
      });
      
      // Дополнительно ищем поле bookingPhone по ID (для модального окна "забронировать номер")
      const bookingPhone = document.getElementById('bookingPhone');
      if (bookingPhone && !bookingPhone.dataset.phoneMaskInitialized) {
        delete bookingPhone.dataset.phoneMaskInitialized;
        applyPhoneMask(bookingPhone);
      }
    }, 150);

    // Счетчики в модалках обрабатываются глобальным делегированием на document (см. выше)
    
    // Initialize Swiper for room modal slider
    const roomModalSlider = content.querySelector('.room-modal__slider');
    if (roomModalSlider && typeof Swiper !== 'undefined') {
      try {
        const { Navigation, Pagination } = window.SwiperModules || {};
        new Swiper(roomModalSlider, {
          modules: [Navigation, Pagination],
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          navigation: {
            nextEl: content.querySelector('.room-modal__slider-btn--next'),
            prevEl: content.querySelector('.room-modal__slider-btn--prev'),
          },
          pagination: {
            el: content.querySelector('.room-modal__slider-pagination'),
            clickable: true,
            type: 'bullets',
          },
        });
      } catch (err) {
        console.error('Error initializing room modal slider:', err);
      }
    }
    
    // Store selected dates for booking
    let selectedCheckin = null;
    let selectedCheckout = null;
    
    // Initialize AirDatepicker for room modal calendar
    // Удаляем старый календарь, если он существует
    const calendarContainer = content.querySelector('.room-modal__calendar-container');
    if (calendarContainer && typeof AirDatepicker !== 'undefined') {
      try {
        // Удаляем все дочерние элементы (старый календарь)
        calendarContainer.innerHTML = '';
        
        // Проверяем, есть ли уже datepicker в этом контейнере и удаляем его
        if (window.roomModalFancyboxDatePicker) {
          try {
            window.roomModalFancyboxDatePicker.destroy();
          } catch (e) {
            console.warn('Error destroying old datepicker:', e);
          }
          window.roomModalFancyboxDatePicker = null;
        }
        
        // Get bookings from data attribute
        const bookingsData = calendarContainer.dataset.roomBookings;
        let bookings = [];
        if (bookingsData) {
          try {
            bookings = JSON.parse(bookingsData);
          } catch (e) {
            bookings = [];
          }
        }
        
        window.roomModalFancyboxDatePicker = new AirDatepicker(calendarContainer, {
          inline: true,
          range: true,
          multipleDates: false,
          minDate: new Date(),
          buttons: [],
          locale: {
            days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
            daysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            daysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            today: 'Сегодня',
            clear: 'Очистить',
            dateFormat: 'dd.MM.yyyy',
            timeFormat: 'HH:mm',
            firstDay: 1
          },
          onSelect: ({ date, formattedDate }) => {
            // Save selected dates
            if (Array.isArray(date) && date.length === 2) {
              selectedCheckin = formattedDate[0];
              selectedCheckout = formattedDate[1];
            } else if (date) {
              selectedCheckin = formattedDate;
              selectedCheckout = null;
            }
          },
          onRenderCell: ({ date, cellType }) => {
            if (cellType === 'day') {
              const dateStr = date.toISOString().split('T')[0];
              const isBooked = bookings.some(booking => 
                dateStr >= booking.checkin && dateStr < booking.checkout
              );
              if (isBooked) {
                return {
                  disabled: true,
                  classes: 'room-modal__calendar-day--booked'
                };
              }
            }
          }
        });
      } catch (err) {
        console.error('Error initializing room modal calendar:', err);
        window.roomModalFancyboxDatePicker = null;
      }
    }
    
    // Handle "Book" button click - close room modal and open booking modal
    const bookBtn = content.querySelector('#roomModalBook');
    if (bookBtn) {
      // Удаляем старые обработчики перед добавлением нового
      const newBookBtn = bookBtn.cloneNode(true);
      bookBtn.parentNode.replaceChild(newBookBtn, bookBtn);
      
      newBookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Store selected dates in sessionStorage for booking modal
        if (selectedCheckin) {
          sessionStorage.setItem('bookingCheckin', selectedCheckin);
        }
        if (selectedCheckout) {
          sessionStorage.setItem('bookingCheckout', selectedCheckout);
        }
        
        // Close current Fancybox and open booking modal
        Fancybox.close();
        
        // Open booking modal after a small delay
        setTimeout(() => {
          Fancybox.show([{
            src: '/dialogs/booking-modal.html',
            type: 'ajax'
          }], {
            dragToClose: false,
            mainClass: 'fancybox-custom fancybox-modal',
            on: {
              done: () => {
                // Используем небольшую задержку для гарантии загрузки контента
                setTimeout(() => {
                  initModalContent();
                  // Fill in the dates from sessionStorage
                  const checkinInput = document.querySelector('#bookingCheckin');
                  const checkoutInput = document.querySelector('#bookingCheckout');
                  const savedCheckin = sessionStorage.getItem('bookingCheckin');
                  const savedCheckout = sessionStorage.getItem('bookingCheckout');
                  if (checkinInput && savedCheckin) {
                    checkinInput.value = savedCheckin;
                  }
                  if (checkoutInput && savedCheckout) {
                    checkoutInput.value = savedCheckout;
                  }
                }, 100);
              },
              reveal: () => {
                // Дополнительная инициализация при полном открытии модального окна
                setTimeout(() => {
                  initModalContent();
                }, 50);
              }
            }
          });
        }, 100);
      });
    }
  }

  // Bind Fancybox for galleries
  Fancybox.bind('[data-fancybox]');

  // Bind Fancybox for dialogs with AJAX loading (like hodlerexchange)
  Fancybox.bind('[data-fancybox-dialog]', {
    dragToClose: false,
    defaultType: 'ajax',
    closeClick: 'outside', // Close when clicking outside the modal content
    on: {
      done: () => {
        // Используем небольшую задержку для гарантии загрузки контента
        setTimeout(() => {
          initModalContent();
        }, 100);
      },
      reveal: () => {
        // Дополнительная инициализация при полном открытии модального окна
        setTimeout(() => {
          initModalContent();
        }, 50);
      },
    },
  });
}

// Initialize Swiper sliders
function initSliders() {
  if (typeof Swiper === 'undefined') return;

  // Rooms tabs slider
  const roomsTabsSlider = document.querySelector('[data-slider="rooms-tabs"]');
  if (roomsTabsSlider) {
    const swiper = roomsTabsSlider.querySelector('[data-slider-swiper="rooms-tabs"]');
    if (swiper) {
      const { FreeMode } = window.SwiperModules || {};
      new Swiper(swiper, {
        modules: FreeMode ? [FreeMode] : [],
        slidesPerView: 2.1,
        spaceBetween: 8,
        freeMode: {
          enabled: true,
          sticky: false, // Отключает привязку к краям слайдов
          momentum: true, // Добавляет инерцию при прокрутке
          momentumBounce: false, // Отключает отскок в конце
        },
      });

      // Handle tab clicks
      const tabs = roomsTabsSlider.querySelectorAll('[data-tab]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => {
            t.setAttribute('data-active', 'false');
            // t.classList.remove('bg-gradient-to-b', 'from-primary', 'to-primary-dark', 'text-white');
            // t.classList.add('bg-bg-light-green', 'text-black');
          });
          tab.setAttribute('data-active', 'true');
          // tab.classList.remove('bg-bg-light-green', 'text-black');
          // tab.classList.add('bg-gradient-to-b', 'from-primary', 'to-primary-dark', 'text-white');
          initRooms();
        });
      });
    }
  }

  // Gallery slider (fine-swiper)
  const fineSwiper = document.querySelector('.fine-swiper');
  if (fineSwiper && window.innerWidth > 768) {
    new Swiper(fineSwiper, {
      modules: [window.SwiperModules.Autoplay],
      slidesPerView: 'auto',
      spaceBetween: 40,
      loop: true,
      speed: 8000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
      },
      freeMode: false,
      centeredSlides: false,
      allowTouchMove: true,
    });
  }

  // Advantages slider
  const advantagesSwiper = document.querySelector('.advantages-swiper');
  if (advantagesSwiper) {
    const pagination = document.querySelector('.advantages-pagination');
    new Swiper(advantagesSwiper, {
      modules: [window.SwiperModules.Pagination, window.SwiperModules.Autoplay],
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 500,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: pagination ? {
        el: pagination,
        clickable: true,
        type: 'bullets',
      } : false,
    });
  }

  // Attractions slider (desktop only)
  const attractionsSlider = document.querySelector('[data-slider="attractions"]');
  if (attractionsSlider && window.innerWidth > 768) {
    const swiper = attractionsSlider.querySelector('[data-slider-swiper="attractions"]');
    if (swiper) {
      new Swiper(swiper, {
        slidesPerView: 'auto',
        spaceBetween: 20,
        loop: true,
        speed: 15000,
        autoplay: {
          delay: 0,
          disableOnInteraction: false,
        },
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initRooms();
  initRoomsTabs();
  initSliders();
  initCounters();
  initSmoothScroll();
  initDatePickers();
  initGallery();
  initAdvantages();
  initAttractions();
  initAttractionSliders();
  initAboutDropsParallax();
  initEntranceAnimations();
  initMobileMenu();
  // Modals are now handled via Fancybox
  // initModal, initLeadModal, initStatusModals, initConsentModal, initRoomModal are replaced by Fancybox
  initCookieBanner();
  initPhoneMask();
  initHeaderBookingScroll();
  initHeaderNavFixed();
  initNotFoundBack();
  initPrivacyBack();
  initAdminBack();
  initAdminSelect();
  initAdminCounters();
  initAdminPanel();
  initAdminDeleteModal();
  initPreloader();

  const modalCheckinInput = document.getElementById('modalCheckin');
  const modalCheckoutInput = document.getElementById('modalCheckout');
  if (modalCheckinInput) {
    modalCheckinInput.addEventListener('blur', syncRoomCalendarFromForm);
    modalCheckinInput.addEventListener('change', syncRoomCalendarFromForm);
  }
  if (modalCheckoutInput) {
    modalCheckoutInput.addEventListener('blur', syncRoomCalendarFromForm);
    modalCheckoutInput.addEventListener('change', syncRoomCalendarFromForm);
  }
});
