package com.tracehub.sdk;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EnricherTest {

    @Test
    void testBasicEnrichment() {
        Enricher enricher = new Enricher("my-service", "production", "1.2.0");

        LogEntry entry = enricher.enrich(LogLevel.INFO, "hello world");

        assertEquals("INFO", entry.getLevel());
        assertEquals("hello world", entry.getMessage());
        assertEquals("my-service", entry.getService());
        assertEquals("production", entry.getEnvironment());
        assertEquals("1.2.0", entry.getSdkVersion());
        assertNotNull(entry.getHost());
        assertTrue(entry.getPid() > 0);
        assertNotNull(entry.getThreadId());
        assertNotNull(entry.getTimestamp());
        assertNull(entry.getTraceId());
    }

    @Test
    void testModuleAndExtra() {
        Enricher enricher = new Enricher("svc", "staging", "1.2.0");

        LogEntry entry = enricher.enrich(LogLevel.WARN, "warning msg", "payments",
                null, null, null, Map.of("user_id", "usr_42", "count", 10));

        assertEquals("payments", entry.getModule());
        assertEquals("usr_42", entry.getExtra().get("user_id"));
        assertEquals(10, entry.getExtra().get("count"));
    }

    @Test
    void testErrorFields() {
        Enricher enricher = new Enricher("svc", "dev", "1.2.0");

        LogEntry entry = enricher.enrich(LogLevel.ERROR, "failed", "payments",
                "RuntimeError", "something broke", "stack trace here", null);

        assertEquals("RuntimeError", entry.getErrorType());
        assertEquals("something broke", entry.getErrorMessage());
        assertEquals("stack trace here", entry.getStackTrace());
    }

    @Test
    void testExceptionEnrichment() {
        Enricher enricher = new Enricher("svc", "dev", "1.2.0");

        RuntimeException ex = new RuntimeException("test exception");
        LogEntry entry = enricher.enrich(LogLevel.ERROR, "caught error", "module", ex, null);

        assertEquals("java.lang.RuntimeException", entry.getErrorType());
        assertEquals("test exception", entry.getErrorMessage());
        assertNotNull(entry.getStackTrace());
        assertTrue(entry.getStackTrace().contains("RuntimeException"));
    }

    @Test
    void testTraceIdPropagation() {
        Enricher enricher = new Enricher("svc", "production", "1.2.0");

        // No trace id
        LogEntry e1 = enricher.enrich(LogLevel.INFO, "no trace");
        assertNull(e1.getTraceId());

        // Set trace id
        Enricher.setTraceId("req_abc123");
        LogEntry e2 = enricher.enrich(LogLevel.INFO, "with trace");
        assertEquals("req_abc123", e2.getTraceId());

        // Clear trace id
        Enricher.clearTraceId();
        LogEntry e3 = enricher.enrich(LogLevel.INFO, "after clear");
        assertNull(e3.getTraceId());
    }

    @Test
    void testTimestampFormat() {
        Enricher enricher = new Enricher("svc", "dev", "1.2.0");
        LogEntry entry = enricher.enrich(LogLevel.DEBUG, "test");

        String ts = entry.getTimestamp();
        assertNotNull(ts);
        assertTrue(ts.contains("T"));
        assertTrue(ts.contains("+00:00"));
    }
}
