package com.tracehub.sdk;

public class TraceHubError extends RuntimeException {
    public TraceHubError(String message) {
        super(message);
    }

    public TraceHubError(String message, Throwable cause) {
        super(message, cause);
    }
}
