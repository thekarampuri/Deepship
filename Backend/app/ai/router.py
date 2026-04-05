"""POST /api/v1/ai/solution — proxy AI solution requests through the backend."""

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

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "google/gemini-2.0-flash-001"


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


@router.post("/ai/solution", response_model=SolutionResponse)
async def get_ai_solution(
    body: SolutionRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Generate an AI-powered solution for an error log via OpenRouter."""

    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    stack_snippet = ""
    if body.stack_trace:
        stack_snippet = "\n".join(body.stack_trace.split("\n")[:6])

    prompt = f"""Analyze this error log and give a concise fix.

Level: {body.level}
Message: {body.message}
Error Type: {body.error_type or 'Unknown'}{f'\nError: {body.error_message}' if body.error_message else ''}
Service: {body.service or 'Unknown'} | Module: {body.module or 'Unknown'}
Stack (top): {stack_snippet or 'N/A'}

Reply with EXACTLY these 3 sections (keep each short, 2-4 bullets max):

## Root Cause
(What went wrong in 1-2 sentences)

## Fix
(Step-by-step fix, 2-4 bullets, include a short code snippet if helpful)

## Prevention
(2-3 bullets to prevent recurrence)"""

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a concise senior software engineer. Give short, actionable answers. Use markdown headers (##) and bullet points. No filler text.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 700,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                OPENROUTER_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )

        if resp.status_code == 401:
            log.error("OpenRouter auth failed — check OPENROUTER_API_KEY")
            raise HTTPException(status_code=502, detail="AI authentication failed")

        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail="AI service rate limited. Try again shortly.")

        data = resp.json()

        if resp.status_code >= 400:
            detail = data.get("error", {}).get("message", f"AI error ({resp.status_code})")
            raise HTTPException(status_code=502, detail=detail)

        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not text:
            raise HTTPException(status_code=502, detail="AI returned empty response")

        return SolutionResponse(solution=text)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out")
    except HTTPException:
        raise
    except Exception:
        log.exception("AI solution request failed")
        raise HTTPException(status_code=502, detail="AI service unavailable")
