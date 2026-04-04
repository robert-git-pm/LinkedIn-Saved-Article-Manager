// ==UserScript==
// @name         LAMP – LinkedIn Article Importer
// @namespace    https://lamp-app.vercel.app
// @version      1.0
// @description  Extracts saved LinkedIn posts and sends them to LAMP via postMessage
// @author       LAMP
// @match        https://www.linkedin.com/my-items/saved-posts/*
// @match        https://www.linkedin.com/my-items/
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  var sent = false;

  function extractText(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || "").trim();
  }

  function extractArticles() {
    var articles = [];
    var seen = new Set();

    // Strategy 1: data-urn or data-id on list items
    var candidates = Array.from(
      document.querySelectorAll(
        "[data-urn], [data-id], .scaffold-finite-scroll__content li, .reusable-search__result-container"
      )
    );

    // Deduplicate by element
    var uniqueCandidates = candidates.filter(function (el) {
      if (seen.has(el)) return false;
      seen.add(el);
      return true;
    });

    for (var i = 0; i < uniqueCandidates.length; i++) {
      var el = uniqueCandidates[i];

      // Skip tiny elements that are sub-elements already captured
      if (el.getBoundingClientRect().height < 50) continue;

      var id =
        el.getAttribute("data-urn") ||
        el.getAttribute("data-id") ||
        "lamp-" + Date.now() + "-" + i;

      // Get the primary link (post URL)
      var linkEl =
        el.querySelector('a[href*="/posts/"]') ||
        el.querySelector('a[href*="/pulse/"]') ||
        el.querySelector('a[href*="/feed/update/"]') ||
        el.querySelector("a[href]");
      var url = linkEl ? linkEl.href : "";

      // Get text content
      var textEl =
        el.querySelector('[class*="feed-shared-text"]') ||
        el.querySelector('[class*="attributed-text"]') ||
        el.querySelector('[class*="share-body"]') ||
        el.querySelector("span.break-words") ||
        el.querySelector("p");
      var text = extractText(textEl || el).substring(0, 500);

      // Get author
      var authorEl =
        el.querySelector('[class*="actor__name"]') ||
        el.querySelector('[class*="feed-shared-actor__name"]') ||
        el.querySelector('[data-control-name="actor"]') ||
        el.querySelector('[class*="app-aware-link"][href*="/in/"]');
      var author = extractText(authorEl) || "Unknown";

      // Get date
      var timeEl = el.querySelector("time");
      var savedAt = timeEl
        ? timeEl.getAttribute("datetime") || timeEl.innerText
        : new Date().toISOString();

      // Get article title (if sharing an external article)
      var titleEl =
        el.querySelector('[class*="article-component__title"]') ||
        el.querySelector('[class*="feed-shared-article__title"]') ||
        el.querySelector('h2') ||
        el.querySelector('h3');
      var title = extractText(titleEl) || text.substring(0, 120) || "LinkedIn Post";

      if (!text && !title) continue;

      articles.push({
        id: id,
        title: title,
        url: url,
        author: author,
        savedAt: savedAt ? new Date(savedAt).toISOString() : new Date().toISOString(),
        previewText: text.substring(0, 300),
      });
    }

    // Deduplicate by id
    var seenIds = new Set();
    return articles.filter(function (a) {
      if (seenIds.has(a.id)) return false;
      seenIds.add(a.id);
      return true;
    });
  }

  function sendToLAMP() {
    if (sent) return;
    var articles = extractArticles();
    if (articles.length === 0) {
      updateStatus("No articles found. Make sure you're on the Saved Posts page.", true);
      return;
    }
    sent = true;

    var target = window.opener;
    if (target) {
      target.postMessage(
        { type: "lamp-import", articles: articles },
        "*"
      );
      updateStatus("Sent " + articles.length + " articles to LAMP!");
      setTimeout(function () {
        window.close();
      }, 1500);
    } else {
      // Opened directly, not from LAMP popup
      updateStatus(articles.length + " articles found. Open LAMP first, then click 'Import from LinkedIn'.");
      sent = false;
    }
  }

  function updateStatus(msg, isError) {
    var statusEl = document.getElementById("lamp-status");
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = isError ? "#dc2626" : "#16a34a";
    }
  }

  function injectButton() {
    if (document.getElementById("lamp-import-btn")) return;

    var container = document.createElement("div");
    container.id = "lamp-import-container";
    container.style.cssText =
      "position:fixed;top:80px;right:20px;z-index:99999;background:#fff;border:1px solid #e4e4e7;" +
      "border-radius:12px;padding:12px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);font-family:system-ui,sans-serif;max-width:240px;";

    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;color:#2563eb;font-size:15px;margin-bottom:4px;";
    title.textContent = "LAMP";

    var subtitle = document.createElement("div");
    subtitle.style.cssText = "font-size:11px;color:#71717a;margin-bottom:10px;";
    subtitle.textContent = "LinkedIn Article Importer";

    var btn = document.createElement("button");
    btn.id = "lamp-import-btn";
    btn.style.cssText =
      "width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;" +
      "padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;";
    btn.textContent = "Send to LAMP";
    btn.onclick = function () {
      btn.textContent = "Sending...";
      btn.disabled = true;
      sendToLAMP();
    };

    var status = document.createElement("div");
    status.id = "lamp-status";
    status.style.cssText = "font-size:11px;margin-top:6px;color:#16a34a;min-height:14px;";

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(btn);
    container.appendChild(status);
    document.body.appendChild(container);
  }

  function init() {
    injectButton();

    // Auto-send if opened from LAMP (window.opener exists)
    if (window.opener) {
      updateStatus("Auto-importing...");
      setTimeout(function () {
        sendToLAMP();
      }, 3000);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // Page may still be loading content dynamically
    setTimeout(init, 1500);
  }

  // Re-inject button if it gets removed by React re-renders
  var observer = new MutationObserver(function () {
    if (!document.getElementById("lamp-import-btn")) {
      injectButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });
})();
