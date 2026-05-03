import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

function buildReviewEmailHtml(clientName, furkidName, serviceName) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/981c2d0c1_DogLogonewSmallCustom.png" alt="Hopefordogs" style="height: 60px; width: auto; object-fit: contain; margin-bottom: 16px;" />
      <h1 style="margin: 0 0 8px 0; font-size: 24px; color: white; font-weight: 700;">🎉 Congratulations!</h1>
      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">${serviceName} – Completed</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
      <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${clientName}</strong> and <strong>${furkidName}</strong>,</p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
        What a journey it has been! 🐾 We are so proud of <strong>${furkidName}</strong> and the incredible progress made throughout the <strong>${serviceName}</strong>.
      </p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
        Your commitment and dedication have made all the difference — keep up the amazing work!
      </p>

      <!-- Review CTA -->
      <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 16px; font-weight: 700; color: #92400e; margin: 0 0 8px 0;">⭐ We'd love your feedback!</p>
        <p style="font-size: 14px; color: #78350f; line-height: 1.6; margin: 0 0 20px 0;">
          If you've enjoyed training with us, a Google review would mean the world to our small team. It takes less than a minute and helps other furkid families find us!
        </p>
        <a href="https://g.page/r/CSi2srpL-Sw7EBM/review" target="_blank"
          style="display: inline-block; background: #f59e0b; color: white; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
          ⭐ Leave us a Google Review
        </a>
      </div>

      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 16px 0 0 0;">
        Thank you for trusting us to be part of <strong>${furkidName}</strong>'s journey. We hope to see you again soon! 
      </p>

      <p style="font-size: 15px; color: #1e293b; margin: 20px 0 0 0;">
        Kind regards,<br/>
        <strong>Jacky, ISCP Canine Dip. Prac.</strong><br/>
        Hopefordogs Canine Training
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">Hopefordogs Canine Training</p>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
        <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
        &nbsp;&middot;&nbsp; WhatsApp: +65 8222 8376
      </p>
      <p style="margin: 10px 0 0 0;">
        <a href="https://www.instagram.com/hopefordogscaninetraining/" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: #e1306c; font-size: 13px; font-weight: 500;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e1306c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          Follow us on Instagram
        </a>
      </p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate today's date in Singapore timezone (SGT = UTC+8)
    const now = new Date();
    const sgOffset = 8 * 60;
    const sgNow = new Date(now.getTime() + (sgOffset + now.getTimezoneOffset()) * 60000);
    const todayStr = sgNow.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`🔍 Checking for bookings whose last session was yesterday (today is ${todayStr})`);

    // Yesterday in SGT
    const yesterday = new Date(sgNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`📅 Looking for bookings with last session on ${yesterdayStr}`);

    // Get all confirmed bookings
    const allBookings = await base44.asServiceRole.entities.Booking.filter({});
    const confirmedBookings = allBookings.filter(b => b.booking_status === 'confirmed' && b.booking_status !== 'paused');

    console.log(`📋 Found ${confirmedBookings.length} confirmed bookings to check`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }

    const { Resend } = await import('npm:resend');
    const resend = new Resend(RESEND_API_KEY);
    const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    let completedCount = 0;
    let emailsSent = 0;

    for (const booking of confirmedBookings) {
      if (!booking.session_dates || booking.session_dates.length === 0) continue;

      // Find the last session date
      const sortedSessions = [...booking.session_dates].sort((a, b) => a.date > b.date ? 1 : -1);
      const lastSession = sortedSessions[sortedSessions.length - 1];

      // Check if last session was yesterday
      if (lastSession.date !== yesterdayStr) continue;

      console.log(`✅ Booking ${booking.id} (${booking.service_name}) — last session was yesterday. Marking as completed.`);

      // Mark booking as completed
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        booking_status: 'completed'
      });
      completedCount++;

      // Send review request email
      const clientEmails = getClientEmails(booking);
      if (clientEmails.length === 0) {
        console.log(`⚠️ No email found for booking ${booking.id}, skipping review email`);
        continue;
      }

      const clientName = getClientName(booking);
      const furkidName = getFurkidName(booking);
      const serviceName = booking.service_name || 'Training Service';

      for (const email of clientEmails) {
        try {
          await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: `Congratulations on completing ${serviceName}! 🎉`,
            html: buildReviewEmailHtml(clientName, furkidName, serviceName),
          });
          console.log(`📧 Review request email sent to ${email}`);
          emailsSent++;
        } catch (emailErr) {
          console.error(`⚠️ Failed to send review email to ${email}:`, emailErr.message);
        }
      }
    }

    console.log(`✅ Done. Completed ${completedCount} booking(s), sent ${emailsSent} review email(s).`);
    return Response.json({ success: true, completed: completedCount, emails_sent: emailsSent, checked_date: yesterdayStr });

  } catch (error) {
    console.error('❌ completeBookingsAndRequestReview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});