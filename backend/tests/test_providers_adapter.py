import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.providers import get_adapter
from app.providers.base import ProviderAdapter
from app.providers.openai_compat import OpenAICompatAdapter
from app.providers.anthropic import AnthropicAdapter


def test_get_adapter_openai():
    adapter = get_adapter("openai_compatible")
    assert isinstance(adapter, OpenAICompatAdapter)


def test_get_adapter_anthropic():
    adapter = get_adapter("anthropic")
    assert isinstance(adapter, AnthropicAdapter)


def test_get_adapter_unknown():
    with pytest.raises(ValueError, match="Unknown provider type"):
        get_adapter("unknown_type")


@pytest.mark.asyncio
async def test_openai_adapter_call():
    """Verify correct URL, headers, body for OpenAI-compatible API."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Hello from DeepSeek"}}]
    }

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.providers.openai_compat.httpx.AsyncClient", return_value=mock_client):
        adapter = OpenAICompatAdapter()
        result = await adapter.call(
            base_url="https://api.deepseek.com",
            api_key="sk-test123",
            messages=[
                {"role": "system", "content": "You are helpful"},
                {"role": "user", "content": "Hi"},
            ],
            model="deepseek-chat",
        )

    assert result == "Hello from DeepSeek"
    mock_client.post.assert_called_once()
    call_args = mock_client.post.call_args

    # URL check
    assert call_args.args[0] == "https://api.deepseek.com/v1/chat/completions"

    # Headers check
    headers = call_args.kwargs["headers"]
    assert headers["Authorization"] == "Bearer sk-test123"

    # Body check
    body = call_args.kwargs["json"]
    assert body["model"] == "deepseek-chat"
    assert body["messages"] == [
        {"role": "system", "content": "You are helpful"},
        {"role": "user", "content": "Hi"},
    ]
    assert body["temperature"] == 0.7


@pytest.mark.asyncio
async def test_anthropic_adapter_call():
    """Verify correct URL, headers, body for Anthropic API."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {
        "content": [{"text": "Hello from Claude"}]
    }

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.providers.anthropic.httpx.AsyncClient", return_value=mock_client):
        adapter = AnthropicAdapter()
        result = await adapter.call(
            base_url="https://api.anthropic.com",
            api_key="sk-ant-test",
            messages=[
                {"role": "system", "content": "You are helpful"},
                {"role": "user", "content": "Hi"},
            ],
            model="claude-3-5-sonnet-20241022",
        )

    assert result == "Hello from Claude"
    mock_client.post.assert_called_once()
    call_args = mock_client.post.call_args

    # URL check
    assert call_args.args[0] == "https://api.anthropic.com/v1/messages"

    # Headers check
    headers = call_args.kwargs["headers"]
    assert headers["x-api-key"] == "sk-ant-test"
    assert headers["anthropic-version"] == "2023-06-01"

    # Body check — system extracted separately
    body = call_args.kwargs["json"]
    assert body["model"] == "claude-3-5-sonnet-20241022"
    assert body["system"] == "You are helpful"
    assert body["messages"] == [{"role": "user", "content": "Hi"}]
    assert body["max_tokens"] == 4096


@pytest.mark.asyncio
async def test_anthropic_multiple_system_prompts():
    """Multiple system messages get concatenated."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"content": [{"text": "ok"}]}

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.providers.anthropic.httpx.AsyncClient", return_value=mock_client):
        adapter = AnthropicAdapter()
        await adapter.call(
            base_url="https://api.anthropic.com",
            api_key="k",
            messages=[
                {"role": "system", "content": "Rule 1"},
                {"role": "system", "content": "Rule 2"},
                {"role": "user", "content": "Go"},
            ],
            model="claude-3-5-sonnet-20241022",
        )

    body = mock_client.post.call_args.kwargs["json"]
    assert "Rule 1" in body["system"]
    assert "Rule 2" in body["system"]
    assert len(body["messages"]) == 1
    assert body["messages"][0]["role"] == "user"
