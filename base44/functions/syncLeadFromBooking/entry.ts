import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth() + years * 12;
  if (months < 1) return 'Less than 1 month';
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} year${y > 1 ? 's' : ''}`;
  return `${y} year${y > 1 ? 's' : ''} ${m} month${m > 1 ? 's' : ''}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) {
      return Response.json({ message: 'No booking data' }, { status: 400 });
    }

    // Extract client info
    let clientName, clientEmail, clientMobile, dogDob, furkidName;

    if (booking.clients && booking.clients.length > 0) {
      clientName = booking.clients[0].client_name;
      clientEmail = booking.clients[0].client_email;
      clientMobile = booking.clients[0].client_mobile;
    } else {
      clientName = booking.client_name;
      clientEmail = booking.client_email;
      clientMobile = booking.client_mobile;
    }

    if (booking.furkids && booking.furkids.length > 0) {
      dogDob = booking.furkids[0].furkid_dob;
      furkidName = booking.furkids[0].furkid_name;
    } else {
      dogDob = booking.furkid_dob;
      furkidName = booking.furkid_name;
    }

    if (!clientName || !clientEmail) {
      return Response.json({ message: 'Missing client info, skipping' });
    }

    const serviceType = booking.service_type || null;

    // Check for duplicate by email — update program if already exists
    const existing = await base44.asServiceRole.entities.LeadInquiry.filter({ email_address: clientEmail });
    if (existing && existing.length > 0) {
      if (serviceType) {
        await base44.asServiceRole.entities.LeadInquiry.update(existing[0].id, { last_program: serviceType });
      }
      return Response.json({ message: 'Duplicate email, updated program' });
    }

    const dogAge = calculateAge(dogDob);

    await base44.asServiceRole.entities.LeadInquiry.create({
      client_name: clientName,
      email_address: clientEmail,
      mobile_number: clientMobile || null,
      furkid_name: furkidName || null,
      dog_dob: dogDob || null,
      dog_age: dogAge || null,
      last_program: serviceType || null
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});