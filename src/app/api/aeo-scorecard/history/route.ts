import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function GET(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_KEY
  ) {
    console.error(
      "Missing Supabase URL or Service Key for GET scorecard history route",
    );
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookieStore = nextCookies();
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options: any) => {
          const cookieStore = nextCookies();
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          const cookieStore = nextCookies();
          cookieStore.set(name, "", options);
        },
      },
    },
  );

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return NextResponse.json(
        {
          error: "Failed to authenticate session",
          details: sessionError.message,
        },
        { status: 500 },
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: summaries, error: summariesError } = await supabase
      .from("site_audit_summary")
      .select(
        `
        crawl_id,
        domain,
        started_at,
        status,
        aeo_score,
        critical_issues_count,
        warning_issues_count
      `,
      )
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (summariesError) {
      console.error(
        "Error fetching from site_audit_summary view:",
        summariesError,
      );
      return NextResponse.json(
        {
          error: "Failed to fetch scorecard history",
          details: summariesError.message,
        },
        { status: 500 },
      );
    }

    if (!summaries || summaries.length === 0) {
      return NextResponse.json([]);
    }

    const processed = summaries.map((summary) => ({
      crawl_id: summary.crawl_id,
      site_url: summary.domain || "N/A",
      created_at: summary.started_at,
      status: summary.status,
      aeo_score: summary.aeo_score || 0,
      critical_issues: summary.critical_issues_count || 0,
      warning_issues: summary.warning_issues_count || 0,
    }));

    return NextResponse.json(processed);
  } catch (error: any) {
    console.error("Unexpected error in GET /api/aeo-scorecard/history:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 },
    );
  }
}
