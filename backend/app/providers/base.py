from abc import ABC, abstractmethod


class ProviderAdapter(ABC):
    @abstractmethod
    async def call(
        self,
        base_url: str,
        api_key: str,
        messages: list[dict],
        model: str,
        tools: list[dict] | None = None,
        timeout: int = 60,
    ) -> str:
        pass


def get_adapter(provider_type: str) -> ProviderAdapter:
    from app.providers.openai_compat import OpenAICompatAdapter
    from app.providers.anthropic import AnthropicAdapter

    if provider_type == "openai_compatible":
        return OpenAICompatAdapter()
    elif provider_type == "anthropic":
        return AnthropicAdapter()
    raise ValueError(f"Unknown provider type: {provider_type}")
