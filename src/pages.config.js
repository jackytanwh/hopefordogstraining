import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import ClientDetail from './pages/ClientDetail';
import EditClient from './pages/EditClient';
import BookingSystem from './pages/BookingSystem';
import BookService from './pages/BookService';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminBookings from './pages/AdminBookings';
import BookingCalendar from './pages/BookingCalendar';
import BookingDetail from './pages/BookingDetail';
import GroupClassScheduleSettings from './pages/GroupClassScheduleSettings';
import ThankYou from './pages/ThankYou';
import PaymentSuccess from './pages/PaymentSuccess';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "AddClient": AddClient,
    "ClientDetail": ClientDetail,
    "EditClient": EditClient,
    "BookingSystem": BookingSystem,
    "BookService": BookService,
    "BookingConfirmation": BookingConfirmation,
    "AdminBookings": AdminBookings,
    "BookingCalendar": BookingCalendar,
    "BookingDetail": BookingDetail,
    "GroupClassScheduleSettings": GroupClassScheduleSettings,
    "ThankYou": ThankYou,
    "PaymentSuccess": PaymentSuccess,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};