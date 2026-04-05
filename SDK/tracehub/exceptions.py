"""SDK-specific exceptions."""


class TraceHubError(Exception):
    """Base exception for all TraceHub SDK errors."""


class TraceHubConfigError(TraceHubError):
    """Raised when SDK configuration is invalid."""


class TraceHubTransportError(TraceHubError):
    """Raised when HTTP transport fails after all retries."""
