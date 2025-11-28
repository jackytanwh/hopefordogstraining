import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { format, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
    console.log("🚀 sendWhatsappBookingConfirmation function triggered");
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.log("❌ Unauthorized - no user found");
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log("✅ User authenticated:", user.email);

        const { booking } = await req.json();

        if (!booking) {
            console.log("❌ No booking data provided");
            return Response.json({ error: 'Booking data is required' }, { status: 400 });
        }
        console.log("✅ Booking received:", booking.id, "- Service:", booking.service_name);

        const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

        console.log("🔑 Credentials check - Phone Number ID:", WHATSAPP_PHONE_NUMBER_ID ? "SET" : "MISSING");
        console.log("🔑 Credentials check - Access Token:", WHATSAPP_ACCESS_TOKEN ? "SET (length: " + WHATSAPP_ACCESS_TOKEN.length + ")" : "MISSING");

        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            console.log("❌ WhatsApp API credentials not configured");
            return Response.json({ error: 'WhatsApp API credentials not configured' }, { status: 500 });
        }

        // Extract client name
        const clientName = booking.clients?.[0]?.client_name || 
                           booking.clients?.[0]?.clientName || 
                           booking.client_name || 
                           'Valued Client';

        // Extract dog name
        const dogName = booking.furkids?.[0]?.furkid_name || 
                        booking.furkids?.[0]?.furkidName || 
                        booking.furkid_name || 
                        'your furkid';

        // Program name
        const program = booking.service_name || 'a training program';

        // First session details
        const firstSession = booking.session_dates?.[0];
        const dateStart = firstSession?.date ? format(parseISO(firstSession.date), 'MMM d, yyyy') : 'N/A';
        const timeStart = firstSession?.start_time || 'N/A';
        const dayOfWeekStart = firstSession?.date ? format(parseISO(firstSession.date), 'EEEE') : 'N/A';

        // Address logic based on service_name
        let address = '';
        if (program.includes('FYOG')) {
            address = booking.sharedAddress || 'N/A';
        } else if (program.includes('Basic Manners Group Class')) {
            address = '73 Redhill Rd, Singapore';
        } else {
            address = booking.client_address || 'N/A';
        }

        // Format date list for recurring schedule
        const dateList = booking.session_dates?.map(session =>
            `${format(parseISO(session.date), 'MMM d, yyyy')} at ${session.start_time}`
        ).join('\n') || 'No recurring schedule available.';

        // Get and format mobile number to E.164
        let recipientMobile = booking.client_mobile || 
                              booking.clients?.[0]?.client_mobile || 
                              booking.clients?.[0]?.clientMobile;

        if (recipientMobile) {
            const digitsOnly = recipientMobile.replace(/\D/g, '');
            if (recipientMobile.startsWith('+')) {
                recipientMobile = `+${digitsOnly}`;
            } else {
                // Assume Singapore number if no country code
                recipientMobile = `+65${digitsOnly}`;
            }
        }

        if (!recipientMobile) {
            console.log("❌ Client mobile number is missing");
            return Response.json({ error: 'Client mobile number is missing' }, { status: 400 });
        }
        
        console.log("📱 Recipient mobile (E.164):", recipientMobile);
        console.log("📋 Variables extracted:", {
            clientName,
            dogName,
            program,
            dateStart,
            timeStart,
            dayOfWeekStart,
            address
        });

        // Build WhatsApp message payload
        const whatsappMessagePayload = {
            messaging_product: "whatsapp",
            to: recipientMobile,
            type: "template",
            template: {
                name: "hopefordogs_booking_confirmation", // Must match your approved template name
                language: {
                    code: "en_US"
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: clientName },         // {{1}} - client_name
                            { type: "text", text: dogName },            // {{2}} - dog_name
                            { type: "text", text: program },            // {{3}} - program
                            { type: "text", text: dateStart },          // {{4}} - date_start
                            { type: "text", text: timeStart },          // {{5}} - time_start
                            { type: "text", text: dayOfWeekStart },     // {{6}} - day_of_week_start
                            { type: "text", text: address },            // {{7}} - address
                            { type: "text", text: dateList }            // {{8}} - date_list
                        ]
                    }
                ]
            }
        };

        console.log("📤 Full WhatsApp payload:", JSON.stringify(whatsappMessagePayload, null, 2));
        console.log("🌐 Sending to URL:", `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`);

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                },
                body: JSON.stringify(whatsappMessagePayload),
            }
        );

        const data = await response.json();
        console.log("📥 WhatsApp API Response Status:", response.status);
        console.log("📥 WhatsApp API Response Body:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error("❌ WhatsApp API Error:", data);
            return Response.json({ error: 'Failed to send WhatsApp message', details: data }, { status: response.status });
        }

        console.log("✅ WhatsApp message sent successfully!");
        return Response.json({ success: true, whatsappResponse: data });

    } catch (error) {
        console.error("Error in sendWhatsappBookingConfirmation:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});