package com.financetracker.service;

import com.financetracker.model.Transaction;
import com.financetracker.repository.TransactionRepository;
import com.tracehub.sdk.TraceHubLogger;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TransactionService {

    private final TransactionRepository repository;
    private final TraceHubLogger logger;
    private final AtomicLong operationCounter = new AtomicLong(0);

    public TransactionService(TransactionRepository repository, TraceHubLogger logger) {
        this.repository = repository;
        this.logger = logger;
    }

    public List<Transaction> getAllTransactions() {
        long opId = operationCounter.incrementAndGet();
        try {
            List<Transaction> transactions = repository.findAll();
            logger.info("Fetched all transactions", "transactions", Map.of(
                    "operation_id", opId,
                    "count", transactions.size(),
                    "action", "LIST"
            ));
            return transactions;
        } catch (Exception e) {
            logger.error("Failed to fetch transactions", "transactions", e,
                    Map.of("operation_id", opId, "action", "LIST"));
            throw e;
        }
    }

    public Optional<Transaction> getTransaction(Long id) {
        long opId = operationCounter.incrementAndGet();
        try {
            Optional<Transaction> tx = repository.findById(id);
            if (tx.isEmpty()) {
                // Deliberate: log as error with full context when not found
                RuntimeException notFound = new RuntimeException("Transaction not found with id: " + id);
                logger.error("Transaction lookup failed - resource not found", "transactions", notFound,
                        Map.of("operation_id", opId, "transaction_id", id, "action", "GET"));
            } else {
                logger.info("Transaction retrieved", "transactions", Map.of(
                        "operation_id", opId,
                        "transaction_id", id,
                        "type", tx.get().getType().name(),
                        "amount", tx.get().getAmount(),
                        "action", "GET"
                ));
            }
            return tx;
        } catch (Exception e) {
            logger.error("Failed to retrieve transaction", "transactions", e,
                    Map.of("operation_id", opId, "transaction_id", id, "action", "GET"));
            throw e;
        }
    }

    public Transaction createTransaction(Transaction transaction) {
        long opId = operationCounter.incrementAndGet();
        try {
            // Deliberate validation error: negative amounts
            if (transaction.getAmount() != null && transaction.getAmount() < 0) {
                IllegalArgumentException err = new IllegalArgumentException(
                        "Transaction amount cannot be negative: " + transaction.getAmount());
                logger.error("Transaction creation rejected - invalid amount", "transactions", err,
                        Map.of("operation_id", opId, "amount", transaction.getAmount(),
                                "category", transaction.getCategory(), "action", "CREATE"));
                throw err;
            }

            // Deliberate validation error: zero amount
            if (transaction.getAmount() != null && transaction.getAmount() == 0) {
                IllegalArgumentException err = new IllegalArgumentException(
                        "Transaction amount cannot be zero");
                logger.error("Transaction creation rejected - zero amount", "transactions", err,
                        Map.of("operation_id", opId, "category", transaction.getCategory(), "action", "CREATE"));
                throw err;
            }

            Transaction saved = repository.save(transaction);

            logger.info("Transaction created successfully", "transactions", Map.of(
                    "operation_id", opId,
                    "transaction_id", saved.getId(),
                    "type", saved.getType().name(),
                    "category", saved.getCategory(),
                    "amount", saved.getAmount(),
                    "description", saved.getDescription() != null ? saved.getDescription() : "",
                    "date", saved.getDate().toString(),
                    "action", "CREATE"
            ));

            // Deliberate: warn if large transaction
            if (saved.getAmount() > 10000) {
                logger.warn("Large transaction detected - flagged for review", "transactions", Map.of(
                        "operation_id", opId,
                        "transaction_id", saved.getId(),
                        "amount", saved.getAmount(),
                        "threshold", 10000,
                        "action", "CREATE"
                ));
            }

            return saved;
        } catch (IllegalArgumentException e) {
            throw e; // already logged
        } catch (Exception e) {
            logger.error("Transaction creation failed - unexpected error", "transactions", e,
                    Map.of("operation_id", opId, "action", "CREATE",
                            "category", transaction.getCategory() != null ? transaction.getCategory() : "unknown",
                            "amount", transaction.getAmount() != null ? transaction.getAmount() : 0));
            throw e;
        }
    }

    public Transaction updateTransaction(Long id, Transaction updated) {
        long opId = operationCounter.incrementAndGet();
        try {
            Optional<Transaction> existing = repository.findById(id);
            if (existing.isEmpty()) {
                RuntimeException notFound = new RuntimeException("Transaction not found for update: id=" + id);
                logger.error("Transaction update failed - resource not found", "transactions", notFound,
                        Map.of("operation_id", opId, "transaction_id", id, "action", "UPDATE"));
                throw notFound;
            }

            Transaction tx = existing.get();
            double oldAmount = tx.getAmount();
            String oldType = tx.getType().name();

            tx.setType(updated.getType());
            tx.setCategory(updated.getCategory());
            tx.setAmount(updated.getAmount());
            tx.setDescription(updated.getDescription());
            tx.setDate(updated.getDate());

            Transaction saved = repository.save(tx);

            logger.info("Transaction updated successfully", "transactions", Map.of(
                    "operation_id", opId,
                    "transaction_id", saved.getId(),
                    "old_type", oldType,
                    "new_type", saved.getType().name(),
                    "old_amount", oldAmount,
                    "new_amount", saved.getAmount(),
                    "category", saved.getCategory(),
                    "action", "UPDATE"
            ));

            return saved;
        } catch (RuntimeException e) {
            if (!e.getMessage().contains("not found")) {
                logger.error("Transaction update failed - unexpected error", "transactions", e,
                        Map.of("operation_id", opId, "transaction_id", id, "action", "UPDATE"));
            }
            throw e;
        }
    }

    public void deleteTransaction(Long id) {
        long opId = operationCounter.incrementAndGet();
        try {
            Optional<Transaction> existing = repository.findById(id);
            if (existing.isEmpty()) {
                RuntimeException notFound = new RuntimeException("Transaction not found for deletion: id=" + id);
                logger.error("Transaction deletion failed - resource not found", "transactions", notFound,
                        Map.of("operation_id", opId, "transaction_id", id, "action", "DELETE"));
                throw notFound;
            }

            Transaction tx = existing.get();
            repository.deleteById(id);

            logger.info("Transaction deleted successfully", "transactions", Map.of(
                    "operation_id", opId,
                    "transaction_id", id,
                    "deleted_type", tx.getType().name(),
                    "deleted_amount", tx.getAmount(),
                    "deleted_category", tx.getCategory(),
                    "action", "DELETE"
            ));

            // Deliberate: error log if deleting an income transaction (simulating business rule violation)
            if (tx.getType() == Transaction.TransactionType.INCOME) {
                RuntimeException auditErr = new RuntimeException(
                        "Audit alert: Income transaction deleted - id=" + id
                                + ", amount=" + tx.getAmount() + ", category=" + tx.getCategory());
                logger.error("AUDIT: Income transaction deleted - requires review", "audit", auditErr,
                        Map.of("operation_id", opId, "transaction_id", id,
                                "amount", tx.getAmount(), "category", tx.getCategory(),
                                "action", "DELETE_AUDIT"));
            }

        } catch (RuntimeException e) {
            if (!e.getMessage().contains("not found") && !e.getMessage().contains("Audit alert")) {
                logger.error("Transaction deletion failed - unexpected error", "transactions", e,
                        Map.of("operation_id", opId, "transaction_id", id, "action", "DELETE"));
            }
            if (e.getMessage().contains("not found")) throw e;
        }
    }

    public Map<String, Object> getSummary() {
        long opId = operationCounter.incrementAndGet();
        try {
            Double totalIncome = repository.getTotalIncome();
            Double totalExpense = repository.getTotalExpense();
            Double balance = totalIncome - totalExpense;
            long count = repository.count();

            logger.info("Summary calculated", "summary", Map.of(
                    "operation_id", opId,
                    "total_income", totalIncome,
                    "total_expense", totalExpense,
                    "balance", balance,
                    "transaction_count", count,
                    "action", "SUMMARY"
            ));

            // Deliberate: error if balance is negative
            if (balance < 0) {
                RuntimeException deficit = new RuntimeException(
                        "Budget deficit detected: balance=" + balance
                                + ", income=" + totalIncome + ", expense=" + totalExpense);
                logger.error("ALERT: Negative balance detected", "summary", deficit,
                        Map.of("operation_id", opId, "balance", balance,
                                "total_income", totalIncome, "total_expense", totalExpense,
                                "action", "SUMMARY_ALERT"));
            }

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalIncome", totalIncome);
            summary.put("totalExpense", totalExpense);
            summary.put("balance", balance);
            summary.put("transactionCount", count);
            return summary;
        } catch (Exception e) {
            logger.error("Summary calculation failed", "summary", e,
                    Map.of("operation_id", opId, "action", "SUMMARY"));
            throw e;
        }
    }
}
