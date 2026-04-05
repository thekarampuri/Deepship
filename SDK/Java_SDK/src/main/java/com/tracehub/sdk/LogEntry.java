package com.tracehub.sdk;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.ALWAYS)
public class LogEntry {

    @JsonProperty("level")
    private String level;

    @JsonProperty("message")
    private String message;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("service")
    private String service;

    @JsonProperty("environment")
    private String environment;

    @JsonProperty("host")
    private String host;

    @JsonProperty("pid")
    private int pid;

    @JsonProperty("thread_id")
    private String threadId;

    @JsonProperty("sdk_version")
    private String sdkVersion;

    @JsonProperty("trace_id")
    private String traceId;

    @JsonProperty("module")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String module;

    @JsonProperty("stack_trace")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String stackTrace;

    @JsonProperty("error_type")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String errorType;

    @JsonProperty("error_message")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String errorMessage;

    @JsonProperty("extra")
    private Map<String, Object> extra = new HashMap<>();

    public LogEntry() {}

    // ---- Getters and Setters ----

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public void setLevel(LogLevel level) { this.level = level.getValue(); }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getService() { return service; }
    public void setService(String service) { this.service = service; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public int getPid() { return pid; }
    public void setPid(int pid) { this.pid = pid; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getSdkVersion() { return sdkVersion; }
    public void setSdkVersion(String sdkVersion) { this.sdkVersion = sdkVersion; }

    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }

    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new HashMap<>(); }
}
