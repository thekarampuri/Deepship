package com.tracehub.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.zip.GZIPOutputStream;

public class Serializer {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static class SerializedPayload {
        private final byte[] data;
        private final boolean compressed;

        public SerializedPayload(byte[] data, boolean compressed) {
            this.data = data;
            this.compressed = compressed;
        }

        public byte[] getData() { return data; }
        public boolean isCompressed() { return compressed; }
    }

    public static SerializedPayload serialize(List<LogEntry> entries, boolean compress) {
        try {
            byte[] jsonBytes = MAPPER.writeValueAsBytes(entries);

            if (!compress) {
                return new SerializedPayload(jsonBytes, false);
            }

            // Gzip compress
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (GZIPOutputStream gzip = new GZIPOutputStream(baos)) {
                gzip.write(jsonBytes);
            }
            return new SerializedPayload(baos.toByteArray(), true);

        } catch (Exception e) {
            throw new TraceHubError("Serialization failed: " + e.getMessage(), e);
        }
    }
}
