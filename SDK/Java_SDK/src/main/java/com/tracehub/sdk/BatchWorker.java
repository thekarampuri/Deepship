package com.tracehub.sdk;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class BatchWorker {

    private final RingBuffer buffer;
    private final HttpTransport transport;
    private final int batchSize;
    private final double flushIntervalSec;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger restartCount = new AtomicInteger(0);
    private static final int MAX_RESTARTS = 5;

    private Thread workerThread;
    private volatile long lastFlushTime;

    public BatchWorker(RingBuffer buffer, HttpTransport transport,
                       int batchSize, double flushIntervalSec) {
        this.buffer = buffer;
        this.transport = transport;
        this.batchSize = batchSize;
        this.flushIntervalSec = flushIntervalSec;
    }

    public void start() {
        running.set(true);
        lastFlushTime = System.currentTimeMillis();
        workerThread = new Thread(this::run, "tracehub-batch-worker");
        workerThread.setDaemon(true);
        workerThread.start();
    }

    public void stop() {
        if (!running.getAndSet(false)) return;

        if (workerThread != null) {
            workerThread.interrupt();
            try {
                workerThread.join(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Final drain
        flushRemaining();
    }

    public synchronized void notifyFlush() {
        notifyAll();
    }

    private void run() {
        while (running.get()) {
            try {
                synchronized (this) {
                    wait(1000); // Poll every 1 second
                }

                if (!running.get()) break;

                long now = System.currentTimeMillis();
                double elapsed = (now - lastFlushTime) / 1000.0;

                boolean sizeTrigger = buffer.size() >= batchSize;
                boolean timeTrigger = elapsed >= flushIntervalSec;

                if (sizeTrigger || timeTrigger) {
                    flush();
                    lastFlushTime = System.currentTimeMillis();
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("[TraceHub] BatchWorker error: " + e.getMessage());
                int count = restartCount.incrementAndGet();
                if (count >= MAX_RESTARTS) {
                    System.err.println("[TraceHub] BatchWorker max restarts reached, stopping");
                    running.set(false);
                    break;
                }
                try {
                    Thread.sleep(2000); // Cooldown before restart
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void flush() {
        while (buffer.size() > 0) {
            List<LogEntry> batch = buffer.drain(batchSize);
            if (batch.isEmpty()) break;
            transport.send(batch);
        }
    }

    private void flushRemaining() {
        List<LogEntry> remaining = buffer.drainAll();
        if (remaining.isEmpty()) return;

        for (int i = 0; i < remaining.size(); i += batchSize) {
            int end = Math.min(i + batchSize, remaining.size());
            List<LogEntry> batch = remaining.subList(i, end);
            transport.send(batch);
        }
    }
}
