import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || '';
  
  console.log(`[TEST-API] Querying for slug: "${slug}"`);
  
  const supabase = createClient();
  
  // Get all articles first
  const { data: allArticles, error: allError } = await supabase
    .from('programmatic_pages')
    .select('id, title, slug, status')
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Get specific article if slug provided
  let specificArticle = null;
  let specificError = null;
  
  if (slug) {
    const { data, error } = await supabase
      .from('programmatic_pages')
      .select('id, title, slug, status')
      .ilike('slug', slug)
      .maybeSingle();
    
    specificArticle = data;
    specificError = error;
  }
  
  return NextResponse.json({
    slug,
    allArticles: allArticles || [],
    allError: allError?.message,
    specificArticle,
    specificError: specificError?.message
  });
} 