package com.financetracker.config;

import com.tracehub.sdk.TraceHubLogger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final TraceHubLogger logger;

    public GlobalExceptionHandler(TraceHubLogger logger) {
        this.logger = logger;
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, String>> handleNullPointer(NullPointerException e) {
        logger.error("NullPointerException caught", "error-handler", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Null pointer exception", "type", "NullPointerException"));
    }

    @ExceptionHandler(ArithmeticException.class)
    public ResponseEntity<Map<String, String>> handleArithmetic(ArithmeticException e) {
        logger.error("ArithmeticException caught", "error-handler", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Arithmetic error: " + e.getMessage(), "type", "ArithmeticException"));
    }

    @ExceptionHandler(StackOverflowError.class)
    public ResponseEntity<Map<String, String>> handleStackOverflow(StackOverflowError e) {
        logger.error("StackOverflowError caught", "error-handler",
                "StackOverflowError", e.getMessage() != null ? e.getMessage() : "Stack overflow", "");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Stack overflow error", "type", "StackOverflowError"));
    }

    @ExceptionHandler(OutOfMemoryError.class)
    public ResponseEntity<Map<String, String>> handleOOM(OutOfMemoryError e) {
        logger.fatal("OutOfMemoryError caught", "error-handler",
                "OutOfMemoryError", e.getMessage() != null ? e.getMessage() : "Out of memory", "");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Out of memory: " + e.getMessage(), "type", "OutOfMemoryError"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        logger.error("Business logic error", "error-handler", e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage(), "type", "BusinessError"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        logger.error("Unhandled exception", "error-handler", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error", "type", e.getClass().getSimpleName()));
    }
}
