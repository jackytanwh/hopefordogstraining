import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, PawPrint, Calendar, DollarSign, Save, Trash2, FileText, RefreshCw, Edit2, Clock, Package, GraduationCap, X, Ban } from "lucide-react";
import { format, parseISO } from "date-fns";
import BehaviouralModificationDetails from "../components/booking/BehaviouralModificationDetails";
import CanineAssessmentDetails from "../components/booking/CanineAssessmentDetails";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const timeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

const sundayTimeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"
];

export default function BookingDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [clientEdits, setClientEdits] = useState({});
  const [savingClient, setSavingClient] = useState(false);
  const [editingSessions, setEditingSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [groupSchedule, setGroupSchedule] = useState(null);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const bookingsData = await base44.entities.Booking.list();
      
      const foundBooking = bookingsData.find(b => b.id === bookingId);
      
      // Debug: Log session dates to check for was_rescheduled property
      if (foundBooking?.session_dates) {
        console.log('Session dates:', JSON.stringify(foundBooking.session_dates, null, 2));
      }
      
      setBooking(foundBooking);
      setAdminNotes(foundBooking?.admin_notes || '');
      setBookings(bookingsData.filter(b => b.booking_status !== 'cancelled' && b.id !== bookingId));
      
      // Load group schedule if needed
      if (foundBooking?.service_type === 'basic_manners_group_class') {
        try {
          const scheduleSettings = await base44.entities.Settings.filter({ setting_key: 'basic_manners_group_schedule' });
          if (scheduleSettings?.length > 0) setGroupSchedule(scheduleSettings[0].setting_value);
        } catch (e) { /* ignore */ }
      }
      
      // Try to load blocked slots (may fail for non-admin users)
      try {
        const blocksData = await base44.entities.BlockedSlot.list();
        setBlockedSlots(blocksData);
      } catch (error) {
        console.log('Unable to load blocked slots (may not have admin access):', error);
        setBlockedSlots([]);
      }
    } catch (error) {
      console.error("Error loading booking:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const oldBooking = { ...booking };
      
      const updateData = {
        booking_status: newStatus
      };
      
      // Set confirmation_date when status changes to confirmed
      if (newStatus === 'confirmed') {
        updateData.confirmation_date = new Date().toISOString();
      }
      
      await base44.entities.Booking.update(bookingId, updateData);
      
      // Reload to get updated booking
      await loadBooking();
      
      // Get the updated booking
      const bookings = await base44.entities.Booking.list();
      const updatedBooking = bookings.find(b => b.id === bookingId);
      
      // Send confirmation email and WhatsApp when status changes to confirmed
      if (updatedBooking && newStatus === 'confirmed') {
        try {
          await base44.functions.invoke('sendBookingConfirmation', { booking: updatedBooking });
          console.log('Booking confirmation (email + WhatsApp) sent');
        } catch (error) {
          console.error('Error sending booking confirmation:', error);
        }
      } else if (updatedBooking && updatedBooking.whatsapp_consent) {
        try {
          if (newStatus === 'cancelled') {
            await base44.functions.invoke('sendBookingCancellation', { booking: updatedBooking });
            console.log('WhatsApp cancellation notification sent');
          } else {
            await base44.functions.invoke('sendBookingUpdate', { 
              booking: updatedBooking, 
              oldBooking: oldBooking 
            });
            console.log('WhatsApp status update sent');
          }
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await base44.entities.Booking.update(bookingId, {
        admin_notes: adminNotes
      });
      await loadBooking();
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Send cancellation notification before deleting if consent was given (wrapped in try-catch)
      if (booking && booking.whatsapp_consent) {
        try {
          await base44.functions.invoke('sendBookingCancellation', { booking });
          console.log('WhatsApp cancellation notification sent');
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
          // Don't block deletion if WhatsApp fails
        }
      }
      
      await base44.entities.Booking.delete(bookingId);
      navigate(createPageUrl("AdminBookings"));
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const handleOpenReschedule = () => {
    if (booking.service_type === 'basic_manners_group_class') {
      // Use booking's own session_dates if available, otherwise derive from global schedule
      if (booking.session_dates && booking.session_dates.length > 0) {
        setEditingSessions(booking.session_dates.map(session => ({ ...session })));
      } else if (groupSchedule?.start_date) {
        const sessions = Array.from({ length: groupSchedule.weeks || 7 }, (_, i) => {
          const startDate = new Date(groupSchedule.start_date);
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + i * 7);
          return {
            session_number: i + 1,
            date: format(sessionDate, 'yyyy-MM-dd'),
            start_time: groupSchedule.start_time || '',
            end_time: groupSchedule.end_time || ''
          };
        });
        setEditingSessions(sessions);
      } else {
        setEditingSessions([]);
      }
    } else {
      setEditingSessions((booking.session_dates || []).map(session => ({ ...session })));
    }
    setShowRescheduleDialog(true);
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const isTimeSlotBooked = (date, startTime, sessionNumber) => {
    const dateString = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    const startMinutes = timeToMinutes(startTime);
    
    // Get session duration from booking
    const sessionDurationMinutes = 60; // Default 1 hour, adjust based on service
    const endMinutes = startMinutes + sessionDurationMinutes + 60; // Include buffer

    for (const otherBooking of bookings) {
      if (!otherBooking.session_dates) continue;

      for (const session of otherBooking.session_dates) {
        if (session.date === dateString && session.start_time && session.end_time) {
          const bookedStartMinutes = timeToMinutes(session.start_time);
          const bookedEndMinutes = timeToMinutes(session.end_time);
          const bookedEndWithBuffer = bookedEndMinutes + 60;

          if (
            (startMinutes >= bookedStartMinutes && startMinutes < bookedEndWithBuffer) ||
            (endMinutes > bookedStartMinutes && endMinutes <= bookedEndWithBuffer) ||
            (startMinutes <= bookedStartMinutes && endMinutes >= bookedEndWithBuffer)
          ) {
            return true;
          }
        }
      }
    }

    // Check blocked slots
    const dateBlocks = blockedSlots.filter(block => block.date === dateString);
    for (const block of dateBlocks) {
      if (block.is_full_day) return true;
      
      if (block.start_time && block.end_time) {
        const blockStart = timeToMinutes(block.start_time);
        const blockEnd = timeToMinutes(block.end_time);
        
        if (
          (startMinutes >= blockStart && startMinutes < blockEnd) ||
          (endMinutes > blockStart && endMinutes <= blockEnd) || // Changed `endEnd` to `endMinutes`
          (startMinutes <= blockStart && endMinutes >= blockEnd)
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const getAvailableTimeSlots = (date) => {
    if (!date) return [];
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dayOfWeek = dateObj.getDay();
    
    const baseSlots = dayOfWeek === 0 ? sundayTimeSlots : timeSlots;
    
    return baseSlots;
  };

  const handleSessionDateChange = (sessionIndex, date) => {
    const newSessions = [...editingSessions];
    newSessions[sessionIndex] = {
      ...newSessions[sessionIndex],
      date: format(date, 'yyyy-MM-dd')
    };
    setEditingSessions(newSessions);
  };

  const handleSessionTimeChange = (sessionIndex, startTime) => {
    const newSessions = [...editingSessions];
    const startMinutes = timeToMinutes(startTime);
    
    // Calculate end time based on service duration (default 1 hour)
    const durationMinutes = 60;
    const endTime = minutesToTime(startMinutes + durationMinutes);
    
    newSessions[sessionIndex] = {
      ...newSessions[sessionIndex],
      start_time: startTime,
      end_time: endTime
    };
    setEditingSessions(newSessions);
  };

  const handleSaveReschedule = async () => {
    setSaving(true);
    try {
      // For ALL bookings (including group class), save session_dates directly on the booking
      const originalSessions = booking.session_dates || [];
      const updatedEditingSessions = editingSessions.map((editedSession, index) => {
        const originalSession = originalSessions[index];
        if (!originalSession || editedSession.date !== originalSession.date || editedSession.start_time !== originalSession.start_time) {
          return { ...editedSession, was_rescheduled: true };
        }
        return editedSession;
      });

      await base44.entities.Booking.update(bookingId, {
        session_dates: updatedEditingSessions
      });
      
      await loadBooking();
      setShowRescheduleDialog(false);
      
      // Send WhatsApp notification if consent was given
      if (booking.whatsapp_consent) {
        try {
          const updatedBooking = { ...booking, session_dates: updatedEditingSessions };
          await base44.functions.invoke('sendBookingUpdate', { 
            booking: updatedBooking, 
            oldBooking: booking 
          });
          console.log('WhatsApp reschedule notification sent');
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }
    } catch (error) {
      console.error("Error rescheduling sessions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (idx) => {
    const updated = (booking.session_dates || []).filter((_, i) => i !== idx);
    await base44.entities.Booking.update(bookingId, { session_dates: updated });
    await loadBooking();
  };

  const handleToggleCancelSession = async (idx) => {
    const updated = (booking.session_dates || []).map((s, i) =>
      i === idx ? { ...s, session_cancelled: !s.session_cancelled } : s
    );
    await base44.entities.Booking.update(bookingId, { session_dates: updated });
    await loadBooking();
  };

  // Helper function to safely get client field value

  // Helper function to safely get furkid field value, checking common variations
  const getFurkidField = (furkid, field) => {
    if (!furkid) return 'N/A';
    
    const hasValue = (v) => v !== undefined && v !== null && v !== '';

    // Try direct access with original field name
    if (hasValue(furkid[field])) return furkid[field];
    
    // Try without 'furkid' prefix (e.g., 'furkidName' -> 'name')
    const fieldWithoutPrefix = field.startsWith('furkid') ? 
      field.substring(6).charAt(0).toLowerCase() + field.substring(7) : field;
    if (hasValue(furkid[fieldWithoutPrefix])) return furkid[fieldWithoutPrefix];
    
    // Try with underscore format (e.g., 'furkidName' -> 'furkid_name')
    const underscoreField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (hasValue(furkid[underscoreField])) return furkid[underscoreField];
    
    return 'N/A';
  };

  const handleEditClientStart = () => {
    if (isFYOG && booking.clients && booking.clients.length > 0) {
      setClientEdits({ clients: booking.clients.map(c => ({ ...c })) });
    } else {
      setClientEdits({
        client_name: booking.client_name || '',
        client_email: booking.client_email || '',
        client_mobile: booking.client_mobile || '',
        client_address: booking.client_address || '',
        client_postal_code: booking.client_postal_code || '',
      });
    }
    setEditingClient(true);
  };

  const handleSaveClientInfo = async () => {
    setSavingClient(true);
    try {
      if (isFYOG && clientEdits.clients) {
        await base44.entities.Booking.update(bookingId, { clients: clientEdits.clients });
      } else {
        await base44.entities.Booking.update(bookingId, {
          client_name: clientEdits.client_name,
          client_email: clientEdits.client_email,
          client_mobile: clientEdits.client_mobile,
          client_address: clientEdits.client_address,
          client_postal_code: clientEdits.client_postal_code,
        });
      }
      await loadBooking();
      setEditingClient(false);
    } catch (error) {
      console.error('Error saving client info:', error);
    } finally {
      setSavingClient(false);
    }
  };

  // Add items given management functions
  const handleKinderPuppyItemsUpdate = async (itemKey, checked) => {
    if (!booking) return;
    
    const updatedItems = {
      ...(booking.kinder_puppy_items_given || {}),
      [itemKey]: checked
    };
    
    await base44.entities.Booking.update(bookingId, {
      kinder_puppy_items_given: updatedItems
    });
    
    await loadBooking();
  };

  const handleBasicMannersItemsUpdate = async (itemKey, checked) => {
    if (!booking) return;
    
    const updatedItems = {
      ...(booking.basic_manners_items_given || {}),
      [itemKey]: checked
    };
    
    await base44.entities.Booking.update(bookingId, {
      basic_manners_items_given: updatedItems
    });
    
    await loadBooking();
  };

  // Add curriculum update function
  const handleCurriculumUpdate = async (weekKey, itemKey, checked) => {
    if (!booking) return;
    
    let progressField;
    if (booking.service_type === 'kinder_puppy_in_home' || booking.service_type === 'kinder_puppy_fyog') {
      progressField = 'kinder_puppy_progress';
    } else if (booking.service_type === 'basic_manners_in_home' || booking.service_type === 'basic_manners_fyog') {
      progressField = 'basic_manners_progress';
    } else if (booking.service_type === 'group_class_basic_manners') {
      progressField = 'basic_manners_group_class_progress';
    } else if (booking.service_type === 'adore_hdb_approval') {
      progressField = 'adore_hdb_progress';
    }
    else {
      return;
    }
    
    const updatedProgress = {
      ...(booking[progressField] || {}),
      [weekKey]: {
        ...(booking[progressField]?.[weekKey] || {}),
        [itemKey]: checked
      }
    };
    
    await base44.entities.Booking.update(bookingId, {
      [progressField]: updatedProgress
    });
    
    await loadBooking();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Booking Not Found</h1>
        <Button onClick={() => navigate(createPageUrl("AdminBookings"))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  // Check if this booking uses multi-client/furkid arrays
  const isFYOG = booking.service_type === 'kinder_puppy_fyog' || 
                 booking.service_type === 'basic_manners_fyog' || 
                 booking.service_type === 'basic_manners_group_class' ||
                 booking.service_type === 'group_class_basic_manners' ||
                 (booking.clients && booking.clients.length > 0) ||
                 (booking.furkids && booking.furkids.length > 0);

  // Check if this service has items to give
  const hasKinderPuppyItems = booking.service_type === 'kinder_puppy_in_home' || booking.service_type === 'kinder_puppy_fyog';
  const hasBasicMannersItems = booking.service_type === 'basic_manners_in_home';
  const hasBasicMannersFYOGItems = booking.service_type === 'basic_manners_fyog' || booking.service_type === 'group_class_basic_manners'; // Also for group class basic manners
  
  // Check if this service has curriculum
  const hasKinderPuppyCurriculum = booking.service_type === 'kinder_puppy_in_home' || booking.service_type === 'kinder_puppy_fyog';
  const hasBasicMannersCurriculum = booking.service_type === 'basic_manners_in_home' || booking.service_type === 'basic_manners_fyog';
  const hasBasicMannersFYOGCurriculum = false; // replaced by 6-week Basic Manners curriculum below
  const hasBasicMannersGroupClassCurriculum = booking.service_type === 'group_class_basic_manners'; // New curriculum type
  const hasAdoreHDBCurriculum = booking.service_type === 'adore_hdb_approval';

  // Kinder Puppy Curriculum Data
  const kinderPuppyCurriculum = {
    week1: {
      title: 'Session 1',
      items: [
        { key: 'intro_theory', label: 'Intro Theory' },
        { key: 'name_recognition', label: 'Name Recognition' },
        { key: 'leash_collar', label: 'Leash & Collar' },
        { key: 'intro_walks', label: 'Intro to Walks' },
        { key: 'sit_cue_part1', label: 'Sit Cue Part 1' }
      ]
    },
    week2: {
      title: 'Session 2',
      items: [
        { key: 'intro_walks_advanced', label: 'Intro to Walks (Advanced)' },
        { key: 'sit_cue_part2', label: 'Sit Cue Part 2' },
        { key: 'recall_exercise', label: 'Recall Exercise' },
        { key: 'down_cue_part1', label: 'Down Cue Part 1' },
        { key: 'chin_rest_part1', label: 'Chin Rest Part 1' },
        { key: 'handling_grooming', label: 'Handling & Grooming' }
      ]
    },
    week3: {
      title: 'Session 3',
      items: [
        { key: 'down_cue_part2', label: 'Down Cue Part 2' },
        { key: 'chin_rest_part2', label: 'Chin Rest Part 2' },
        { key: 'grooming_tools', label: 'Grooming Tools' },
        { key: 'dental_cleaning_part1', label: 'Dental Cleaning Part 1' },
        { key: 'cone_muzzle_part1', label: 'Cone/Muzzle Part 1' },
        { key: 'showering', label: 'Showering' }
      ]
    },
    week4: {
      title: 'Session 4',
      items: [
        { key: 'dental_cleaning_part2', label: 'Dental Cleaning Part 2' },
        { key: 'novelty_objects', label: 'Novelty Objects' },
        { key: 'scary_sounds', label: 'Scary Sounds' },
        { key: 'cone_muzzle_part2', label: 'Cone/Muzzle Part 2' },
        { key: 'household_appliances', label: 'Household Appliances' },
        { key: 'vet_visit', label: 'Vet Visit' }
      ]
    }
  };

  // Basic Manners Curriculum Data
  const basicMannersCurriculum = {
    week1: {
      title: 'Session 1',
      items: [
        { key: 'check_in_1', label: 'Check-in Part 1' },
        { key: 'lets_go_1', label: "Let's Go Part 1" },
        { key: 'sit_lure', label: 'Sit with Lure' },
        { key: 'scatter_feeding', label: 'Scatter Feeding' },
        { key: 'body_language_theory', label: 'Body Language Theory' }
      ]
    },
    week2: {
      title: 'Session 2',
      items: [
        { key: 'pattern_game_1', label: 'Pattern Game 1' },
        { key: 'lets_go_2', label: "Let's Go Part 2" },
        { key: 'sit_verbal', label: 'Sit with Verbal Cue' },
        { key: 'check_in_2', label: 'Check-in Part 2' },
        { key: 'down_lure', label: 'Down with Lure' }
      ]
    },
    week3: {
      title: 'Session 3',
      items: [
        { key: 'pattern_game_2', label: 'Pattern Game 2' },
        { key: 'down_verbal', label: 'Down with Verbal Cue' },
        { key: 'anchor_cue_1', label: 'Anchor Cue Part 1' },
        { key: 'down_stay_duration', label: 'Down-Stay (Duration)' },
        { key: 'leave_it_1', label: 'Leave It Part 1' }
      ]
    },
    week4: {
      title: 'Session 4',
      items: [
        { key: 'pattern_game_3', label: 'Pattern Game 3' },
        { key: 'anchor_cue_2', label: 'Anchor Cue Part 2' },
        { key: 'down_stay_distance', label: 'Down-Stay (Distance)' },
        { key: 'leave_it_2', label: 'Leave It Part 2' }
      ]
    },
    week5: {
      title: 'Session 5',
      items: [
        { key: 'pattern_game_4', label: 'Pattern Game 4' },
        { key: 'down_stay_distractions', label: 'Down-Stay with Distractions' },
        { key: 'double_recall_1', label: 'Double Recall Part 1' },
        { key: 'recall_sit', label: 'Recall to Sit' },
        { key: 'leave_it_3', label: 'Leave It Triangle of Success' }
      ]
    },
    week6: {
      title: 'Session 6',
      items: [
        { key: 'pattern_game_5', label: 'Pattern Game 5' },
        { key: 'recall_sit_distance', label: 'Recall to Sit (Distance)' },
        { key: 'down_stay_proof', label: 'Down-Stay Proofing' },
        { key: 'leave_it_proof', label: 'Leave It Proofing' }
      ]
    }
  };

  // Basic Manners FYOG Curriculum Data
  const basicMannersFYOGCurriculum = {
    week1: {
      title: 'Session 1',
      items: [
        { key: 'lets_go_1', label: "Let's Go Part 1" },
        { key: 'sit_lure', label: 'Sit with Lure' },
        { key: 'body_language', label: 'Body Language Theory' },
        { key: 'check_in_1', label: 'Check-in Part 1' },
        { key: 'discussion', label: 'Discussion' }
      ]
    },
    week2: {
      title: 'Session 2',
      items: [
        { key: 'pattern_game_1', label: 'Pattern Game 1' },
        { key: 'lets_go_2', label: "Let's Go Part 2" },
        { key: 'sit_verbal', label: 'Sit with Verbal Cue' },
        { key: 'down_lure', label: 'Down with Lure' },
        { key: 'check_in_proof', label: 'Check-in Proof' }
      ]
    },
    week3: {
      title: 'Session 3',
      items: [
        { key: 'pattern_game_2', label: 'Pattern Game 2' },
        { key: 'lets_go_uturn', label: "Let's Go U-turn" },
        { key: 'down_verbal', label: 'Down with Verbal Cue' },
        { key: 'down_stay_duration', label: 'Down-Stay (Duration)' },
        { key: 'anchor_cue_1', label: 'Anchor Cue Part 1' }
      ]
    },
    week4: {
      title: 'Session 4',
      items: [
        { key: 'pattern_game_3', label: 'Pattern Game 3' },
        { key: 'lets_go_pace', label: "Let's Go Pace" },
        { key: 'down_stay_distance', label: 'Down-Stay (Distance)' },
        { key: 'anchor_proof', label: 'Anchor Proof' },
        { key: 'leave_it_1', label: 'Leave It Part 1' }
      ]
    },
    week5: {
      title: 'Session 5',
      items: [
        { key: 'pattern_game_4', label: 'Pattern Game 4' },
        { key: 'down_stay_distractions', label: 'Down-Stay with Distractions' },
        { key: 'double_recall', label: 'Double Recall' },
        { key: 'recall_sit_5m', label: 'Recall to Sit (5m)' },
        { key: 'leave_it_2', label: 'Leave It Part 2' },
        { key: 'say_hello_2', label: 'Say Hello Part 2' }
      ]
    },
    week6: {
      title: 'Session 6',
      items: [
        { key: 'lets_go_pattern_proof', label: "Let's Go Pattern Proof" },
        { key: 'down_stay_proof', label: 'Down-Stay Proof' },
        { key: 'double_recall_var', label: 'Double Recall (Variation)' },
        { key: 'recall_sit_10m', label: 'Recall to Sit (10m)' },
        { key: 'leave_it_3', label: 'Leave It Part 3' }
      ]
    },
    week7: {
      title: 'Session 7',
      items: [
        { key: 'pattern_game_proof', label: 'Pattern Game Proof' },
        { key: 'down_stay_final', label: 'Down-Stay Final' },
        { key: 'triangle_success', label: 'Triangle Success' },
        { key: 'recall_sit_final', label: 'Recall to Sit Final' },
        { key: 'leave_it_final', label: 'Leave It Final' }
      ]
    }
  };

  // ADORE/HDB Approval Curriculum Data
  const adoreHDBCurriculum = {
    session1: {
      title: 'Session 1',
      items: [
        { key: 'check_in_1', label: 'Check-in Part 1' },
        { key: 'pattern_game_three', label: '123 Pattern Game (Three!)' },
        { key: 'sit_lure', label: 'Sit with Lure' },
        { key: 'scatter_feeding', label: 'Scatter Feeding' },
        { key: 'body_language_theory', label: 'Body Language Theory' }
      ]
    },
    session2: {
      title: 'Session 2',
      items: [
        { key: 'pattern_game_full', label: '123 Pattern Game (One, Two, Three!)' },
        { key: 'sit_verbal', label: 'Sit with Verbal/Hand Cue' },
        { key: 'check_in_2', label: 'Check-in Part 2' },
        { key: 'down_lure', label: 'Down with Lure' }
      ]
    },
    session3: {
      title: 'Session 3',
      items: [
        { key: 'pattern_game_pace', label: '123 Pattern Game (Changing pace)' },
        { key: 'down_verbal', label: 'Down with Verbal/Hand Cue' },
        { key: 'anchor_cue_1', label: 'Anchor Cue Part 1' },
        { key: 'down_stay_duration', label: 'Down-Stay (Duration)' },
        { key: 'leave_it_1', label: 'Leave It Part 1' }
      ]
    },
    session4: {
      title: 'Session 4',
      items: [
        { key: 'pattern_game_3', label: 'Pattern Game Part 3' },
        { key: 'anchor_cue_2', label: 'Anchor Cue Part 2' },
        { key: 'down_stay_distance', label: 'Down-Stay (Distance)' },
        { key: 'leave_it_2', label: 'Leave It Part 2' }
      ]
    }
  };

  // Basic Manners Group Class Curriculum Data (Same as FYOG for now, adjust if different)
  const basicMannersGroupClassCurriculum = {
    week1: {
      title: 'Session 1',
      items: [
        { key: 'lets_go_1', label: "Let's Go Part 1" },
        { key: 'sit_lure', label: 'Sit with Lure' },
        { key: 'body_language', label: 'Body Language Theory' },
        { key: 'check_in_1', label: 'Check-in Part 1' },
        { key: 'discussion', label: 'Discussion' }
      ]
    },
    week2: {
      title: 'Session 2',
      items: [
        { key: 'pattern_game_1', label: 'Pattern Game 1' },
        { key: 'lets_go_2', label: "Let's Go Part 2" },
        { key: 'sit_verbal', label: 'Sit with Verbal Cue' },
        { key: 'down_lure', label: 'Down with Lure' },
        { key: 'check_in_proof', label: 'Check-in Proof' }
      ]
    },
    week3: {
      title: 'Session 3',
      items: [
        { key: 'pattern_game_2', label: 'Pattern Game 2' },
        { key: 'lets_go_uturn', label: "Let's Go U-turn" },
        { key: 'down_verbal', label: 'Down with Verbal Cue' },
        { key: 'down_stay_duration', label: 'Down-Stay (Duration)' },
        { key: 'anchor_cue_1', label: 'Anchor Cue Part 1' }
      ]
    },
    week4: {
      title: 'Session 4',
      items: [
        { key: 'pattern_game_3', label: 'Pattern Game 3' },
        { key: 'lets_go_pace', label: "Let's Go Pace" },
        { key: 'down_stay_distance', label: 'Down-Stay (Distance)' },
        { key: 'anchor_proof', label: 'Anchor Proof' },
        { key: 'leave_it_1', label: 'Leave It Part 1' },
        { key: 'say_hello', label: 'Say Hello' }
      ]
    },
    week5: {
      title: 'Session 5',
      items: [
        { key: 'pattern_game_4', label: 'Pattern Game 4' },
        { key: 'down_stay_distractions', label: 'Down-Stay with Distractions' },
        { key: 'double_recall', label: 'Double Recall' },
        { key: 'recall_sit_5m', label: 'Recall to Sit (5m)' },
        { key: 'leave_it_2', label: 'Leave It Part 2' },
        { key: 'say_hello_2', label: 'Say Hello Part 2' }
      ]
    },
    week6: {
      title: 'Session 6',
      items: [
        { key: 'lets_go_pattern_proof', label: "Let's Go Pattern Proof" },
        { key: 'down_stay_proof', label: 'Down-Stay Proof' },
        { key: 'double_recall_var', label: 'Double Recall (Variation)' },
        { key: 'recall_sit_10m', label: 'Recall to Sit (10m)' },
        { key: 'leave_it_3', label: 'Leave It Part 3' }
      ]
    },
    week7: {
      title: 'Session 7',
      items: [
        { key: 'pattern_game_proof', label: 'Pattern Game Proof' },
        { key: 'down_stay_final', label: 'Down-Stay Final' },
        { key: 'triangle_success', label: 'Triangle Success' },
        { key: 'recall_sit_final', label: 'Recall to Sit Final' },
        { key: 'leave_it_final', label: 'Leave It Final' }
      ]
    }
  };


  return (
    <>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("AdminBookings"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Booking Details</h1>
              <p className="text-slate-600 mt-1">{booking.service_name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Booking
          </Button>
        </div>

        {/* Combined Status + Pricing card for mobile only */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm lg:hidden">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center justify-between">
              <span>Booking Status</span>
              <Badge variant="secondary" className={`${statusColors[booking.booking_status]} border`}>
                {booking.booking_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Select value={booking.booking_status} onValueChange={handleStatusChange} disabled={saving}>
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {booking.confirmation_date && (
              <div className="pt-3 border-t border-slate-200">
                <p className="text-base text-slate-600">Confirmed on</p>
                <p className="font-medium text-slate-900 text-base">
                  {format(new Date(booking.confirmation_date), 'EEEE, MMM d, yyyy')} at {format(new Date(booking.confirmation_date), 'h:mm a')}
                </p>
              </div>
            )}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold text-slate-900">Pricing</span>
              </div>
              <div className="space-y-2 text-base">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Price:</span>
                  <span className="font-medium">${booking.base_price?.toFixed(2)}</span>
                </div>
                {booking.adoption_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Adoption Discount:</span>
                    <span className="font-medium">-${booking.adoption_discount?.toFixed(2)}</span>
                  </div>
                )}
                {booking.weekend_surcharge > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Weekend Surcharge:</span>
                    <span className="font-medium">+${booking.weekend_surcharge?.toFixed(2)}</span>
                  </div>
                )}
                {booking.total_sentosa_surcharge > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Sentosa Surcharge:</span>
                    <span className="font-medium">+${booking.total_sentosa_surcharge?.toFixed(2)}</span>
                  </div>
                )}
                {booking.product_selections && booking.product_selections.length > 0 && (
                  <>
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <p className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Products:
                      </p>
                      <div className="space-y-1.5 pl-6">
                        {booking.product_selections.map((product, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600">{product.product_name} × {product.quantity}</span>
                            <span className="font-medium text-blue-600">${(product.discounted_price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-blue-700 font-semibold pt-1">
                      <span>Products Subtotal:</span>
                      <span>${booking.products_total?.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-xl text-blue-600">${booking.total_price?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-only: Session Schedule */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm lg:hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Session Schedule
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleOpenReschedule} className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Reschedule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {booking.session_dates?.map((session, idx) => {
                const isGroupClass = booking.service_type === 'basic_manners_group_class';
                const wasRescheduled = Boolean(
                  session.was_rescheduled ||
                  session.wasRescheduled ||
                  session.rescheduled ||
                  session.auto_adjusted
                );
                const isCancelled = Boolean(session.session_cancelled);
                return (
                  <div key={idx} className={`p-3 rounded-lg border ${isCancelled ? 'bg-red-50 border-red-200 opacity-70' : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isCancelled ? 'line-through text-slate-400' : ''}`}>Session {session.session_number || idx + 1}</p>
                        <p className={`text-sm mt-1 ${isCancelled ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                          {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}
                        </p>
                        <p className={`text-sm font-medium mt-1 ${isCancelled ? 'line-through text-slate-400' : 'text-blue-600'}`}>
                          {session.start_time}{session.end_time ? ` - ${session.end_time}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {wasRescheduled && !isCancelled && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 text-xs whitespace-nowrap">
                            <RefreshCw className="w-3 h-3" />
                            {isGroupClass ? 'Rescheduled' : 'Auto-adjusted'}
                          </Badge>
                        )}
                        {isCancelled && <Badge variant="secondary" className="bg-red-100 text-red-800 border border-red-300 text-xs">Cancelled</Badge>}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSession(idx)} title="Delete session">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {session.completed && !isCancelled && (
                      <Badge className="mt-2 bg-green-100 text-green-800">Completed</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mobile-only: Admin Notes */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm lg:hidden">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Admin Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Textarea
                id="admin-notes-mobile-top"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this booking..."
                className="h-32 text-base"
              />
            </div>
            <Button onClick={handleSaveNotes} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden lg:block">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Status</span>
                  <Badge variant="secondary" className={`${statusColors[booking.booking_status]} border`}>
                    {booking.booking_status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Select value={booking.booking_status} onValueChange={handleStatusChange} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {booking.confirmation_date && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">Confirmed on</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(booking.confirmation_date), 'EEEE, MMM d, yyyy')} at {format(new Date(booking.confirmation_date), 'h:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </div>
                  {!editingClient ? (
                    <Button size="sm" variant="outline" onClick={handleEditClientStart}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingClient(false)}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveClientInfo} disabled={savingClient}>
                        <Save className="w-4 h-4 mr-1" /> {savingClient ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isFYOG && booking.clients && booking.clients.length > 0 ? (
                  <div className="space-y-4">
                    {(editingClient ? clientEdits.clients : booking.clients)?.map((client, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-4 border-t border-slate-200' : ''}`}>
                        <h4 className="font-semibold text-slate-900 mb-3">Pawrent {idx + 1}</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-base">
                          {['client_name','client_email','client_mobile','client_address','client_postal_code'].map(field => {
                            const labels = { client_name:'Name', client_email:'Email', client_mobile:'Mobile', client_address:'Address', client_postal_code:'Postal Code' };
                            const val = client[field] || client[field.replace(/_([a-z])/g, (_, l) => l.toUpperCase())] || booking[field] || '';
                            return (
                              <div key={field}>
                                <p className="text-slate-600 mb-1">{labels[field]}</p>
                                {editingClient ? (
                                  <Input
                                    value={clientEdits.clients?.[idx]?.[field] ?? val}
                                    onChange={e => {
                                      const updated = [...(clientEdits.clients || [])];
                                      updated[idx] = { ...updated[idx], [field]: e.target.value };
                                      setClientEdits(prev => ({ ...prev, clients: updated }));
                                    }}
                                  />
                                ) : (
                                  <p className="font-medium">{val || 'N/A'}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-base">
                    {[['client_name','clientName','Name'],['client_email','clientEmail','Email'],['client_mobile','clientMobile','Mobile'],['client_address','clientAddress','Address'],['client_postal_code','clientPostalCode','Postal Code']].map(([field, camelField, label]) => {
                      const firstClient = booking.clients?.[0];
                      const value = booking[field] || booking[camelField] || firstClient?.[field] || firstClient?.[camelField] || '';
                      return (
                        <div key={field}>
                          <p className="text-slate-600 mb-1">{label}</p>
                          {editingClient ? (
                            <Input
                              value={clientEdits[field] ?? ''}
                              onChange={e => setClientEdits(prev => ({ ...prev, [field]: e.target.value }))}
                            />
                          ) : (
                            <p className="font-medium">{value || 'N/A'}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              </Card>

            {/* Furkid Information */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5" />
                  Furkid's Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isFYOG && booking.furkids && booking.furkids.length > 0 ? (
                  <div className="space-y-4">
                    {booking.furkids.map((furkid, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-4 border-t border-slate-200' : ''}`}>
                        <h4 className="font-semibold text-slate-900 mb-3">
                          {booking.service_type === 'kinder_puppy_fyog' || booking.service_type === 'kinder_puppy_in_home' ? 'Puppy' : 'Dog'} {idx + 1}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-base">
                          <div><p className="text-slate-600">Name</p><p className="font-medium">{getFurkidField(furkid, 'furkidName')}</p></div>
                          {getFurkidField(furkid, 'furkidAge') !== 'N/A' && <div><p className="text-slate-600">Age</p><p className="font-medium">{getFurkidField(furkid, 'furkidAge')}</p></div>}
                          {getFurkidField(furkid, 'furkidBreed') !== 'N/A' && <div><p className="text-slate-600">Breed</p><p className="font-medium">{getFurkidField(furkid, 'furkidBreed')}</p></div>}
                          <div><p className="text-slate-600">Gender</p><p className="font-medium capitalize">{getFurkidField(furkid, 'furkidGender')}</p></div>
                          <div><p className="text-slate-600">Sterilised</p><p className="font-medium">{furkid.furkidSterilised || furkid.furkid_sterilised ? 'Yes' : 'No'}</p></div>
                          <div><p className="text-slate-600">Adopted</p><p className="font-medium">{furkid.isAdopted || furkid.is_adopted ? 'Yes' : 'No'}</p></div>
                          {getFurkidField(furkid, 'furkidDiet') !== 'N/A' && <div className="md:col-span-2"><p className="text-slate-600">Diet</p><p className="font-medium">{getFurkidField(furkid, 'furkidDiet')}</p></div>}
                          {getFurkidField(furkid, 'furkidSleepArea') !== 'N/A' && <div className="md:col-span-2"><p className="text-slate-600">Sleep Area</p><p className="font-medium">{getFurkidField(furkid, 'furkidSleepArea')}</p></div>}
                        </div>
                        {(furkid.furkidPhotoUrl || furkid.furkid_photo_url) && (
                          <div className="mt-4">
                            <p className="text-slate-600 text-sm mb-2">Photo</p>
                            <img src={furkid.furkidPhotoUrl || furkid.furkid_photo_url} alt={getFurkidField(furkid, 'furkidName')} className="rounded-lg w-32 h-32 object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-base">
                    <div><p className="text-slate-600">Name</p><p className="font-medium">{booking.furkid_name || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Age</p><p className="font-medium">{booking.furkid_age || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Breed</p><p className="font-medium">{booking.furkid_breed || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Gender</p><p className="font-medium capitalize">{booking.furkid_gender || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Sterilised</p><p className="font-medium">{booking.furkid_sterilised === true ? 'Yes' : booking.furkid_sterilised === false ? 'No' : 'N/A'}</p></div>
                    <div><p className="text-slate-600">Adopted</p><p className="font-medium">{booking.is_adopted === true ? 'Yes' : booking.is_adopted === false ? 'No' : 'N/A'}</p></div>
                    <div><p className="text-slate-600">Joined Family</p><p className="font-medium">{booking.furkid_joined_family || 'N/A'}</p></div>
                    <div><p className="text-slate-600">First Time Owner</p><p className="font-medium">{booking.first_time_owner === true ? 'Yes' : booking.first_time_owner === false ? 'No' : 'N/A'}</p></div>
                    <div className="md:col-span-2"><p className="text-slate-600">Diet</p><p className="font-medium">{booking.furkid_diet || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Sleeps At Night</p><p className="font-medium">{booking.furkid_sleep_area || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Walk Frequency</p><p className="font-medium">{booking.walking_frequency || 'N/A'}</p></div>
                    <div><p className="text-slate-600">Instagram</p><p className="font-medium">{booking.furkid_instagram || 'N/A'}</p></div>
                    <div className="md:col-span-2"><p className="text-slate-600">Reason for Enrolment</p><p className="font-medium">{booking.enrolment_reason || 'N/A'}</p></div>
                    {booking.furkid_photo_url && (
                      <div className="md:col-span-2">
                        <p className="text-slate-600 text-sm mb-2">Photo</p>
                        <img src={booking.furkid_photo_url} alt={booking.furkid_name} className="rounded-lg w-32 h-32 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

              {/* Items Given to Client */}
            {(hasKinderPuppyItems || hasBasicMannersItems || hasBasicMannersFYOGItems) && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Items Given to Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hasKinderPuppyItems && [
                      { key: 'treat_pouch', label: 'Treat Pouch' },
                      { key: 'mat', label: 'Mat' },
                      { key: 'lick_mat', label: 'Lick Mat' },
                      { key: 'cup', label: 'Cup' },
                      { key: 'dropper', label: 'Dropper' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`item-${item.key}`}
                          checked={booking.kinder_puppy_items_given?.[item.key] || false}
                          onChange={(e) => handleKinderPuppyItemsUpdate(item.key, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`item-${item.key}`}
                          className="text-sm text-slate-700 cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                    
                    {hasBasicMannersItems && [
                      { key: 'treat_pouch', label: 'Treat Pouch' },
                      { key: 'clicker', label: 'Clicker' },
                      { key: 'whistle', label: 'Whistle' },
                      { key: 'mat', label: 'Mat' },
                      { key: 'leash', label: 'Leash' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`basic-item-${item.key}`}
                          checked={booking.basic_manners_items_given?.[item.key] || false}
                          onChange={(e) => handleBasicMannersItemsUpdate(item.key, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`basic-item-${item.key}`}
                          className="text-sm text-slate-700 cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}

                    {hasBasicMannersFYOGItems && [
                      { key: 'treat_pouch', label: 'Treat Pouch (Clicker + Whistle)' },
                      { key: 'mat', label: 'Mat' },
                      { key: 'leash', label: 'Leash' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`fyog-item-${item.key}`}
                          checked={booking.basic_manners_items_given?.[item.key] || false}
                          onChange={(e) => handleBasicMannersItemsUpdate(item.key, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`fyog-item-${item.key}`}
                          className="text-sm text-slate-700 cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Behavioural Modification Details */}
            {booking.service_type === 'behavioural_modification' && (
              <BehaviouralModificationDetails booking={booking} />
            )}

            {/* Canine Assessment Details */}
            {booking.service_type === 'canine_assessment' && (
              <CanineAssessmentDetails booking={booking} />
            )}

            {/* Curriculum Tracker */}
            {(hasKinderPuppyCurriculum || hasBasicMannersCurriculum || hasBasicMannersFYOGCurriculum || hasBasicMannersGroupClassCurriculum || hasAdoreHDBCurriculum) && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Training Curriculum
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {hasKinderPuppyCurriculum && Object.entries(kinderPuppyCurriculum).map(([weekKey, week]) => {
                      const weekProgress = booking.kinder_puppy_progress?.[weekKey] || {};
                      const completedItems = week.items.filter(item => weekProgress[item.key]).length;
                      const totalItems = week.items.length;
                      
                      return (
                        <div key={weekKey} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{week.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {completedItems}/{totalItems} completed
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {week.items.map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${weekKey}-${item.key}`}
                                  checked={weekProgress[item.key] || false}
                                  onChange={(e) => handleCurriculumUpdate(weekKey, item.key, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`${weekKey}-${item.key}`}
                                  className="text-sm text-slate-700 cursor-pointer"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {hasBasicMannersCurriculum && Object.entries(basicMannersCurriculum).map(([weekKey, week]) => {
                      const weekProgress = booking.basic_manners_progress?.[weekKey] || {};
                      const completedItems = week.items.filter(item => weekProgress[item.key]).length;
                      const totalItems = week.items.length;
                      
                      return (
                        <div key={weekKey} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{week.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {completedItems}/{totalItems} completed
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {week.items.map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${weekKey}-${item.key}`}
                                  checked={weekProgress[item.key] || false}
                                  onChange={(e) => handleCurriculumUpdate(weekKey, item.key, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`${weekKey}-${item.key}`}
                                  className="text-sm text-slate-700 cursor-pointer"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {hasBasicMannersFYOGCurriculum && Object.entries(basicMannersFYOGCurriculum).map(([weekKey, week]) => {
                      const weekProgress = booking.basic_manners_fyog_progress?.[weekKey] || {};
                      const completedItems = week.items.filter(item => weekProgress[item.key]).length;
                      const totalItems = week.items.length;
                      
                      return (
                        <div key={weekKey} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{week.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {completedItems}/{totalItems} completed
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {week.items.map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`fyog-${weekKey}-${item.key}`}
                                  checked={weekProgress[item.key] || false}
                                  onChange={(e) => handleCurriculumUpdate(weekKey, item.key, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`fyog-${weekKey}-${item.key}`}
                                  className="text-sm text-slate-700 cursor-pointer"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {hasBasicMannersGroupClassCurriculum && Object.entries(basicMannersGroupClassCurriculum).map(([weekKey, week]) => {
                      const weekProgress = booking.basic_manners_group_class_progress?.[weekKey] || {};
                      const completedItems = week.items.filter(item => weekProgress[item.key]).length;
                      const totalItems = week.items.length;
                      
                      return (
                        <div key={weekKey} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{week.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {completedItems}/{totalItems} completed
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {week.items.map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`group-class-${weekKey}-${item.key}`}
                                  checked={weekProgress[item.key] || false}
                                  onChange={(e) => handleCurriculumUpdate(weekKey, item.key, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`group-class-${weekKey}-${item.key}`}
                                  className="text-sm text-slate-700 cursor-pointer"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {hasAdoreHDBCurriculum && Object.entries(adoreHDBCurriculum).map(([sessionKey, session]) => {
                      const sessionProgress = booking.adore_hdb_progress?.[sessionKey] || {};
                      const completedItems = session.items.filter(item => sessionProgress[item.key]).length;
                      const totalItems = session.items.length;
                      
                      return (
                        <div key={sessionKey} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{session.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {completedItems}/{totalItems} completed
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {session.items.map((item) => (
                              <div key={item.key} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`adore-${sessionKey}-${item.key}`}
                                  checked={sessionProgress[item.key] || false}
                                  onChange={(e) => handleCurriculumUpdate(sessionKey, item.key, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`adore-${sessionKey}-${item.key}`}
                                  className="text-sm text-slate-700 cursor-pointer"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Schedule */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden lg:block">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Session Schedule
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenReschedule}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Reschedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {booking.session_dates?.map((session, idx) => {
                    const isGroupClass = booking.service_type === 'basic_manners_group_class';
                    const wasRescheduled = Boolean(
                      session.was_rescheduled ||
                      session.wasRescheduled ||
                      session.rescheduled ||
                      session.auto_adjusted
                    );
                    const isCancelled = Boolean(session.session_cancelled);
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${isCancelled ? 'bg-red-50 border-red-200 opacity-70' : 'bg-slate-50 border-transparent'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isCancelled ? 'line-through text-slate-400' : ''}`}>Session {session.session_number || idx + 1}</p>
                            <p className={`text-sm mt-1 ${isCancelled ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                              {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}
                            </p>
                            <p className={`text-sm font-medium mt-1 ${isCancelled ? 'line-through text-slate-400' : 'text-blue-600'}`}>
                              {session.start_time}{session.end_time ? ` - ${session.end_time}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {wasRescheduled && !isCancelled && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 text-xs whitespace-nowrap">
                                <RefreshCw className="w-3 h-3" />
                                {isGroupClass ? 'Rescheduled' : 'Auto-adjusted'}
                              </Badge>
                            )}
                            {isCancelled && <Badge variant="secondary" className="bg-red-100 text-red-800 border border-red-300 text-xs">Cancelled</Badge>}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSession(idx)} title="Delete session">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {session.completed && !isCancelled && (
                          <Badge className="mt-2 bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden lg:block">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price:</span>
                    <span className="font-medium">${booking.base_price?.toFixed(2)}</span>
                  </div>
                  {booking.adoption_discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Adoption Discount:</span>
                      <span className="font-medium">-${booking.adoption_discount?.toFixed(2)}</span>
                    </div>
                  )}
                  {booking.weekend_surcharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Weekend Surcharge:</span>
                      <span className="font-medium">+${booking.weekend_surcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  {booking.total_sentosa_surcharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Sentosa Surcharge:</span>
                      <span className="font-medium">+${booking.total_sentosa_surcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {booking.product_selections && booking.product_selections.length > 0 && (
                    <>
                      <div className="pt-2 mt-2 border-t border-slate-200">
                        <p className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Products:
                        </p>
                        <div className="space-y-1.5 pl-6">
                          {booking.product_selections.map((product, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-slate-600">
                                {product.product_name} × {product.quantity}
                              </span>
                              <span className="font-medium text-blue-600">
                                ${(product.discounted_price * product.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-blue-700 font-semibold pt-1">
                        <span>Products Subtotal:</span>
                        <span>${booking.products_total?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-2 border-t border-slate-200 flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-xl text-blue-600">${booking.total_price?.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes - hidden on mobile, shown on desktop */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden lg:block">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this booking..."
                    className="h-32"
                  />
                </div>
                <Button onClick={handleSaveNotes} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reschedule Sessions</DialogTitle>
            <DialogDescription>
              Update the date and time for each training session
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingSessions.map((session, idx) => (
              <Card key={idx} className="p-4">
                <h4 className="font-semibold text-sm mb-3">Session {session.session_number}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {session.date ? format(parseISO(session.date), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={session.date ? parseISO(session.date) : null}
                          onSelect={(date) => date && handleSessionDateChange(idx, date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={session.start_time}
                      onValueChange={(time) => handleSessionTimeChange(idx, time)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTimeSlots(session.date).map(time => {
                          const isBooked = isTimeSlotBooked(session.date, time, session.session_number);
                          return (
                            <SelectItem 
                              key={time} 
                              value={time}
                              disabled={isBooked}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {time}
                                {isBooked && <span className="text-xs text-red-600">(Booked)</span>}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {session.start_time && (
                      <p className="text-xs text-slate-600">
                        End time: {session.end_time}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReschedule} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}