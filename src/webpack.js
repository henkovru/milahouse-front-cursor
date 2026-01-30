// Import air-datepicker - ВАЖНО: импортируем ДО main.scss, чтобы кастомные стили перезаписывали оригинальные
import 'air-datepicker/air-datepicker.css';
import AirDatepicker from 'air-datepicker';

// Import Swiper
import Swiper from 'swiper';
import { Navigation, Pagination, Scrollbar, Autoplay, Grid, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import Fancybox
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

// Import our styles - ПОСЛЕ библиотек, чтобы наши стили имели приоритет
import './scss/main.scss';

// Делаем доступными глобально для main.js
window.AirDatepicker = AirDatepicker;
window.Swiper = Swiper;
window.Fancybox = Fancybox;
window.SwiperModules = { Navigation, Pagination, Scrollbar, Autoplay, Grid, Thumbs, FreeMode };

// Import JavaScript modules
import './js/main.js';
