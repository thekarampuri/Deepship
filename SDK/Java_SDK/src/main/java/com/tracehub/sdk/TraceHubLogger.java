package com.tracehub.sdk;

import java.util.Map;

public class TraceHubLogger implements AutoCloseable {

    public static final String SDK_VERSION = "1.2.0";

    private final TraceHubConfig config;
    private final Enricher enricher;
    private final RingBuffer buffer;
    private final HttpTransport transport;
    private final BatchWorker batcher;
    private volatile boolean closed = false;

    public TraceHubLogger(TraceHubConfig config) {
        this.config = config;
        validateConfig();

        this.enricher = new Enricher(config.getService(), config.getEnvironment(), SDK_VERSION);
        this.buffer = new RingBuffer(config.getMaxBuffer());
        this.transport = new HttpTransport(
                config.getEndpoint(),
                config.getApiKey(),
                config.getMaxRetries(),
                config.getTimeout(),
                config.isCompress(),
                config.getDlqPath());
        this.batcher = new BatchWorker(buffer, transport,
                config.getBatchSize(), config.getFlushInterval());

        // Replay previously failed batches
        transport.replayDlq();

        // Start background flush thread
        batcher.start();

        // Register shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(this::close));
    }

    // ---- Logging methods (mirror Python SDK exactly) ----

    public void debug(String message) {
        log(LogLevel.DEBUG, message, null, null, null, null, null);
    }

    public void debug(String message, String module) {
        log(LogLevel.DEBUG, message, module, null, null, null, null);
    }

    public void debug(String message, String module, Map<String, Object> extra) {
        log(LogLevel.DEBUG, message, module, null, null, null, extra);
    }

    public void info(String message) {
        log(LogLevel.INFO, message, null, null, null, null, null);
    }

    public void info(String message, String module) {
        log(LogLevel.INFO, message, module, null, null, null, null);
    }

    public void info(String message, String module, Map<String, Object> extra) {
        log(LogLevel.INFO, message, module, null, null, null, extra);
    }

    public void warn(String message) {
        log(LogLevel.WARN, message, null, null, null, null, null);
    }

    public void warn(String message, String module) {
        log(LogLevel.WARN, message, module, null, null, null, null);
    }

    public void warn(String message, String module, Map<String, Object> extra) {
        log(LogLevel.WARN, message, module, null, null, null, extra);
    }

    public void error(String message) {
        log(LogLevel.ERROR, message, null, null, null, null, null);
    }

    public void error(String message, String module) {
        log(LogLevel.ERROR, message, module, null, null, null, null);
    }

    public void error(String message, String module, String errorType,
                      String errorMessage) {
        log(LogLevel.ERROR, message, module, errorType, errorMessage, null, null);
    }

    public void error(String message, String module, String errorType,
                      String errorMessage, String stackTrace) {
        log(LogLevel.ERROR, message, module, errorType, errorMessage, stackTrace, null);
    }

    public void error(String message, String module, String errorType,
                      String errorMessage, String stackTrace, Map<String, Object> extra) {
        log(LogLevel.ERROR, message, module, errorType, errorMessage, stackTrace, extra);
    }

    public void error(String message, String module, Throwable exception) {
        LogEntry entry = enricher.enrich(LogLevel.ERROR, message, module, exception, null);
        buffer.push(entry);
    }

    public void error(String message, String module, Throwable exception,
                      Map<String, Object> extra) {
        LogEntry entry = enricher.enrich(LogLevel.ERROR, message, module, exception, extra);
        buffer.push(entry);
    }

    public void fatal(String message) {
        log(LogLevel.FATAL, message, null, null, null, null, null);
    }

    public void fatal(String message, String module) {
        log(LogLevel.FATAL, message, module, null, null, null, null);
    }

    public void fatal(String message, String module, String errorType,
                      String errorMessage) {
        log(LogLevel.FATAL, message, module, errorType, errorMessage, null, null);
    }

    public void fatal(String message, String module, String errorType,
                      String errorMessage, String stackTrace) {
        log(LogLevel.FATAL, message, module, errorType, errorMessage, stackTrace, null);
    }

    public void fatal(String message, String module, String errorType,
                      String errorMessage, String stackTrace, Map<String, Object> extra) {
        log(LogLevel.FATAL, message, module, errorType, errorMessage, stackTrace, extra);
    }

    public void fatal(String message, String module, Throwable exception) {
        LogEntry entry = enricher.enrich(LogLevel.FATAL, message, module, exception, null);
        buffer.push(entry);
    }

    public void log(LogLevel level, String message, String module,
                    String errorType, String errorMessage,
                    String stackTrace, Map<String, Object> extra) {
        if (closed) return;
        LogEntry entry = enricher.enrich(level, message, module,
                errorType, errorMessage, stackTrace, extra);
        buffer.push(entry);
    }

    // ---- Trace ID helpers ----

    public static void setTraceId(String traceId) {
        Enricher.setTraceId(traceId);
    }

    public static void clearTraceId() {
        Enricher.clearTraceId();
    }

    public static String getTraceId() {
        return Enricher.getTraceId();
    }

    // ---- Control ----

    public void flush() {
        batcher.notifyFlush();
    }

    @Override
    public void close() {
        if (closed) return;
        closed = true;
        batcher.stop();
    }

    private void validateConfig() {
        if (config.getApiKey() == null || config.getApiKey().isEmpty()) {
            throw new TraceHubConfigError("api_key is required");
        }
        if (!config.getApiKey().startsWith("th_")) {
            throw new TraceHubConfigError("api_key must start with 'th_'");
        }
        if (config.getService() == null || config.getService().isEmpty()) {
            throw new TraceHubConfigError("service is required");
        }
        if (config.getEnvironment() == null || config.getEnvironment().isEmpty()) {
            throw new TraceHubConfigError("environment is required");
        }
    }
}
