package com.tracehub.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SerializerTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private LogEntry makeEntry(String message) {
        LogEntry e = new LogEntry();
        e.setLevel(LogLevel.INFO);
        e.setMessage(message);
        e.setTimestamp("2026-04-05T10:00:00.000+00:00");
        e.setService("test-svc");
        e.setEnvironment("dev");
        e.setHost("localhost");
        e.setPid(1);
        e.setThreadId("main");
        e.setSdkVersion("1.2.0");
        return e;
    }

    @Test
    void testSerializeJson() throws Exception {
        List<LogEntry> entries = List.of(makeEntry("test message"));

        Serializer.SerializedPayload result = Serializer.serialize(entries, false);

        assertFalse(result.isCompressed());
        assertTrue(result.getData().length > 0);

        // Verify valid JSON
        var json = MAPPER.readTree(result.getData());
        assertTrue(json.isArray());
        assertEquals(1, json.size());
        assertEquals("test message", json.get(0).get("message").asText());
    }

    @Test
    void testSerializeGzip() {
        List<LogEntry> entries = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            entries.add(makeEntry("message " + i));
        }

        var uncompressed = Serializer.serialize(entries, false);
        var compressed = Serializer.serialize(entries, true);

        assertFalse(uncompressed.isCompressed());
        assertTrue(compressed.isCompressed());
        assertTrue(compressed.getData().length < uncompressed.getData().length);
    }

    @Test
    void testSerializeBatch() throws Exception {
        List<LogEntry> entries = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            entries.add(makeEntry("batch entry " + i));
        }

        var result = Serializer.serialize(entries, false);
        var json = MAPPER.readTree(result.getData());
        assertEquals(50, json.size());
    }
}
