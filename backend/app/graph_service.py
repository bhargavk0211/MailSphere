"""Microsoft Graph API service layer.

Provides an abstraction over Graph API calls for:
 - Fetching Teams / DL messages
 - Reading replies and attachments
 - Fetching user profiles
 - Generating deep links back to Teams messages

Falls back to mock data when Graph credentials are unavailable.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import httpx

from app.models import Message, MessageUser


class GraphService:
    """Abstraction over Microsoft Graph API with mock fallback."""

    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.client_id = os.getenv("GRAPH_CLIENT_ID", "")
        self.client_secret = os.getenv("GRAPH_CLIENT_SECRET", "")
        self.tenant_id = os.getenv("GRAPH_TENANT_ID", "")
        self.use_mock = not (self.client_id and self.client_secret and self.tenant_id)
        self._token: Optional[str] = None

    # ── Authentication ───────────────────────────────────────────────────

    async def _get_token(self) -> str:
        """Acquire an OAuth2 token via client credentials flow."""
        if self._token:
            return self._token

        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": "https://graph.microsoft.com/.default",
                },
            )
            resp.raise_for_status()
            self._token = resp.json()["access_token"]
            return self._token

    async def _graph_get(self, path: str) -> dict:
        """Make an authenticated GET request to Graph API."""
        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://graph.microsoft.com/v1.0{path}",
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            return resp.json()

    # ── Mock data layer ──────────────────────────────────────────────────

    def _load_mock_messages(self) -> list[dict]:
        path = self.data_dir / "messages.json"
        if not path.exists():
            # Try sample_dataset.json which has messages embedded
            alt = self.data_dir / "sample_dataset.json"
            if alt.exists():
                with open(alt, encoding="utf-8") as f:
                    data = json.load(f)
                return data.get("messages", [])
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    # ── Public API ───────────────────────────────────────────────────────

    async def fetch_messages(self, group_id: str = "", top: int = 50) -> list[dict]:
        """Fetch messages from a Teams channel or DL group.

        In mock mode, returns messages from the datasource files.
        In live mode, calls Graph API /groups/{id}/conversations/threads/posts.
        """
        if self.use_mock:
            messages = self._load_mock_messages()
            return messages[:top]

        # Live Graph API call
        data = await self._graph_get(
            f"/groups/{group_id}/conversations?$top={top}&$orderby=lastDeliveredDateTime desc"
        )
        return data.get("value", [])

    async def fetch_thread_replies(self, group_id: str, thread_id: str) -> list[dict]:
        """Fetch replies in a conversation thread."""
        if self.use_mock:
            messages = self._load_mock_messages()
            return [m for m in messages if m.get("thread_id") == thread_id]

        data = await self._graph_get(
            f"/groups/{group_id}/threads/{thread_id}/posts"
        )
        return data.get("value", [])

    async def fetch_user_profile(self, user_email: str) -> dict:
        """Fetch a user's profile from Graph."""
        if self.use_mock:
            return {
                "displayName": user_email.split("@")[0].replace(".", " ").title(),
                "mail": user_email,
                "jobTitle": "Software Engineer",
                "officeLocation": "Hyderabad",
            }

        data = await self._graph_get(f"/users/{user_email}")
        return data

    def generate_teams_deep_link(self, message_id: str, thread_id: str, group_id: str = "") -> str:
        """Generate a deep link to a Teams message.

        Format: https://teams.microsoft.com/l/message/{channelId}/{messageId}
        For DL/group conversations, links to Outlook group conversation.
        """
        if group_id:
            return (
                f"https://teams.microsoft.com/l/message/{group_id}/{message_id}"
            )
        # Fallback: link to outlook group conversation
        return f"https://outlook.office365.com/mail/group/hydchat@contoso.com/{thread_id}"
