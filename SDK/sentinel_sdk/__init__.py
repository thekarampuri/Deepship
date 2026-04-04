"""Sentinel SDK — lightweight, non-blocking log ingestion for Python apps."""

__version__ = "1.0.0"

from sentinel_sdk.client import SentinelLogger
from sentinel_sdk.exceptions import (
    SentinelError,
    SentinelConfigError,
    SentinelTransportError,
)

__all__ = [
    "SentinelLogger",
    "SentinelError",
    "SentinelConfigError",
    "SentinelTransportError",
]
