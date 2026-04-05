package com.tracehub.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

public class DeadLetterQueue {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final Path dlqPath;

    public DeadLetterQueue(String dlqPath) {
        if (dlqPath == null || dlqPath.isEmpty()) {
            String home = System.getProperty("user.home");
            this.dlqPath = Paths.get(home, ".tracehub", "dlq");
        } else {
            this.dlqPath = Paths.get(dlqPath);
        }

        try {
            Files.createDirectories(this.dlqPath);
        } catch (IOException e) {
            System.err.println("[TraceHub] Failed to create DLQ directory: " + e.getMessage());
        }
    }

    public DeadLetterQueue() {
        this(null);
    }

    public void save(List<LogEntry> entries) {
        String filename = "failed_" + System.currentTimeMillis() + ".jsonl";
        Path filePath = dlqPath.resolve(filename);

        try (BufferedWriter writer = Files.newBufferedWriter(filePath)) {
            for (LogEntry entry : entries) {
                writer.write(MAPPER.writeValueAsString(entry));
                writer.newLine();
            }
        } catch (IOException e) {
            System.err.println("[TraceHub] Failed to write DLQ file: " + e.getMessage());
        }
    }

    public List<List<LogEntry>> loadAll() {
        List<List<LogEntry>> batches = new ArrayList<>();

        if (!Files.exists(dlqPath)) return batches;

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dlqPath, "*.jsonl")) {
            for (Path file : stream) {
                List<LogEntry> batch = new ArrayList<>();

                try (BufferedReader reader = Files.newBufferedReader(file)) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.trim().isEmpty()) continue;
                        try {
                            LogEntry entry = MAPPER.readValue(line, LogEntry.class);
                            batch.add(entry);
                        } catch (Exception ignored) {
                            // Skip malformed lines
                        }
                    }
                }

                if (!batch.isEmpty()) {
                    batches.add(batch);
                }

                // Remove processed file
                Files.deleteIfExists(file);
            }
        } catch (IOException e) {
            System.err.println("[TraceHub] Failed to read DLQ: " + e.getMessage());
        }

        return batches;
    }
}
