import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Wait for any async operations before accessing params to fix "sync-dynamic-apis" warning
    await cookies();
    const crawlId = params.id;

    if (!crawlId) {
      return NextResponse.json(
        { error: "Crawl ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Fetch the crawl data with score information
    const { data: crawlData, error: crawlError } = await supabase
      .from("crawls")
      .select("aeo_score, seo_score")
      .eq("id", crawlId)
      .single();
    
    if (crawlError) {
      console.error("[API scores] Error fetching crawl:", crawlError);
      return NextResponse.json(
        { error: "Failed to fetch crawl data" },
        { status: 500 }
      );
    }
    
    if (!crawlData) {
      return NextResponse.json(
        { error: "Crawl not found" },
        { status: 404 }
      );
    }
    
    // Calculate average scores from pages if crawl scores are not available
    if (crawlData.aeo_score === null || crawlData.seo_score === null) {
      const { data: pagesData, error: pagesError } = await supabase
        .from("pages")
        .select("aeo_score, seo_score")
        .eq("crawl_id", crawlId);
      
      if (pagesError) {
        console.error("[API scores] Error fetching pages:", pagesError);
        return NextResponse.json(
          { error: "Failed to fetch page data" },
          { status: 500 }
        );
      }
      
      // Calculate average scores from pages
      let totalAeo = 0;
      let totalSeo = 0;
      let countAeo = 0;
      let countSeo = 0;
      
      pagesData.forEach(page => {
        if (page.aeo_score !== null) {
          totalAeo += page.aeo_score;
          countAeo++;
        }
        if (page.seo_score !== null) {
          totalSeo += page.seo_score;
          countSeo++;
        }
      });
      
      const averageAeo = countAeo > 0 ? Math.round(totalAeo / countAeo) : 0;
      const averageSeo = countSeo > 0 ? Math.round(totalSeo / countSeo) : 0;
      
      // Update crawl scores in database
      const { error: updateError } = await supabase
        .from("crawls")
        .update({
          aeo_score: averageAeo,
          seo_score: averageSeo
        })
        .eq("id", crawlId);
      
      if (updateError) {
        console.error("[API scores] Error updating crawl scores:", updateError);
      }
      
      // Return calculated scores
      return NextResponse.json({
        aeo_score: averageAeo,
        seo_score: averageSeo
      });
    }
    
    // Return scores directly from crawl data
    return NextResponse.json({
      aeo_score: crawlData.aeo_score,
      seo_score: crawlData.seo_score
    });
  } catch (error) {
    console.error("[API scores] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 