package com.tracehub.sdk;

public class TraceHubConfig {

    public static final String DEFAULT_ENDPOINT = "http://103.127.146.14";

    private String apiKey;
    private String service;
    private String environment;
    private String endpoint = DEFAULT_ENDPOINT;
    private int batchSize = 50;
    private double flushInterval = 5.0;
    private int maxBuffer = 10000;
    private int maxRetries = 3;
    private double timeout = 10.0;
    private boolean compress = true;
    private String dlqPath;

    // ---- Builder pattern ----

    public static TraceHubConfig builder() {
        return new TraceHubConfig();
    }

    public TraceHubConfig apiKey(String apiKey) { this.apiKey = apiKey; return this; }
    public TraceHubConfig service(String service) { this.service = service; return this; }
    public TraceHubConfig environment(String environment) { this.environment = environment; return this; }
    public TraceHubConfig endpoint(String endpoint) { this.endpoint = endpoint; return this; }
    public TraceHubConfig batchSize(int batchSize) { this.batchSize = batchSize; return this; }
    public TraceHubConfig flushInterval(double flushInterval) { this.flushInterval = flushInterval; return this; }
    public TraceHubConfig maxBuffer(int maxBuffer) { this.maxBuffer = maxBuffer; return this; }
    public TraceHubConfig maxRetries(int maxRetries) { this.maxRetries = maxRetries; return this; }
    public TraceHubConfig timeout(double timeout) { this.timeout = timeout; return this; }
    public TraceHubConfig compress(boolean compress) { this.compress = compress; return this; }
    public TraceHubConfig dlqPath(String dlqPath) { this.dlqPath = dlqPath; return this; }

    // ---- Getters ----

    public String getApiKey() { return apiKey; }
    public String getService() { return service; }
    public String getEnvironment() { return environment; }
    public String getEndpoint() { return endpoint; }
    public int getBatchSize() { return batchSize; }
    public double getFlushInterval() { return flushInterval; }
    public int getMaxBuffer() { return maxBuffer; }
    public int getMaxRetries() { return maxRetries; }
    public double getTimeout() { return timeout; }
    public boolean isCompress() { return compress; }
    public String getDlqPath() { return dlqPath; }
}
