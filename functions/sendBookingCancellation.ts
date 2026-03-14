import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { booking } = await req.json();
        
        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }
        
        if (!booking.whatsapp_consent) {
            return Response.json({ 
                success: false,
                message: 'Client did not consent to WhatsApp notifications' 
            }, { status: 200 });
        }
        
        let clientMobile = booking.client_mobile;
        let clientName = booking.client_name || 'Valued Client';
        let furkidName = booking.furkid_name || 'your furkid';
        
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
        
        if (!clientMobile) {
            return Response.json({ 
                success: false,
                message: 'No client mobile number found',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        if (!clientMobile.startsWith('+') || clientMobile.length < 8) {
            return Response.json({ 
                success: false,
                message: 'Invalid mobile number format',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        const message = `❌ *Booking Cancelled*

Hi ${clientName},

We're writing to confirm that your booking for *${booking.service_name}* with ${furkidName} has been cancelled.

If this was done in error or if you'd like to reschedule, please contact our admin team at +65 8222 8376. We'd be happy to help you find a new slot!

We hope to see you and ${furkidName} again soon! 🐾

_- Hopefordogs Training Team_ 🐕`;

        try {
            const conversation = await base44.asServiceRole.agents.createConversation({
                agent_name: 'booking_assistant',
                metadata: {
                    booking_id: booking.id,
                    client_mobile: clientMobile,
                    client_name: clientName,
                    type: 'booking_cancellation'
                }
            });
            
            await base44.asServiceRole.agents.addMessage(conversation, {
                role: 'assistant',
                content: message
            });
            
            return Response.json({ 
                success: true, 
                message: 'Booking cancellation notification sent successfully',
                conversation_id: conversation.id
            });
        } catch (agentError) {
            return Response.json({ 
                success: false,
                message: 'Booking cancelled but WhatsApp notification could not be sent',
                reason: 'WhatsApp agent not connected',
                booking_id: booking.id
            }, { status: 200 });
        }
        
    } catch (error) {
        console.error('Error sending booking cancellation:', error);
        return Response.json({ 
            success: false,
            message: 'Booking cancelled but notification system encountered an error',
            error: error.message
        }, { status: 200 });
    }
});