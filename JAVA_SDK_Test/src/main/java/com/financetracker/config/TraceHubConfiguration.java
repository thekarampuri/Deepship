package com.financetracker.config;

import com.tracehub.sdk.TraceHubConfig;
import com.tracehub.sdk.TraceHubLogger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TraceHubConfiguration {

    @Value("${tracehub.api-key}")
    private String apiKey;

    @Value("${tracehub.service}")
    private String service;

    @Value("${tracehub.environment}")
    private String environment;

    @Value("${tracehub.endpoint:http://103.127.146.14}")
    private String endpoint;

    @Bean
    public TraceHubLogger traceHubLogger() {
        TraceHubConfig config = TraceHubConfig.builder()
                .apiKey(apiKey)
                .service(service)
                .environment(environment)
                .endpoint(endpoint)
                .batchSize(5)
                .flushInterval(2.0)
                .compress(false);

        TraceHubLogger logger = new TraceHubLogger(config);
        logger.info("Finance Tracker application started", "startup",
                new java.util.HashMap<>(java.util.Map.of(
                        "version", "1.0.0",
                        "java_version", System.getProperty("java.version"),
                        "os", System.getProperty("os.name")
                )));
        return logger;
    }
}
