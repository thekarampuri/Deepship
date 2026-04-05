package com.tracehub.sdk;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LogLevelTest {

    @Test
    void testLogLevelValues() {
        assertEquals("DEBUG", LogLevel.DEBUG.getValue());
        assertEquals("INFO", LogLevel.INFO.getValue());
        assertEquals("WARN", LogLevel.WARN.getValue());
        assertEquals("ERROR", LogLevel.ERROR.getValue());
        assertEquals("FATAL", LogLevel.FATAL.getValue());
    }

    @Test
    void testFromString() {
        assertEquals(LogLevel.DEBUG, LogLevel.fromString("DEBUG"));
        assertEquals(LogLevel.INFO, LogLevel.fromString("INFO"));
        assertEquals(LogLevel.WARN, LogLevel.fromString("WARN"));
        assertEquals(LogLevel.ERROR, LogLevel.fromString("ERROR"));
        assertEquals(LogLevel.FATAL, LogLevel.fromString("FATAL"));
    }

    @Test
    void testFromStringCaseInsensitive() {
        assertEquals(LogLevel.DEBUG, LogLevel.fromString("debug"));
        assertEquals(LogLevel.ERROR, LogLevel.fromString("error"));
    }

    @Test
    void testFromStringUnknownDefaultsToInfo() {
        assertEquals(LogLevel.INFO, LogLevel.fromString("UNKNOWN"));
        assertEquals(LogLevel.INFO, LogLevel.fromString(""));
    }

    @Test
    void testToString() {
        assertEquals("DEBUG", LogLevel.DEBUG.toString());
        assertEquals("FATAL", LogLevel.FATAL.toString());
    }
}
