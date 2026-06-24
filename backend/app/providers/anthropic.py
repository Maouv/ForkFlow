import httpx

from app.providers.base import ProviderAdapter


class AnthropicAdapter(ProviderAdapter):
    async def call(
        self,
        base_url: str,
        api_key: str,
        messages: list[dict],
        model: str,
        tools: list[dict] | None = None,
        timeout: int = 60,
    ) -> str:
        # Anthropic: system prompt separate from messages
        system = ""
        chat_messages = []
        for m in messages:
            if m["role"] == "system":
                system += m["content"] + "\n"
            else:
                chat_messages.append(m)

        payload: dict = {
            "model": model,
            "messages": chat_messages,
            "system": system.strip(),
            "max_tokens": 4096,
        }
        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base_url}/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]
