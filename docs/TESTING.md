# AUTOMATED VERIFICATION & TEST SUITE

## 1. Running Automated Tests

Run the full end-to-end verification suite across database, security, and AI subsystems:

```bash
npm test
```

Under the hood, this executes `npx tsx scripts/verify-all.ts`.

---

## 2. Test Coverage Matrix

The automated verification suite tests 18 critical production capabilities:

1. **Database Connectivity**: Validates Prisma ORM connection and read capabilities.
2. **Password Hashing (bcrypt)**: Asserts salted bcrypt password encryption.
3. **JWT Session Issuance & Verification**: Tests cryptographic signing and verification of session cookies.
4. **Multi-Tenant Isolation (Revenue)**: Creates two distinct organizations (Alpha & Beta) and verifies that Beta cannot view Alpha's records.
5. **Social Post Validation**: Tests character limits and draft states.
6. **Social Post Database Persistence**: Verifies relational post creation.
7. **Ticket Status Lifecycle**: Verifies transitions between `OPEN`, `IN_PROGRESS`, and `RESOLVED`.
8. **Subscription & Plan Metrics**: Tests tier pricing, active subscriber calculations, and churn.
9. **Ad Campaign Tracking & ROAS Calculation**: Asserts return-on-ad-spend formulas.
10. **Device Token SHA-256 Hashing**: Verifies 64-character hexadecimal SHA-256 hash formatting.
11. **Pairing Code Generator**: Verifies single-use `JARVIS-XXXXXX` generation and format.
12. **Device Credential Record Persistence**: Validates hashed token storage.
13. **Transactional Outbox Event Publisher**: Validates outbox event creation and in-memory SSE dispatch.
14. **Tool Registry (Low Risk Execution)**: Tests automated execution of read-only tools.
15. **Tool Registry Risk Engine (High Risk Guard)**: Verifies that unconfirmed destructive actions are blocked.
16. **Tool Registry (High Risk User Approved)**: Verifies that confirmed high-risk actions proceed.
17. **Screen Intelligence & Multimodal Vision**: Tests visual screenshot processing and fallback mechanisms.
18. **Autonomous Task Engine (Multi-Step Plan)**: Tests step-by-step task tracking and relational creation.

