package com.financetracker.controller;

import com.tracehub.sdk.TraceHubLogger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/playground")
public class PlaygroundController {

    private final TraceHubLogger logger;
    private static final int[] SAMPLE_ARRAY = {10, 20, 30, 40, 50};

    public PlaygroundController(TraceHubLogger logger) {
        this.logger = logger;
    }

    @PostMapping("/calc")
    public ResponseEntity<Map<String, Object>> calculate(@RequestBody Map<String, Object> req) {
        double a = ((Number) req.get("a")).doubleValue();
        double b = ((Number) req.get("b")).doubleValue();
        String op = (String) req.get("op");

        try {
            double result;
            switch (op) {
                case "add":
                    result = a + b;
                    break;
                case "subtract":
                    result = a - b;
                    break;
                case "multiply":
                    result = a * b;
                    break;
                case "divide":
                    if (b == 0) {
                        ArithmeticException err = new ArithmeticException("Division by zero: " + a + " / " + b);
                        logger.error("Division by zero attempted", "playground", err,
                                Map.of("operation", "divide", "a", a, "b", b));
                        return ResponseEntity.badRequest().body(Map.of(
                                "error", true,
                                "type", "ArithmeticException",
                                "message", "Cannot divide " + a + " by zero",
                                "level", "ERROR"
                        ));
                    }
                    result = a / b;
                    break;
                default:
                    throw new IllegalArgumentException("Unknown operation: " + op);
            }

            logger.info("Calculation performed", "playground", Map.of(
                    "operation", op, "a", a, "b", b, "result", result));

            return ResponseEntity.ok(Map.of(
                    "error", false,
                    "result", result,
                    "level", "INFO"
            ));
        } catch (ArithmeticException e) {
            throw e; // already handled above
        } catch (Exception e) {
            logger.error("Calculation failed", "playground", e,
                    Map.of("operation", op, "a", a, "b", b));
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "type", e.getClass().getSimpleName(),
                    "message", e.getMessage(),
                    "level", "ERROR"
            ));
        }
    }

    @PostMapping("/string")
    public ResponseEntity<Map<String, Object>> stringOp(@RequestBody Map<String, Object> req) {
        String input = (String) req.get("input");
        String op = (String) req.get("op");
        Integer index = req.get("index") != null ? ((Number) req.get("index")).intValue() : null;

        try {
            if (input == null || input.isEmpty()) {
                NullPointerException err = new NullPointerException("Input string is null or empty");
                logger.error("Null string operation attempted", "playground", err,
                        Map.of("operation", op, "input_was_null", input == null, "input_was_empty", input != null));
                return ResponseEntity.badRequest().body(Map.of(
                        "error", true,
                        "type", "NullPointerException",
                        "message", "Input string is empty — cannot perform " + op,
                        "level", "ERROR"
                ));
            }

            String result;
            switch (op) {
                case "uppercase":
                    result = input.toUpperCase();
                    break;
                case "reverse":
                    result = new StringBuilder(input).reverse().toString();
                    break;
                case "length":
                    result = String.valueOf(input.length());
                    break;
                case "charAt":
                    if (index == null) {
                        throw new IllegalArgumentException("Index is required for charAt operation");
                    }
                    if (index < 0 || index >= input.length()) {
                        StringIndexOutOfBoundsException err = new StringIndexOutOfBoundsException(
                                "Index " + index + " out of bounds for string of length " + input.length());
                        logger.error("String index out of bounds", "playground", err,
                                Map.of("operation", op, "input_length", input.length(), "requested_index", index));
                        return ResponseEntity.badRequest().body(Map.of(
                                "error", true,
                                "type", "StringIndexOutOfBoundsException",
                                "message", "Index " + index + " is out of bounds (string length: " + input.length() + ")",
                                "level", "ERROR"
                        ));
                    }
                    result = String.valueOf(input.charAt(index));
                    break;
                default:
                    throw new IllegalArgumentException("Unknown operation: " + op);
            }

            logger.info("String operation performed", "playground", Map.of(
                    "operation", op, "input_length", input.length(), "result", result));

            return ResponseEntity.ok(Map.of(
                    "error", false,
                    "result", result,
                    "level", "INFO"
            ));
        } catch (Exception e) {
            logger.error("String operation failed", "playground", e,
                    Map.of("operation", op));
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "type", e.getClass().getSimpleName(),
                    "message", e.getMessage(),
                    "level", "ERROR"
            ));
        }
    }

    @PostMapping("/array")
    public ResponseEntity<Map<String, Object>> arrayAccess(@RequestBody Map<String, Object> req) {
        int index = ((Number) req.get("index")).intValue();

        try {
            if (index < 0 || index >= SAMPLE_ARRAY.length) {
                ArrayIndexOutOfBoundsException err = new ArrayIndexOutOfBoundsException(
                        "Index " + index + " out of bounds for array of length " + SAMPLE_ARRAY.length);
                logger.error("Array index out of bounds", "playground", err,
                        Map.of("requested_index", index, "array_length", SAMPLE_ARRAY.length,
                                "valid_range", "0-" + (SAMPLE_ARRAY.length - 1)));
                return ResponseEntity.badRequest().body(Map.of(
                        "error", true,
                        "type", "ArrayIndexOutOfBoundsException",
                        "message", "Index " + index + " is out of bounds (array length: " + SAMPLE_ARRAY.length + ", valid: 0-" + (SAMPLE_ARRAY.length - 1) + ")",
                        "level", "ERROR"
                ));
            }

            int value = SAMPLE_ARRAY[index];
            logger.info("Array access performed", "playground", Map.of(
                    "index", index, "value", value, "array_length", SAMPLE_ARRAY.length));

            return ResponseEntity.ok(Map.of(
                    "error", false,
                    "result", value,
                    "level", "INFO"
            ));
        } catch (Exception e) {
            logger.error("Array access failed", "playground", e,
                    Map.of("index", index));
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "type", e.getClass().getSimpleName(),
                    "message", e.getMessage(),
                    "level", "ERROR"
            ));
        }
    }

    @PostMapping("/parse")
    public ResponseEntity<Map<String, Object>> parseNumber(@RequestBody Map<String, Object> req) {
        String input = (String) req.get("input");
        String type = (String) req.get("type");

        try {
            if (input == null || input.trim().isEmpty()) {
                IllegalArgumentException err = new IllegalArgumentException("Input is empty — nothing to parse");
                logger.error("Empty parse input", "playground", err,
                        Map.of("target_type", type));
                return ResponseEntity.badRequest().body(Map.of(
                        "error", true,
                        "type", "IllegalArgumentException",
                        "message", "Input is empty — nothing to parse",
                        "level", "ERROR"
                ));
            }

            Object result;
            if ("integer".equals(type)) {
                result = Integer.parseInt(input.trim());
            } else {
                result = Double.parseDouble(input.trim());
            }

            logger.info("Parse successful", "playground", Map.of(
                    "input", input, "target_type", type, "result", result));

            return ResponseEntity.ok(Map.of(
                    "error", false,
                    "result", result,
                    "level", "INFO"
            ));
        } catch (NumberFormatException e) {
            NumberFormatException err = new NumberFormatException(
                    "Cannot parse '" + input + "' as " + type + ": " + e.getMessage());
            logger.error("Number format error", "playground", err,
                    Map.of("input", input, "target_type", type));
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "type", "NumberFormatException",
                    "message", "Cannot parse '" + input + "' as " + type,
                    "level", "ERROR"
            ));
        } catch (Exception e) {
            logger.error("Parse failed", "playground", e,
                    Map.of("input", String.valueOf(input), "target_type", type));
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "type", e.getClass().getSimpleName(),
                    "message", e.getMessage(),
                    "level", "ERROR"
            ));
        }
    }
}
