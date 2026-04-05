"""POST /api/v1/ai/solution — proxy AI requests through the backend.

Supports two providers with automatic fallback:
  1. OpenRouter  (if OPENROUTER_API_KEY is set)
  2. Google Gemini (if GEMINI_API_KEY is set)

Set the key in .env — the backend picks the first available provider.
"""

from __future__ import annotations

import logging
from typing import Annotated, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user, UserContext

log = logging.getLogger(__name__)

router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class SolutionRequest(BaseModel):
    level: str
    message: str
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    service: Optional[str] = None
    module: Optional[str] = None
    stack_trace: Optional[str] = None


class SolutionResponse(BaseModel):
    solution: str


# ─── Shared prompt builder ────────────────────────────────────────────────────

SYSTEM_MSG = (
    "You are a concise senior software engineer. "
    "Give short, actionable answers. Use markdown headers (##) and bullet points. No filler text."
)

def _build_prompt(body: SolutionRequest) -> str:
    stack_snippet = ""
    if body.stack_trace:
        stack_snippet = "\n".join(body.stack_trace.split("\n")[:6])

    return f"""Analyze this error log and give a concise fix.

Level: {body.level}
Message: {body.message}
Error Type: {body.error_type or 'Unknown'}{f'{chr(10)}Error: {body.error_message}' if body.error_message else ''}
Service: {body.service or 'Unknown'} | Module: {body.module or 'Unknown'}
Stack (top): {stack_snippet or 'N/A'}

Reply with EXACTLY these 3 sections (keep each short, 2-4 bullets max):

## Root Cause
(What went wrong in 1-2 sentences)

## Fix
(Step-by-step fix, 2-4 bullets, include a short code snippet if helpful)

## Prevention
(2-3 bullets to prevent recurrence)"""


# ─── Provider: OpenRouter ─────────────────────────────────────────────────────

async def _call_openrouter(prompt: str, api_key: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {"role": "system", "content": SYSTEM_MSG},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 700,
            },
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
    data = resp.json()
    if resp.status_code != 200:
        raise RuntimeError(data.get("error", {}).get("message", f"OpenRouter {resp.status_code}"))
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not text:
        raise RuntimeError("OpenRouter returned empty response")
    return text


# ─── Provider: Google Gemini ──────────────────────────────────────────────────

async def _call_gemini(prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            url,
            json={
                "contents": [{"parts": [{"text": f"{SYSTEM_MSG}\n\n{prompt}"}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 700},
            },
            headers={"Content-Type": "application/json"},
        )
    data = resp.json()
    if resp.status_code != 200:
        msg = data.get("error", {}).get("message", f"Gemini {resp.status_code}")
        raise RuntimeError(msg)
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not text:
        raise RuntimeError("Gemini returned empty response")
    return text


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/ai/solution", response_model=SolutionResponse)
async def get_ai_solution(
    body: SolutionRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Generate an AI-powered solution for an error log.

    Tries OpenRouter first, then Gemini. Returns the first successful result.
    """
    prompt = _build_prompt(body)
    errors: list[str] = []

    # Try OpenRouter
    if settings.OPENROUTER_API_KEY:
        try:
            text = await _call_openrouter(prompt, settings.OPENROUTER_API_KEY)
            return SolutionResponse(solution=text)
        except Exception as exc:
            errors.append(f"OpenRouter: {exc}")
            log.warning("OpenRouter failed: %s", exc)

    # Try Gemini
    if settings.GEMINI_API_KEY:
        try:
            text = await _call_gemini(prompt, settings.GEMINI_API_KEY)
            return SolutionResponse(solution=text)
        except Exception as exc:
            errors.append(f"Gemini: {exc}")
            log.warning("Gemini failed: %s", exc)

    # Nothing worked
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI not configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY in .env",
        )

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"All AI providers failed: {'; '.join(errors)}",
    )
