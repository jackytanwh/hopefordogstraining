import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all confirmed/active behavioural modification bookings
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      service_type: 'behavioural_modification'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const targetDate = sevenDaysAgo.toISOString().split('T')[0]; // yyyy-MM-dd

    const reminders = [];

    for (const booking of bookings) {
      if (booking.booking_status === 'cancelled') continue;

      const sessions = booking.session_dates || [];
      for (const session of sessions) {
        if (session.date === targetDate) {
          reminders.push({
            booking,
            session
          });
        }
      }
    }

    if (reminders.length === 0) {
      return Response.json({ message: 'No follow-ups needed today.', count: 0 });
    }

    const adminEmail = Deno.env.get('RESEND_FROM_EMAIL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    for (const { booking, session } of reminders) {
      const clientName = booking.client_name || booking.clients?.[0]?.client_name || 'Client';
      const furkidName = booking.furkid_name || booking.furkids?.[0]?.furkid_name || 'Furkid';
      const sessionNum = session.session_number || '?';

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af;">🐾 Follow-Up Reminder — Behavioural Modification</h2>
          <p>This is a reminder to follow up with the client below, one week after their session.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Client</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Furkid</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${furkidName}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Session</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Session ${sessionNum} — ${session.date}${session.start_time ? ` at ${session.start_time}` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Email</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${booking.client_email || booking.clients?.[0]?.client_email || 'N/A'}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Mobile</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${booking.client_mobile || booking.clients?.[0]?.client_mobile || 'N/A'}</td>
            </tr>
          </table>
          <p style="color: #64748b; font-size: 14px;">Sent automatically by Hopefordogs booking system.</p>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: adminEmail,
          to: adminEmail,
          subject: `🐾 Follow-Up Reminder: ${clientName} & ${furkidName} — Session ${sessionNum}`,
          html: emailBody
        })
      });
    }

    return Response.json({ message: `Sent ${reminders.length} follow-up reminder(s).`, count: reminders.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});