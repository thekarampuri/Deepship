"""TraceHub SDK — lightweight, non-blocking log ingestion for Python apps."""

__version__ = "1.1.0"

# Default TraceHub API endpoint
DEFAULT_ENDPOINT = "http://103.127.146.14"

from tracehub.client import TraceHubLogger
from tracehub.exceptions import (
    TraceHubError,
    TraceHubConfigError,
    TraceHubTransportError,
)

__all__ = [
    "TraceHubLogger",
    "TraceHubError",
    "TraceHubConfigError",
    "TraceHubTransportError",
    "DEFAULT_ENDPOINT",
]
