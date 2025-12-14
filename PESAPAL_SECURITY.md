# Pesapal Payment System - Security Architecture

## Core Security Principles

### 1. Frontend Never Decides Payment Success

**Why:** Frontend code can be manipulated by attackers. A malicious user could:
- Modify JavaScript to show "payment successful" without paying
- Bypass client-side validation
- Fake payment responses
- Reuse old transaction references

**Implementation:**
- Frontend only requests payment initiation from backend
- Frontend redirects user to Pesapal checkout
- Frontend calls backend verification after redirect
- Frontend only shows success after backend confirmation

### 2. Secret Keys Never Exposed

**Why:** Secret keys in client code can be extracted and used to:
- Make unauthorized API calls
- Access sensitive account data
- Manipulate transactions
- Create fake payment orders

**Implementation:**
- Consumer key and secret stored in Firebase Functions config
- Only accessible server-side
- Never logged or exposed in responses
- `.gitignore` prevents accidental commits

### 3. Server-Side Verification

**Why:** Only the backend can trust Pesapal API responses:
- Client can't fake API responses
- Backend validates all payment data
- Prevents replay attacks
- Ensures data integrity

**Implementation:**
- Backend calls Pesapal verification API
- Validates: status, amount, currency, reference
- Checks for duplicate transactions
- Saves only verified payments

### 4. Duplicate Transaction Prevention

**Why:** Prevents replay attacks where same transaction is processed multiple times.

**Implementation:**
- Check reference uniqueness before creating order
- Check if payment already verified before processing
- Firestore queries prevent duplicates
- Error if transaction already exists

### 5. Webhook Signature Verification

**Why:** Webhooks can be spoofed. Without verification, attackers could:
- Send fake payment notifications
- Trigger false payment confirmations
- Cause financial discrepancies

**Implementation:**
- Verify HMAC SHA-256 signature
- Re-verify payment with Pesapal API
- Never trust webhook data alone
- Idempotent processing prevents double handling

### 6. Authentication Required

**Why:** Only authenticated users should:
- Initiate payments
- Verify payments
- Access payment history

**Implementation:**
- Cloud Functions check `context.auth`
- Firestore rules require authentication
- User ID stored with each payment
- Payments linked to user account

### 7. Fail-Closed Security Model

**Why:** On any error or uncertainty, deny access rather than allow.

**Implementation:**
- Errors default to denying payment
- Validation failures reject payment
- Missing data causes rejection
- Unknown states are treated as failures

## Attack Vectors Prevented

### 1. Frontend Manipulation
- **Attack:** User modifies JavaScript to show fake success
- **Prevention:** Backend verification required

### 2. Replay Attacks
- **Attack:** User reuses same transaction reference
- **Prevention:** Reference uniqueness check

### 3. Amount Manipulation
- **Attack:** User pays less but claims full amount
- **Prevention:** Backend validates amount matches expected

### 4. Currency Manipulation
- **Attack:** User pays in different currency
- **Prevention:** Backend validates currency is UGX

### 5. Fake Webhooks
- **Attack:** Attacker sends fake webhook
- **Prevention:** Signature verification + re-verification

### 6. Unauthorized Access
- **Attack:** User accesses other users' payments
- **Prevention:** Firestore rules restrict access

### 7. Secret Key Theft
- **Attack:** Attacker extracts secret key from code
- **Prevention:** Secret key never in client code

### 8. Double Processing
- **Attack:** Same payment processed twice
- **Prevention:** Idempotent webhook processing

## Security Layers

```
┌─────────────────────────────────────┐
│  Layer 1: Frontend (Untrusted)      │
│  - Only initiates payments          │
│  - Redirects to Pesapal             │
│  - Calls backend for verification   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 2: Authentication            │
│  - Firebase Auth required           │
│  - User ID verification             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 3: Backend Verification      │
│  - Pesapal API call                 │
│  - Data validation                  │
│  - Duplicate check                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 4: Data Storage               │
│  - Firestore security rules         │
│  - Encrypted at rest                │
│  - Audit trail                      │
└─────────────────────────────────────┘
```

## Payment Flow Security

1. **User initiates payment**
   - Frontend validates input (UI only)
   - Calls backend `initializePayment`
   - Backend validates amount server-side
   - Backend generates unique reference
   - Backend creates Pesapal order
   - Backend returns checkout URL

2. **User completes payment on Pesapal**
   - Pesapal handles payment securely
   - User redirected back to callback URL

3. **Payment verification**
   - Frontend extracts order tracking ID
   - Frontend calls backend `verifyPayment`
   - Backend verifies with Pesapal API
   - Backend validates payment data
   - Backend checks for duplicates
   - Backend updates Firestore
   - Backend returns success
   - Frontend shows success (only after backend confirmation)

4. **Webhook processing (parallel)**
   - Pesapal sends webhook notification
   - Backend verifies webhook signature
   - Backend re-verifies with Pesapal API
   - Backend updates payment record
   - Idempotent processing prevents duplicates

## Best Practices Followed

1. ✅ **Defense in Depth:** Multiple security layers
2. ✅ **Fail Secure:** Errors default to denying access
3. ✅ **Least Privilege:** Minimal required permissions
4. ✅ **Input Validation:** All inputs validated
5. ✅ **Output Sanitization:** No sensitive data in responses
6. ✅ **Audit Logging:** All payments logged
7. ✅ **Error Handling:** Generic errors to frontend
8. ✅ **HTTPS Only:** All communications encrypted
9. ✅ **Secret Management:** Environment variables only
10. ✅ **Code Review:** Security-focused implementation

## Compliance Considerations

- **PCI DSS:** No card data stored (Pesapal handles it)
- **GDPR:** User data stored securely, access controlled
- **Financial Regulations:** Audit trail maintained
- **Data Protection:** Encryption in transit and at rest

## Monitoring & Alerts

Recommended monitoring:
- Failed payment verifications
- Duplicate transaction attempts
- Unauthorized access attempts
- Webhook signature failures
- API rate limit warnings
- Amount mismatches
- Currency mismatches

## Incident Response

If security breach suspected:
1. Immediately rotate Pesapal credentials
2. Review recent transactions
3. Check Cloud Functions logs
4. Audit Firestore access logs
5. Notify affected users
6. Document incident
7. Review and update security measures

## Security Checklist

- [ ] All secrets in Firebase Functions config
- [ ] No secrets in git repository
- [ ] Webhook signature verification enabled
- [ ] Firestore rules deployed
- [ ] Authentication required for all functions
- [ ] Payment verification server-side only
- [ ] Duplicate prevention implemented
- [ ] Error handling fails closed
- [ ] HTTPS enforced
- [ ] Audit logging enabled

