import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { id } = await req.json();

        if (!id) {
            return Response.json({ error: 'Missing lead ID' }, { status: 400 });
        }

        // Delete the lead record — no auth required (public unsubscribe link)
        await base44.asServiceRole.entities.LeadInquiry.delete(id);

        console.log(`✅ Lead ${id} deleted via unsubscribe`);
        return Response.json({ success: true });

    } catch (error) {
        console.error('❌ unsubscribeLead error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});