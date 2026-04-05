package com.tracehub.sdk;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class HttpTransport {

    private final String ingestUrl;
    private final String apiKey;
    private final int maxRetries;
    private final Duration timeout;
    private final boolean compress;
    private final DeadLetterQueue dlq;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    private volatile HttpClient client;

    public HttpTransport(String endpoint, String apiKey, int maxRetries,
                         double timeoutSec, boolean compress, String dlqPath) {
        this.ingestUrl = endpoint + "/api/v1/ingest";
        this.apiKey = apiKey;
        this.maxRetries = maxRetries;
        this.timeout = Duration.ofMillis((long) (timeoutSec * 1000));
        this.compress = compress;
        this.dlq = new DeadLetterQueue(dlqPath);
        createClient();
    }

    public boolean send(List<LogEntry> entries) {
        Serializer.SerializedPayload payload;
        try {
            payload = Serializer.serialize(entries, compress);
        } catch (Exception e) {
            System.err.println("[TraceHub] Serialization error: " + e.getMessage());
            dlq.save(entries);
            return false;
        }

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            if (attempt > 0) {
                try {
                    long backoff = (1L << attempt) * 1000; // 2^attempt seconds
                    Thread.sleep(backoff);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            try {
                HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(ingestUrl))
                        .timeout(timeout)
                        .header("X-API-Key", apiKey)
                        .header("Content-Type", "application/json");

                if (payload.isCompressed()) {
                    reqBuilder.header("Content-Encoding", "gzip");
                }

                reqBuilder.POST(HttpRequest.BodyPublishers.ofByteArray(payload.getData()));

                HttpResponse<String> response = client.send(
                        reqBuilder.build(),
                        HttpResponse.BodyHandlers.ofString());

                int statusCode = response.statusCode();

                if (statusCode == 200 || statusCode == 202) {
                    consecutiveFailures.set(0);
                    return true;
                }

                if (statusCode >= 400 && statusCode < 500) {
                    System.err.println("[TraceHub] Client error " + statusCode + ", saving to DLQ");
                    dlq.save(entries);
                    return false;
                }

                // Server error — retry
                handleFailure(attempt);

            } catch (Exception e) {
                handleFailure(attempt);
                if (attempt < maxRetries) {
                    System.err.println("[TraceHub] Retry " + (attempt + 1) + "/" + maxRetries
                            + " after error: " + e.getMessage());
                }
            }
        }

        System.err.println("[TraceHub] All retries exhausted, saving to DLQ");
        dlq.save(entries);
        return false;
    }

    public void replayDlq() {
        List<List<LogEntry>> batches = dlq.loadAll();
        for (List<LogEntry> batch : batches) {
            try {
                send(batch);
            } catch (Exception ignored) {
                // Best-effort replay
            }
        }
    }

    private void handleFailure(int attempt) {
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= 2) {
            recreateClient();
            consecutiveFailures.set(0);
        }
    }

    private void createClient() {
        this.client = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .build();
    }

    private synchronized void recreateClient() {
        createClient();
    }
}
