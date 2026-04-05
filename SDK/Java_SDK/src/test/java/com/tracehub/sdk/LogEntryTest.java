package com.tracehub.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LogEntryTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void testSerializeToJson() throws Exception {
        LogEntry entry = new LogEntry();
        entry.setLevel(LogLevel.ERROR);
        entry.setMessage("Payment failed");
        entry.setTimestamp("2026-04-05T14:30:00.123+00:00");
        entry.setService("billing-service");
        entry.setEnvironment("production");
        entry.setHost("server-1");
        entry.setPid(12345);
        entry.setThreadId("worker-1");
        entry.setSdkVersion("1.2.0");
        entry.setTraceId("abc123");
        entry.setModule("payments");
        entry.setErrorType("ConnectionError");
        entry.setErrorMessage("gateway timeout");
        entry.setExtra(Map.of("user_id", "usr_42"));

        String json = MAPPER.writeValueAsString(entry);
        assertNotNull(json);

        // Deserialize back
        LogEntry restored = MAPPER.readValue(json, LogEntry.class);
        assertEquals("ERROR", restored.getLevel());
        assertEquals("Payment failed", restored.getMessage());
        assertEquals("billing-service", restored.getService());
        assertEquals("production", restored.getEnvironment());
        assertEquals("server-1", restored.getHost());
        assertEquals(12345, restored.getPid());
        assertEquals("abc123", restored.getTraceId());
        assertEquals("payments", restored.getModule());
        assertEquals("ConnectionError", restored.getErrorType());
        assertEquals("gateway timeout", restored.getErrorMessage());
    }

    @Test
    void testNullTraceIdSerializesAsNull() throws Exception {
        LogEntry entry = new LogEntry();
        entry.setLevel(LogLevel.INFO);
        entry.setMessage("test");
        entry.setTimestamp("2026-04-05T10:00:00.000+00:00");
        entry.setService("svc");
        entry.setEnvironment("dev");
        entry.setHost("host");
        entry.setPid(1);
        entry.setThreadId("main");
        entry.setSdkVersion("1.2.0");

        String json = MAPPER.writeValueAsString(entry);
        assertTrue(json.contains("\"trace_id\":null"));
    }

    @Test
    void testEmptyExtraSerializesAsEmptyObject() throws Exception {
        LogEntry entry = new LogEntry();
        entry.setLevel(LogLevel.DEBUG);
        entry.setMessage("msg");
        entry.setTimestamp("ts");
        entry.setService("s");
        entry.setEnvironment("e");
        entry.setHost("h");
        entry.setPid(0);
        entry.setThreadId("t");
        entry.setSdkVersion("1.2.0");

        String json = MAPPER.writeValueAsString(entry);
        assertTrue(json.contains("\"extra\":{}"));
    }
}
