package com.tracehub.sdk.integrations;

import com.tracehub.sdk.Enricher;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.UUID;

/**
 * Spring Boot / Jakarta Servlet filter for automatic trace ID propagation.
 * Mirrors the Python SDK's FastAPI/Flask/Django middleware.
 *
 * Usage in Spring Boot:
 * <pre>
 * @Bean
 * public FilterRegistrationBean<TraceHubFilter> traceHubFilter() {
 *     FilterRegistrationBean<TraceHubFilter> bean = new FilterRegistrationBean<>();
 *     bean.setFilter(new TraceHubFilter());
 *     bean.addUrlPatterns("/*");
 *     return bean;
 * }
 * </pre>
 */
public class TraceHubFilter implements Filter {

    private static final String TRACE_HEADER = "X-Trace-ID";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpResp = (HttpServletResponse) response;

        // Read or generate trace ID
        String traceId = httpReq.getHeader(TRACE_HEADER);
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        // Set on thread-local for all logs during this request
        Enricher.setTraceId(traceId);

        // Add trace ID to response header
        httpResp.setHeader(TRACE_HEADER, traceId);

        try {
            chain.doFilter(request, response);
        } finally {
            Enricher.clearTraceId();
        }
    }
}
