import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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
            console.log('Client did not consent to WhatsApp notifications');
            return Response.json({ 
                success: false,
                message: 'Client did not consent to WhatsApp notifications' 
            }, { status: 200 });
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
                success: false,
                message: 'No client mobile number found - skipping WhatsApp notification',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        // Validate mobile number format
        if (!clientMobile.startsWith('+') || clientMobile.length < 8) {
            console.warn('Invalid mobile number format:', clientMobile);
            return Response.json({ 
                success: false,
                message: 'Invalid mobile number format - skipping WhatsApp notification',
                booking_id: booking.id
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

        console.log('📱 Attempting to send WhatsApp confirmation...');
        console.log('To:', clientMobile);
        console.log('Booking ID:', booking.id);
        
        try {
            // Try to create a conversation and send the message via the booking assistant agent
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
            
            console.log(`✅ Booking confirmation sent to ${clientMobile} for booking ${booking.id}`);
            
            return Response.json({ 
                success: true, 
                message: 'Booking confirmation sent successfully via WhatsApp',
                conversation_id: conversation.id,
                sent_to: clientMobile
            });
            
        } catch (agentError) {
            console.warn('⚠️ WhatsApp agent not connected or error occurred:', agentError.message);
            console.log('\n📋 To enable WhatsApp notifications:');
            console.log('1. Go to your Base44 Dashboard');
            console.log('2. Navigate to Agents > booking_assistant');
            console.log('3. Click on "Connect WhatsApp" and follow the setup instructions');
            console.log('4. Once connected, scan the QR code with your WhatsApp Business account\n');
            
            // Return success with a note that WhatsApp wasn't sent
            return Response.json({ 
                success: false,
                message: 'Booking created successfully, but WhatsApp notification could not be sent',
                reason: 'WhatsApp agent not connected',
                instructions: 'Connect WhatsApp in Dashboard > Agents > booking_assistant',
                booking_id: booking.id,
                would_send_to: clientMobile
            }, { status: 200 });
        }
        
    } catch (error) {
        console.error('❌ Error in booking confirmation function:', error);
        console.error('Error details:', error.stack);
        
        // Return success response so booking isn't blocked, but log the error
        return Response.json({ 
            success: false,
            message: 'Booking created but notification system encountered an error',
            error: error.message,
            note: 'This does not affect the booking - it was created successfully'
        }, { status: 200 });
    }
});