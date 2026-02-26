# User Management: Login & Signup Test Specifications

This document outlines the test scenarios for User Management, specifically focusing on **Signup (Registration)** and **Login** flows. These cases ensure a reliable and secure user experience for the CEPM platform.

---

## 📋 1. Signup (User Registration) Scenarios

The Signup process allows new members to join the platform with their designated roles.

### 🧩 Unit & Functional Tests (Backend/Logic)
| Case ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **SIGNUP-01** | Valid Registration | User is successfully created; password is encrypted; phone number and profile photo path are stored; role is assigned. |
| **SIGNUP-02** | Duplicate Email | System rejects the request with "Email already exists" error. |
| **SIGNUP-03** | Weak Password | Rejects passwords less than 8 characters or without special symbols. |
| **SIGNUP-04** | Invalid Email Format | Rejects entries like `test@invalid` or `user.com`. |
| **SIGNUP-05** | Fields Missing | Rejects registration if Full Name, Email, Phone Number, or Password is empty. |
| **SIGNUP-06** | Invalid Phone Number| Rejects phone numbers that do not follow the Sri Lankan format (e.g., 07XXXXXXXX). |
| **SIGNUP-07** | Invalid Photo Format| Rejects files that are not images (e.g., .txt or .exe). |

### 🖼️ UI/Frontend Tests
| Case ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **SIGNUP-UI-01** | Input Validation | Shows real-time error messages for invalid emails/passwords. |
| **SIGNUP-UI-02** | Password Match | Shows error if "Password" and "Confirm Password" fields don't match. |
| **SIGNUP-UI-03** | Success Redirect | Upon successful signup, user is automatically redirected to the Login page. |

---

## 🔑 2. Login (Authentication) Scenarios

The Login process secures access to the platform's features based on the user's role.

### 🧩 Unit & Functional Tests (Backend/Logic)
| Case ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **LOGIN-01** | Correct Credentials | System validates password and returns a secure JWT Access Token. |
| **LOGIN-02** | Incorrect Password | Rejects login with "Invalid credentials" (security best practice: don't specify if it was user or pass). |
| **LOGIN-03** | Non-existent User | Rejects login with "Invalid credentials" error. |
| **LOGIN-04** | Token Expiration | User session expires correctly after the set duration (e.g., 1 hour). |

### 🖼️ UI/Frontend Tests
| Case ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **LOGIN-UI-01** | Form Components | Email and Password fields are properly labeled and visible. |
| **LOGIN-UI-02** | Masked Password | Password characters are hidden while typing (e.g., dots or asterisks). |
| **LOGIN-UI-03** | Loading State | Displays a spinner or loading text while authentication is in progress. |

---

## 🚀 3. End-to-End (Full Journey) Flow

**Flow ID: E2E-AUTH-FULL**
1. **User Sign-up:** New user enters name, email, **phone number**, and uploads a **profile photo**.
2. **Success Confirmation:** User sees a "Registration Successful" message.
3. **Redirection:** System moves the user to the Login page automatically.
4. **User Log-in:** User enters credentials.
5. **Dashboard Access:** User is logged in and sees their **profile photo** and "Welcome [User Name]".
6. **Persistence Check:** Refreshing the page keeps the user logged in.
7. **Logout:** Session cleared.

---

## 🛡️ 4. Role-Based Access Control (RBAC)

These cases ensure users can only perform actions allowed by their role.

| Role | Permitted Actions (Signup/Login context) | Restricted Actions |
| :--- | :--- | :--- |
| **Admin** | Can view all user profiles, manage roles. | None. |
| **Organizer**| Can login and edit their own profile. | Cannot delete other users. |
| **Participant**| Can login and participate in events. | Cannot change roles of other members. |
| **Guest** | Can only access Signup and Login pages. | Cannot access Dashboard or Profile. |
