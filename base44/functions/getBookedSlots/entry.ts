import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public endpoint — returns only {date, start_time, end_time} for active bookings.
// No personal data is exposed. Anyone (authenticated or not) can call this.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to read bookings (since the entity is admin-only for direct reads)
    const allBookings = await base44.asServiceRole.entities.Booking.list();
    const blockedSlots = await base44.asServiceRole.entities.BlockedSlot.list();

    // Strip all personal data — only expose slot timing
    const bookedSlots = [];
    for (const booking of allBookings) {
      if (booking.booking_status === 'cancelled') continue;
      if (!booking.session_dates) continue;
      for (const session of booking.session_dates) {
        if (session.date && session.start_time && session.end_time) {
          bookedSlots.push({
            date: session.date,
            start_time: session.start_time,
            end_time: session.end_time
          });
        }
      }
    }

    // Also expose blocked slots (already public data — no personal info)
    const publicBlockedSlots = blockedSlots.map(b => ({
      date: b.date,
      start_time: b.start_time || null,
      end_time: b.end_time || null,
      is_full_day: b.is_full_day || false
    }));

    return Response.json({ bookedSlots, blockedSlots: publicBlockedSlots });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});