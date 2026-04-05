package com.tracehub.sdk;

public class TraceHubTransportError extends TraceHubError {
    public TraceHubTransportError(String message) {
        super(message);
    }

    public TraceHubTransportError(String message, Throwable cause) {
        super(message, cause);
    }
}
