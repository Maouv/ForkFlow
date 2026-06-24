import httpx

from app.providers.base import ProviderAdapter


class OpenAICompatAdapter(ProviderAdapter):
    async def call(
        self,
        base_url: str,
        api_key: str,
        messages: list[dict],
        model: str,
        tools: list[dict] | None = None,
        timeout: int = 60,
    ) -> str:
        payload: dict = {"model": model, "messages": messages, "temperature": 0.7}
        if tools:
            payload["tools"] = tools
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
