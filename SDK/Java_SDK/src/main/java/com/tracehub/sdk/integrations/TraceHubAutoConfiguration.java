package com.tracehub.sdk.integrations;

import com.tracehub.sdk.TraceHubConfig;
import com.tracehub.sdk.TraceHubLogger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot auto-configuration for TraceHub SDK.
 *
 * Add to application.properties or application.yml:
 * <pre>
 * tracehub.api-key=th_your_api_key
 * tracehub.service=my-service
 * tracehub.environment=production
 * </pre>
 */
@Configuration
@ConditionalOnProperty(prefix = "tracehub", name = "api-key")
public class TraceHubAutoConfiguration {

    @Bean
    @ConfigurationProperties(prefix = "tracehub")
    public TraceHubProperties traceHubProperties() {
        return new TraceHubProperties();
    }

    @Bean
    @ConditionalOnMissingBean
    public TraceHubLogger traceHubLogger(TraceHubProperties props) {
        TraceHubConfig config = TraceHubConfig.builder()
                .apiKey(props.getApiKey())
                .service(props.getService())
                .environment(props.getEnvironment())
                .endpoint(props.getEndpoint() != null ? props.getEndpoint() : TraceHubConfig.DEFAULT_ENDPOINT)
                .batchSize(props.getBatchSize())
                .flushInterval(props.getFlushInterval())
                .maxBuffer(props.getMaxBuffer())
                .maxRetries(props.getMaxRetries())
                .timeout(props.getTimeout())
                .compress(props.isCompress());

        return new TraceHubLogger(config);
    }

    @Bean
    public FilterRegistrationBean<TraceHubFilter> traceHubFilter() {
        FilterRegistrationBean<TraceHubFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new TraceHubFilter());
        bean.addUrlPatterns("/*");
        bean.setOrder(1);
        return bean;
    }

    public static class TraceHubProperties {
        private String apiKey;
        private String service;
        private String environment;
        private String endpoint;
        private int batchSize = 50;
        private double flushInterval = 5.0;
        private int maxBuffer = 10000;
        private int maxRetries = 3;
        private double timeout = 10.0;
        private boolean compress = true;

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
        public String getEnvironment() { return environment; }
        public void setEnvironment(String environment) { this.environment = environment; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }
        public double getFlushInterval() { return flushInterval; }
        public void setFlushInterval(double flushInterval) { this.flushInterval = flushInterval; }
        public int getMaxBuffer() { return maxBuffer; }
        public void setMaxBuffer(int maxBuffer) { this.maxBuffer = maxBuffer; }
        public int getMaxRetries() { return maxRetries; }
        public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
        public double getTimeout() { return timeout; }
        public void setTimeout(double timeout) { this.timeout = timeout; }
        public boolean isCompress() { return compress; }
        public void setCompress(boolean compress) { this.compress = compress; }
    }
}
