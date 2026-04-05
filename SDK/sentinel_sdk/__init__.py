"""Sentinel SDK — lightweight, non-blocking log ingestion for Python apps."""

__version__ = "1.0.0"

# Default Orchid Sentinel API endpoint
DEFAULT_ENDPOINT = "http://103.127.146.14"

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
    "DEFAULT_ENDPOINT",
]
