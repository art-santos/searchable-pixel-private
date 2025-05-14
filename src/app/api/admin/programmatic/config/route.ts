'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SeoConfigData {
    seo_system_prompt?: string | null;
    seo_keywords?: string | null;
}

// GET handler to fetch the current SEO configuration for the logged-in user
export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('programmatic_seo_config')
            .select('seo_system_prompt, seo_keywords')
            .eq('user_id', user.id) // Fetch config specific to the user
            .maybeSingle(); // Expect one or zero rows

        if (error) {
            console.error("Supabase GET error:", error);
            throw new Error('Failed to fetch SEO configuration.');
        }

        // Return the config or default empty values if not found
        const config: SeoConfigData = data || { seo_system_prompt: null, seo_keywords: null };
        return NextResponse.json(config, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching SEO config:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch configuration' }, { status: 500 });
    }
}

// POST handler to save/update the SEO configuration for the logged-in user
export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let configData: SeoConfigData;
    try {
        configData = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Basic validation (can add more)
    if (typeof configData.seo_system_prompt === 'undefined' && typeof configData.seo_keywords === 'undefined') {
        return NextResponse.json({ error: 'Missing fields to update' }, { status: 400 });
    }

    try {
        // Use upsert to either insert a new config or update the existing one for the user
        const { data, error } = await supabase
            .from('programmatic_seo_config')
            .upsert({
                user_id: user.id, // Ensure user_id is set
                seo_system_prompt: configData.seo_system_prompt || null,
                seo_keywords: configData.seo_keywords || null,
                updated_at: new Date().toISOString(), // Manually set updated_at or rely on trigger
            }, {
                onConflict: 'user_id', // If a row with this user_id exists, update it
            })
            .select('seo_system_prompt, seo_keywords') // Return the saved data
            .single(); // Expect one row

        if (error) {
            console.error("Supabase POST/upsert error:", error);
            throw new Error('Failed to save SEO configuration.');
        }

        console.log("SEO Config saved successfully for user:", user.id);
        return NextResponse.json({ message: 'Configuration saved successfully', data }, { status: 200 });

    } catch (error: any) {
        console.error("Error saving SEO config:", error);
        return NextResponse.json({ error: error.message || 'Failed to save configuration' }, { status: 500 });
    }
} 