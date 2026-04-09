import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getClientEmails(booking) {
  const emails = [];
  if (booking.client_email) emails.push(booking.client_email);
  if (booking.clients && booking.clients.length > 0) {
    for (const c of booking.clients) {
      const email = c.client_email || c.clientEmail || '';
      if (email && !emails.includes(email)) emails.push(email);
    }
  }
  return emails;
}

function getClientName(booking) {
  if (booking.client_name) return booking.client_name;
  if (booking.clients && booking.clients.length > 0) {
    return booking.clients[0].client_name || booking.clients[0].clientName || 'Valued Client';
  }
  return 'Valued Client';
}

function getFurkidName(booking) {
  if (booking.furkid_name) return booking.furkid_name;
  if (booking.furkids && booking.furkids.length > 0) {
    const f = booking.furkids.find(fk => fk?.furkid_name);
    if (f) return f.furkid_name;
  }
  return 'your furkid';
}

function buildReminderHtml(booking, session, clientName, furkidName) {
  const serviceName = booking.service_name || 'Training Service';
  const sessionDate = formatDate(session.date);
  const startTime = session.start_time || '';
  const endTime = session.end_time || '';
  const sessionNum = session.session_number || '';
  const serviceType = booking.service_type || '';
  const isGroupClass = serviceType === 'basic_manners_group_class';
  const address = isGroupClass
    ? '73 Redhill Road MSCP, Level 7'
    : (booking.client_address || booking.clients?.[0]?.client_address || '');
  const postalCode = booking.client_postal_code || booking.clients?.[0]?.client_postal_code || '';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/981c2d0c1_DogLogonewSmallCustom.png" alt="Hopefordogs" style="height: 60px; width: auto; object-fit: contain; margin-bottom: 16px;" />
      <h1 style="margin: 0 0 8px 0; font-size: 24px; color: white; font-weight: 700;">Session Reminder 🐾</h1>
      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">${serviceName}</p>
    </div>
    <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
      <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${clientName}</strong> and <strong>${furkidName}</strong>,</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
        This is a friendly reminder that your <strong>${serviceName}</strong>${sessionNum ? ` (Session ${sessionNum})` : ''} is scheduled for <strong>tomorrow</strong>:
      </p>
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 0 0 16px 0;">
        <p style="margin: 0 0 6px 0; font-size: 15px; color: #0c4a6e;"><strong>📅 Date:</strong> ${sessionDate}</p>
        <p style="margin: 0 0 6px 0; font-size: 15px; color: #0c4a6e;"><strong>🕐 Time:</strong> ${startTime}${endTime ? ' – ' + endTime : ''}</p>
        ${address ? `<p style="margin: 0; font-size: 15px; color: #0c4a6e;"><strong>📍 Location:</strong> ${address}${postalCode ? ', ' + postalCode : ''}</p>` : ''}
      </div>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
        Please remember to bring lots of bite-sized treats for <strong>${furkidName}</strong>!
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 16px 0 0 0;">See you tomorrow! 🐕</p>
      <p style="font-size: 15px; color: #1e293b; margin: 20px 0 0 0;">
        Kind regards,<br/>
        <strong>Jacky, ISCP Canine Dip. Prac.</strong><br/>
        Hopefordogs Canine Training
      </p>
    </div>
    <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">Hopefordogs Canine Training</p>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
        <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
        &nbsp;&middot;&nbsp; WhatsApp: +65 8222 8376
      </p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate tomorrow's date in Singapore timezone
    const now = new Date();
    const sgOffset = 8 * 60; // SGT = UTC+8
    const sgNow = new Date(now.getTime() + (sgOffset + now.getTimezoneOffset()) * 60000);
    const tomorrow = new Date(sgNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`🔍 Checking bookings with sessions on ${tomorrowStr}`);

    // Get all confirmed bookings that haven't had reminders sent
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      booking_status: 'confirmed',
      reminder_sent: false
    });

    console.log(`📋 Found ${bookings.length} confirmed bookings without reminders`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }

    const { Resend } = await import('npm:resend');
    const resend = new Resend(RESEND_API_KEY);
    const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    let sentCount = 0;

    for (const booking of bookings) {
      if (!booking.session_dates || booking.session_dates.length === 0) continue;

      // Find session scheduled for tomorrow
      const tomorrowSession = booking.session_dates.find(s => s.date === tomorrowStr && !s.completed);
      if (!tomorrowSession) continue;

      const clientEmails = getClientEmails(booking);
      if (clientEmails.length === 0) continue;

      const clientName = getClientName(booking);
      const furkidName = getFurkidName(booking);
      const serviceName = booking.service_name || 'Training Service';

      console.log(`📧 Sending reminder for booking ${booking.id} to ${clientEmails.join(', ')}`);

      // Send to all client emails
      for (const email of clientEmails) {
        try {
          await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: `Reminder: ${serviceName} tomorrow – ${formatDate(tomorrowSession.date)}`,
            html: buildReminderHtml(booking, tomorrowSession, clientName, furkidName),
          });
          console.log(`✅ Reminder sent to ${email}`);
        } catch (emailErr) {
          console.error(`⚠️ Failed to send reminder to ${email}:`, emailErr.message);
        }
      }

      // Mark reminder as sent
      await base44.asServiceRole.entities.Booking.update(booking.id, { reminder_sent: true });
      sentCount++;
    }

    console.log(`✅ Session reminders complete. Sent ${sentCount} reminder(s).`);
    return Response.json({ success: true, reminders_sent: sentCount, checked_date: tomorrowStr });

  } catch (error) {
    console.error('❌ sendSessionReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});