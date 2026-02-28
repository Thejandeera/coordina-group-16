# User Management Integration Tests

This documentation outlines the complete set of automated test cases implemented for the `UserManagement` module.

## Directory Structure
The tests are stored in the root `test/unit/user-management/` directory, while required mock resources (such as profile picture images) are centralized in `test/resources/`.

## Test Scenarios

### 1. User Signup API (`signup.test.js`)
Tests the `POST /api/Auth/signup` endpoint. This endpoint handles `multipart/form-data` to accommodate profile picture uploads alongside standard user attributes.

**Valid Test Cases:**
- **[Success] Successfully registers a new user**: Creates a dummy user with universally valid criteria (e.g., strong password, exactly 10-digit unique phone number, legitimate image file block `man.png`). Expects `201 Created`.

**Invalid Test Cases:**
- **[Failure] Missing required fields**: Submits a completely empty payload. Expects `400 Bad Request`.
- **[Failure] Username too short**: Attempts to register with a 2-character username. The minimum allowed length is 3. Expects `400 Bad Request`.
- **[Failure] Invalid Email format**: Attempts to submit an incorrect email format lacking the `@` symbol or top-level domain. Expects `400 Bad Request`.
- **[Failure] Weak Password (Missing Symbol)**: Attempts registration using a password containing mixed cases and numbers but missing special characters. Expects `400 Bad Request`.
- **[Failure] Weak Password (Missing Uppercase)**: Attempts registration using a password completely lacking capital letters. Expects `400 Bad Request`.
- **[Failure] Invalid Phone Number**: Provides an 8-digit phone number instead of the mandatory 10 unique digits. Expects `400 Bad Request`.
- **[Failure] Missing Profile Image**: Submits full textual details but omits the `multipart/form-data` profile image payload. Expects `400 Bad Request`.

---

### 2. User Login API (`login.test.js`)
Tests the `POST /api/Auth/login` endpoint. To comprehensively test the login API in an isolated matter, the test script inherently provisions a mock "Setup User" initially via the signup route before executing localized login evaluations.

**Valid Test Cases:**
- **[Success] Login using Username**: Correctly validates credentials utilizing the newly registered mock username. Expects `200 OK`.
- **[Success] Login using Email**: Correctly validates credentials utilizing the newly registered mock email address. Expects `200 OK`.

**Invalid Test Cases:**
- **[Failure] Missing Identifier**: Attempt to authenticate providing a password but no email or username element. Expects `400 Bad Request`.
- **[Failure] Missing Password**: Attempt to authenticate providing a username string but completely omitting the password argument. Expects `400 Bad Request`.
- **[Failure] Incorrect Password**: Provides a fully registered user identifier but pairs it with an invalid character string for the password. Expects `401 Unauthorized` or `400 Bad Request`.
- **[Failure] Non-existent User**: Tries to authenticate against an unregistered identifier. Expects `401 Unauthorized`, `404 Not Found`, or `400 Bad Request`.

## Execution Protocol
Verify the centralized API Backend service architecture is active on configured `localhost` networks (e.g., `localhost:5134`) manually prior to executing requests.

You can initiate the test suites seamlessly from the root structured `test/` directory to automatically run unit, integration, and user-management processes:

```sh
npm install
npm test
```
