import { NextRequest, NextResponse } from "next/server";

const LINKEDIN_ENDPOINTS = [
  "https://www.linkedin.com/voyager/api/saveDashSaves?count=40&start=0&q=savedByMe",
  "https://www.linkedin.com/voyager/api/voyagerContentDashSaves?count=40&start=0&q=savedByMe",
];

function buildHeaders(cookie: string) {
  const csrfToken = Math.random().toString(36).substring(2);
  return {
    Accept: "application/vnd.linkedin.normalized+json+2.1",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "x-li-track": JSON.stringify({
      clientVersion: "1.13.8",
      mpVersion: "1.13.8",
      osName: "web",
      timezoneOffset: 0,
      deviceFormFactor: "DESKTOP",
    }),
    Cookie: `li_at=${cookie}; JSESSIONID="ajax:${csrfToken}"`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "csrf-token": `ajax:${csrfToken}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { cookie } = await request.json();

    if (!cookie || typeof cookie !== "string") {
      return NextResponse.json(
        { error: "LinkedIn session cookie (li_at) is required" },
        { status: 400 }
      );
    }

    const headers = buildHeaders(cookie);
    let lastStatus = 0;
    let lastBody = "";

    for (const endpoint of LINKEDIN_ENDPOINTS) {
      const response = await fetch(endpoint, { method: "GET", headers });

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            error:
              "LinkedIn session expired or invalid. Please update your li_at cookie.",
          },
          { status: 401 }
        );
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`LinkedIn endpoint succeeded: ${endpoint}`);
        return NextResponse.json(data);
      }

      lastStatus = response.status;
      lastBody = await response.text().catch(() => "");
      console.log(
        `LinkedIn endpoint returned ${response.status}: ${endpoint}`
      );

      // Only retry on 404 (endpoint not found), not on other errors
      if (response.status !== 404) {
        return NextResponse.json(
          { error: `LinkedIn API error: ${response.status}` },
          { status: response.status }
        );
      }
    }

    // All endpoints returned 404
    return NextResponse.json(
      {
        error:
          "LinkedIn saved posts endpoint not available. LinkedIn may have changed their internal API. " +
          `Last status: ${lastStatus}. Please report this issue.`,
        debug: lastBody.substring(0, 200),
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("LinkedIn API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to LinkedIn. Please try again." },
      { status: 500 }
    );
  }
}
