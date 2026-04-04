import { NextRequest, NextResponse } from "next/server";

// LinkedIn saved posts are accessed via the Search GraphQL API with a specific intent.
// We try multiple known queryIds as they rotate periodically.
const GRAPHQL_BASE = "https://www.linkedin.com/voyager/api/graphql";

const QUERY_IDS = [
  "voyagerSearchDashClusters.ed237181fcdbbd288bfcde627a5e2a07",
  "voyagerSearchDashClusters.05111e1b90ee7fea15bebe9f9410ced9",
];

function buildUrl(queryId: string, start: number, count: number): string {
  const variables = `(start:${start},count:${count},query:(flagshipSearchIntent:SEARCH_MY_ITEMS_SAVED_POSTS))`;
  return `${GRAPHQL_BASE}?queryId=${queryId}&variables=${encodeURIComponent(variables)}`;
}

function buildHeaders(cookie: string) {
  const csrfToken = Math.random().toString(36).substring(2);
  return {
    Accept: "application/vnd.linkedin.normalized+json+2.1",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "x-li-page-instance": "urn:li:page:d_flagship3_search_srp_my_items;",
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

    for (const queryId of QUERY_IDS) {
      const url = buildUrl(queryId, 0, 40);
      const response = await fetch(url, { method: "GET", headers });

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
        console.log(`LinkedIn search endpoint succeeded with queryId: ${queryId}`);
        return NextResponse.json(data);
      }

      lastStatus = response.status;
      lastBody = await response.text().catch(() => "");
      console.log(
        `LinkedIn search endpoint returned ${response.status} for queryId: ${queryId}`
      );

      // Retry on 404 or 400 (stale queryId), stop on other errors
      if (response.status !== 404 && response.status !== 400) {
        return NextResponse.json(
          {
            error: `LinkedIn API error (${response.status}). Please try again later.`,
            debug: lastBody.substring(0, 500),
          },
          { status: response.status }
        );
      }
    }

    // All queryIds failed
    return NextResponse.json(
      {
        error:
          "Could not reach LinkedIn saved posts. LinkedIn may have updated their internal API, " +
          "or your session cookie may be invalid. Try updating your li_at cookie in settings.",
        debug: `Last status: ${lastStatus}. Response: ${lastBody.substring(0, 500)}`,
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
