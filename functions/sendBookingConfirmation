import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get the booking data from the request
        const { booking } = await req.json();
        
        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }
        
        // Check WhatsApp consent
        if (!booking.whatsapp_consent) {
            return Response.json({ message: 'Client did not consent to WhatsApp notifications' }, { status: 200 });
        }
        
        // Extract client information with better fallback handling
        let clientMobile = booking.client_mobile;
        let clientName = booking.client_name || 'Valued Client';
        let furkidName = booking.furkid_name || 'your furkid';
        
        // For FYOG/Group bookings, check the arrays
        if (!clientMobile && booking.clients && booking.clients.length > 0) {
            const clientWithMobile = booking.clients.find(c => c && c.client_mobile);
            if (clientWithMobile) {
                clientMobile = clientWithMobile.client_mobile;
                clientName = clientWithMobile.client_name || clientName;
            }
        }
        
        if (!furkidName || furkidName === 'your furkid') {
            if (booking.furkids && booking.furkids.length > 0) {
                const furkidWithName = booking.furkids.find(f => f && f.furkid_name);
                if (furkidWithName) {
                    furkidName = furkidWithName.furkid_name;
                }
            }
        }
        
        // Validate we have required information
        if (!clientMobile) {
            console.warn('No client mobile number found in booking:', booking.id);
            return Response.json({ 
                message: 'No client mobile number found - skipping WhatsApp notification',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        // Validate mobile number format
        if (!clientMobile.startsWith('+') || clientMobile.length < 8) {
            console.warn('Invalid mobile number format:', clientMobile);
            return Response.json({ 
                message: 'Invalid mobile number format - skipping WhatsApp notification',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        // Check if agents API is available
        if (!base44.asServiceRole || !base44.asServiceRole.agents) {
            console.warn('Agents API not available. WhatsApp agent may not be connected.');
            console.log('To enable WhatsApp notifications:');
            console.log('1. Go to your Base44 Dashboard');
            console.log('2. Navigate to Agents > booking_assistant');
            console.log('3. Connect WhatsApp following the setup instructions');
            
            return Response.json({ 
                message: 'WhatsApp agent not connected. Please connect WhatsApp in Dashboard > Agents.',
                booking_id: booking.id,
                would_send_to: clientMobile
            }, { status: 200 });
        }
        
        // Format session details
        let sessionDetails = '';
        if (booking.session_dates && booking.session_dates.length > 0) {
            const firstSession = booking.session_dates[0];
            const sessionDate = new Date(firstSession.date);
            const formattedDate = sessionDate.toLocaleDateString('en-SG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            sessionDetails = `\n📅 *First Session:* ${formattedDate} at ${firstSession.start_time}`;
            
            if (booking.session_dates.length > 1) {
                sessionDetails += `\n📋 *Total Sessions:* ${booking.session_dates.length}`;
            }
        }
        
        // Format pricing details
        let pricingDetails = '';
        if (booking.total_price) {
            pricingDetails = `\n💰 *Total Amount:* $${booking.total_price.toFixed(2)}`;
            
            if (booking.adoption_discount > 0) {
                pricingDetails += `\n   - Adoption Discount: -$${booking.adoption_discount.toFixed(2)} ✨`;
            }
            if (booking.weekend_surcharge > 0) {
                pricingDetails += `\n   - Weekend Surcharge: +$${booking.weekend_surcharge.toFixed(2)}`;
            }
            if (booking.total_sentosa_surcharge > 0) {
                pricingDetails += `\n   - Sentosa Surcharge: +$${booking.total_sentosa_surcharge.toFixed(2)}`;
            }
        }
        
        // Construct the confirmation message
        const message = `🎉 *Booking Confirmed!*

Hi ${clientName}! 

Great news! Your booking for *${booking.service_name}* with ${furkidName} has been confirmed! 🐾
${sessionDetails}
${pricingDetails}

Our team will contact you within 24 hours with payment details and further instructions.

We're excited to start this training journey with you and ${furkidName}! 

If you need to reschedule, please contact our admin team at +65 8222 8376.

_- Hopefordogs Training Team_ 🐕`;

        // Create a conversation and send the message via the booking assistant agent
        const conversation = await base44.asServiceRole.agents.createConversation({
            agent_name: 'booking_assistant',
            metadata: {
                booking_id: booking.id,
                client_mobile: clientMobile,
                client_name: clientName,
                type: 'booking_confirmation'
            }
        });
        
        await base44.asServiceRole.agents.addMessage(conversation, {
            role: 'assistant',
            content: message
        });
        
        console.log(`Booking confirmation sent to ${clientMobile} for booking ${booking.id}`);
        
        return Response.json({ 
            success: true, 
            message: 'Booking confirmation sent successfully',
            conversation_id: conversation.id
        });
        
    } catch (error) {
        console.error('Error sending booking confirmation:', error);
        console.error('Error details:', error.stack);
        
        // Return a 200 response so the booking process isn't blocked
        return Response.json({ 
            message: 'Booking created but WhatsApp notification failed',
            error: error.message,
            note: 'Please check WhatsApp agent connection in Dashboard'
        }, { status: 200 });
    }
});