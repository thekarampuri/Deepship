package com.tracehub.sdk;

public enum LogLevel {
    DEBUG("DEBUG"),
    INFO("INFO"),
    WARN("WARN"),
    ERROR("ERROR"),
    FATAL("FATAL");

    private final String value;

    LogLevel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static LogLevel fromString(String s) {
        for (LogLevel level : values()) {
            if (level.value.equalsIgnoreCase(s)) {
                return level;
            }
        }
        return INFO;
    }

    @Override
    public String toString() {
        return value;
    }
}
