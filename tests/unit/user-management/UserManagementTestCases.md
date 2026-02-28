 🛡️ Coordina - User Management QA Test Suite

This document provides a clear, professional overview of the **User Management** test cases. It is designed to help developers understand exactly what business logic and validation rules must be implemented.

---

## 👤 1. User Registration (Signup)
*Ensuring new users can join the platform securely and with valid data.*

> [!TIP]
> All registration requests must handle image uploads via Cloudinary.

| ID | Case Description | Input Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-REG-01** | ✅ **Happy Path Signup** | Valid fields + Image | **201 Created**; User saved; Image URL returned. | High |
| **UC-REG-02** | ✋ **Duplicate Identity** | Existing User/Email | **409 Conflict**; "Username/Email already exists." | High |
| **UC-REG-03** | 📧 **Invalid Email** | "user@com" (Bad format) | **400 Bad Request**; Validation error message. | Med |
| **UC-REG-04** | 🖼️ **Missing Avatar** | No image file | **400 Bad Request**; "Profile image is required." | Med |
| **UC-REG-05** | 🔑 **Weak Password** | `123` (Short) | **Validation Error**; Prevent DB submission. | High |

---

## 🔑 2. Authentication (Login)
*Verifying identity and granting system access.*

| ID | Case Description | Input Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-AUTH-01** | 🔓 **Login (Username)** | Correct User + Pass | **200 OK**; Return Access & Refresh Tokens. | High |
| **UC-AUTH-02** | 📧 **Login (Email)** | Correct Email + Pass | **200 OK**; Return Access & Refresh Tokens. | High |
| **UC-AUTH-03** | ❌ **Wrong Password** | Correct User + Wrong Pass | **401 Unauthorized**; Access denied. | High |
| **UC-AUTH-04** | ❓ **Ghost User** | Non-existent ID | **401 Unauthorized**; Account not found. | High |

---

## 🔄 3. Token & Session Management
*Maintaining secure sessions without constant re-login.*

> [!IMPORTANT]
> Refresh tokens must be validated against the `token_type: refresh` claim.

| ID | Case Description | Input Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-TOK-01** | 💎 **Token Refresh** | Valid Refresh Token | **200 OK**; New token pair generated. | High |
| **UC-TOK-02** | 🚫 **Expired Refresh** | Old/Bad Refresh Token | **401 Unauthorized**; Prompt for re-login. | High |

---

## 📸 4. Profile Customization
*Allowing users to manage their personal appearance.*

| ID | Case Description | Input Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-PROF-01** | 🆙 **Update Photo** | Authed User + New File | **200 OK**; New image URL saved to DB. | Med |
| **UC-PROF-02** | 🕵️ **Ghost Profile** | Authed but no DB record | **404 Not Found**; "User data missing." | Low |
| **UC-PROF-03** | 🛑 **No File Sent** | Authed + Empty Update | **400 Bad Request**; "No image provided." | Low |

---

> [!NOTE]  
> **QA Notes for Developers:**  
> - Frontend should perform basic regex checks for email and length.  
> - Backend must always trim whitespace from inputs before processing.

