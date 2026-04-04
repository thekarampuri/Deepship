"""SDK-specific exceptions."""


class SentinelError(Exception):
    """Base exception for all Sentinel SDK errors."""


class SentinelConfigError(SentinelError):
    """Raised when SDK configuration is invalid."""


class SentinelTransportError(SentinelError):
    """Raised when HTTP transport fails after all retries."""
