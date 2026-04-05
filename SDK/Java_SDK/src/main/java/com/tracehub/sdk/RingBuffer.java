package com.tracehub.sdk;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class RingBuffer {

    private final int capacity;
    private final LinkedList<LogEntry> buffer = new LinkedList<>();
    private final Object lock = new Object();

    public RingBuffer(int capacity) {
        this.capacity = capacity;
    }

    public RingBuffer() {
        this(10000);
    }

    public void push(LogEntry entry) {
        synchronized (lock) {
            if (buffer.size() >= capacity) {
                buffer.removeFirst();
            }
            buffer.addLast(entry);
        }
    }

    public List<LogEntry> drain(int count) {
        synchronized (lock) {
            List<LogEntry> batch = new ArrayList<>();
            int n = Math.min(count, buffer.size());
            for (int i = 0; i < n; i++) {
                batch.add(buffer.removeFirst());
            }
            return batch;
        }
    }

    public List<LogEntry> drainAll() {
        synchronized (lock) {
            List<LogEntry> batch = new ArrayList<>(buffer);
            buffer.clear();
            return batch;
        }
    }

    public int size() {
        synchronized (lock) {
            return buffer.size();
        }
    }

    public boolean isEmpty() {
        synchronized (lock) {
            return buffer.isEmpty();
        }
    }

    public int getCapacity() {
        return capacity;
    }
}
