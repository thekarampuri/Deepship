"""Error fingerprinting for issue deduplication."""

from __future__ import annotations

import hashlib
import re


# Patterns stripped from messages before hashing so that dynamic values
# (timestamps, UUIDs, numbers) don't create unique fingerprints per event.
_NORMALISE_RE = re.compile(
    r"""
      [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}  # UUIDs
    | \d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}                         # timestamps
    | 0x[0-9a-fA-F]+                                                   # hex addresses
    | \d+                                                               # numbers
    """,
    re.VERBOSE,
)


def _normalise(text: str) -> str:
    return _NORMALISE_RE.sub("?", text).strip()


def _extract_frames(stack_trace: str) -> str:
    """Keep file + function from each frame but strip line numbers."""
    lines: list[str] = []
    for line in stack_trace.splitlines():
        stripped = line.strip()
        # Python-style: '  File "foo.py", line 42, in bar'
        m = re.match(r'File "(.+?)", line \d+, in (.+)', stripped)
        if m:
            lines.append(f"{m.group(1)}:{m.group(2)}")
            continue
        # Java/JS-style: 'at com.example.Foo.bar(Foo.java:42)'
        m = re.match(r"at (.+?)\((.+?):\d+\)", stripped)
        if m:
            lines.append(f"{m.group(1)}:{m.group(2)}")
            continue
    # Keep top 5 frames max
    return "\n".join(lines[:5])


def generate_fingerprint(
    project_id: str,
    error_type: str | None,
    stack_trace: str | None,
    message: str,
) -> str:
    """Return a 64-char hex SHA-256 fingerprint for issue grouping."""
    if stack_trace:
        frames = _extract_frames(stack_trace)
        key = f"{project_id}|{error_type or ''}|{frames}"
    elif error_type:
        key = f"{project_id}|{error_type}|{_normalise(message)}"
    else:
        key = f"{project_id}|{_normalise(message)}"

    return hashlib.sha256(key.encode()).hexdigest()
