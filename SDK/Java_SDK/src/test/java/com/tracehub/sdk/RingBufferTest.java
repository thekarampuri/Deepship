package com.tracehub.sdk;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

class RingBufferTest {

    @Test
    void testPushAndDrain() {
        RingBuffer buf = new RingBuffer(100);

        LogEntry e1 = new LogEntry();
        e1.setMessage("msg1");
        LogEntry e2 = new LogEntry();
        e2.setMessage("msg2");

        buf.push(e1);
        buf.push(e2);

        assertEquals(2, buf.size());

        List<LogEntry> batch = buf.drain(1);
        assertEquals(1, batch.size());
        assertEquals("msg1", batch.get(0).getMessage());
        assertEquals(1, buf.size());

        List<LogEntry> rest = buf.drainAll();
        assertEquals(1, rest.size());
        assertEquals("msg2", rest.get(0).getMessage());
        assertTrue(buf.isEmpty());
    }

    @Test
    void testCapacityOverflow() {
        RingBuffer buf = new RingBuffer(3);

        for (int i = 0; i < 5; i++) {
            LogEntry e = new LogEntry();
            e.setMessage("msg" + i);
            buf.push(e);
        }

        assertEquals(3, buf.size());

        List<LogEntry> all = buf.drainAll();
        assertEquals("msg2", all.get(0).getMessage());
        assertEquals("msg3", all.get(1).getMessage());
        assertEquals("msg4", all.get(2).getMessage());
    }

    @Test
    void testThreadSafety() throws Exception {
        RingBuffer buf = new RingBuffer(10000);
        int numThreads = 4;
        int perThread = 500;

        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        List<Future<?>> futures = new ArrayList<>();

        for (int t = 0; t < numThreads; t++) {
            final int threadNum = t;
            futures.add(executor.submit(() -> {
                for (int i = 0; i < perThread; i++) {
                    LogEntry e = new LogEntry();
                    e.setMessage("t" + threadNum + "_" + i);
                    buf.push(e);
                }
            }));
        }

        for (Future<?> f : futures) f.get();
        executor.shutdown();

        assertEquals(numThreads * perThread, buf.size());
        List<LogEntry> all = buf.drainAll();
        assertEquals(numThreads * perThread, all.size());
        assertTrue(buf.isEmpty());
    }

    @Test
    void testEmptyDrain() {
        RingBuffer buf = new RingBuffer(10);
        assertTrue(buf.drain(5).isEmpty());
        assertTrue(buf.drainAll().isEmpty());
    }
}
