import re

import httpx


def tool_web_search(query: str) -> str:
    """DuckDuckGo HTML scrape — no API key needed, stdlib regex parse."""
    url = "https://html.duckduckgo.com/html/"
    try:
        resp = httpx.post(
            url,
            data={"q": query},
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        return f"Error: search failed: {e}"

    # Parse result links — DuckDuckGo HTML uses class="result__a"
    results = []
    for match in re.finditer(
        r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
        resp.text,
        re.DOTALL,
    ):
        href = match.group(1)
        title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
        if title and href:
            results.append(f"{title} - {href}")

    if not results:
        return "No results found."
    return "\n".join(results[:10])
