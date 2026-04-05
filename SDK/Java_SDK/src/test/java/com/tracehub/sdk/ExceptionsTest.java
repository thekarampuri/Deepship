package com.tracehub.sdk;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExceptionsTest {

    @Test
    void testTraceHubError() {
        TraceHubError error = new TraceHubError("base error");
        assertEquals("base error", error.getMessage());
        assertInstanceOf(RuntimeException.class, error);
    }

    @Test
    void testConfigError() {
        TraceHubConfigError error = new TraceHubConfigError("bad config");
        assertEquals("bad config", error.getMessage());
        assertInstanceOf(TraceHubError.class, error);
        assertInstanceOf(RuntimeException.class, error);
    }

    @Test
    void testTransportError() {
        TraceHubTransportError error = new TraceHubTransportError("connection refused");
        assertEquals("connection refused", error.getMessage());
        assertInstanceOf(TraceHubError.class, error);
    }

    @Test
    void testConfigErrorValidation() {
        assertThrows(TraceHubConfigError.class, () -> {
            TraceHubConfig config = TraceHubConfig.builder()
                    .service("svc")
                    .environment("dev");
            new TraceHubLogger(config); // Missing api_key
        });

        assertThrows(TraceHubConfigError.class, () -> {
            TraceHubConfig config = TraceHubConfig.builder()
                    .apiKey("invalid_key") // Doesn't start with th_
                    .service("svc")
                    .environment("dev");
            new TraceHubLogger(config);
        });
    }
}
