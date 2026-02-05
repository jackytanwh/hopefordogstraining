/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddClient from './pages/AddClient';
import AdminBookings from './pages/AdminBookings';
import BookService from './pages/BookService';
import BookingCalendar from './pages/BookingCalendar';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingDetail from './pages/BookingDetail';
import BookingSystem from './pages/BookingSystem';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import EditClient from './pages/EditClient';
import GroupClassScheduleSettings from './pages/GroupClassScheduleSettings';
import Home from './pages/Home';
import PaymentSuccess from './pages/PaymentSuccess';
import ThankYou from './pages/ThankYou';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddClient": AddClient,
    "AdminBookings": AdminBookings,
    "BookService": BookService,
    "BookingCalendar": BookingCalendar,
    "BookingConfirmation": BookingConfirmation,
    "BookingDetail": BookingDetail,
    "BookingSystem": BookingSystem,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "EditClient": EditClient,
    "GroupClassScheduleSettings": GroupClassScheduleSettings,
    "Home": Home,
    "PaymentSuccess": PaymentSuccess,
    "ThankYou": ThankYou,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};