import { NextRequest, NextResponse } from "next/server";

const LINKEDIN_SAVED_POSTS_URL =
  "https://www.linkedin.com/voyager/api/graphql?queryId=voyagerSavedContentFrontend.c05db37c5ab0be34a83eb66e1f5e3b44&queryName=SavedPosts&variables=(start:0,count:40,showHidden:false)";

export async function POST(request: NextRequest) {
  try {
    const { cookie } = await request.json();

    if (!cookie || typeof cookie !== "string") {
      return NextResponse.json(
        { error: "LinkedIn session cookie (li_at) is required" },
        { status: 400 }
      );
    }

    const csrfToken = Math.random().toString(36).substring(2);

    const response = await fetch(LINKEDIN_SAVED_POSTS_URL, {
      method: "GET",
      headers: {
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
      },
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        {
          error:
            "LinkedIn session expired or invalid. Please update your li_at cookie.",
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `LinkedIn API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("LinkedIn API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved articles from LinkedIn" },
      { status: 500 }
    );
  }
}
