package com.tracehub.sdk;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.InetAddress;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class Enricher {

    private static final DateTimeFormatter TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'")
                    .withZone(ZoneOffset.UTC);

    private static final ThreadLocal<String> TRACE_ID = new ThreadLocal<>();

    private final String service;
    private final String environment;
    private final String sdkVersion;
    private final String host;

    public Enricher(String service, String environment, String sdkVersion) {
        this.service = service;
        this.environment = environment;
        this.sdkVersion = sdkVersion;
        this.host = resolveHostname();
    }

    public static void setTraceId(String traceId) {
        TRACE_ID.set(traceId);
    }

    public static void clearTraceId() {
        TRACE_ID.remove();
    }

    public static String getTraceId() {
        return TRACE_ID.get();
    }

    public LogEntry enrich(LogLevel level, String message) {
        return enrich(level, message, null, null, null, null, null);
    }

    public LogEntry enrich(LogLevel level, String message, String module) {
        return enrich(level, message, module, null, null, null, null);
    }

    public LogEntry enrich(LogLevel level, String message, String module,
                           String errorType, String errorMessage,
                           String stackTrace, Map<String, Object> extra) {
        LogEntry entry = new LogEntry();
        entry.setLevel(level);
        entry.setMessage(message);
        entry.setTimestamp(TIMESTAMP_FORMAT.format(Instant.now()));
        entry.setService(service);
        entry.setEnvironment(environment);
        entry.setHost(host);
        entry.setPid(getProcessId());
        entry.setThreadId(Thread.currentThread().getName());
        entry.setSdkVersion(sdkVersion);
        entry.setTraceId(TRACE_ID.get());

        if (module != null && !module.isEmpty()) {
            entry.setModule(module);
        }
        if (errorType != null && !errorType.isEmpty()) {
            entry.setErrorType(errorType);
        }
        if (errorMessage != null && !errorMessage.isEmpty()) {
            entry.setErrorMessage(errorMessage);
        }
        if (stackTrace != null && !stackTrace.isEmpty()) {
            entry.setStackTrace(stackTrace);
        }
        if (extra != null && !extra.isEmpty()) {
            entry.setExtra(extra);
        }

        return entry;
    }

    public LogEntry enrich(LogLevel level, String message, String module,
                           Throwable exception, Map<String, Object> extra) {
        String errorType = null;
        String errorMessage = null;
        String stackTrace = null;

        if (exception != null) {
            errorType = exception.getClass().getName();
            errorMessage = exception.getMessage();
            StringWriter sw = new StringWriter();
            exception.printStackTrace(new PrintWriter(sw));
            stackTrace = sw.toString();
        }

        return enrich(level, message, module, errorType, errorMessage, stackTrace, extra);
    }

    private static String resolveHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private static int getProcessId() {
        return (int) ProcessHandle.current().pid();
    }
}
