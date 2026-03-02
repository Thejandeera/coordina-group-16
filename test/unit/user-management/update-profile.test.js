jest.setTimeout(30000);
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SIGNUP_URL = 'http://localhost:5134/api/Auth/signup';
const LOGIN_URL = 'http://localhost:5134/api/Auth/login';
const UPDATE_PROFILE_URL = 'http://localhost:5134/api/Users/profile';
const UPDATE_IMAGE_URL = 'http://localhost:5134/api/Users/profile-image';
const IMAGE_PATH = path.join(__dirname, '../../resources/man.png');

describe('Update Profile API (Backend Style)', () => {
    let token;
    let user = {
        Username: `updateuser_${Date.now()}`,
        Email: `updateuser_${Date.now()}@example.com`,
        Password: 'Password123!',
        PhoneNumber: '1122334455'
    };

    beforeAll(async () => {
        // 1. Signup
        const form = new FormData();
        form.append('Username', user.Username);
        form.append('Email', user.Email);
        form.append('Password', user.Password);
        form.append('PhoneNumber', user.PhoneNumber);
        form.append('ProfileImage', fs.createReadStream(IMAGE_PATH));

        await axios.post(SIGNUP_URL, form, { headers: form.getHeaders() });

        // 2. Login to get token
        const loginRes = await axios.post(LOGIN_URL, {
            Identifier: user.Username,
            Password: user.Password
        });
        token = loginRes.data.accessToken;
    });

    test('Valid case: Update Username and PhoneNumber', async () => {
        const payload = {
            Username: user.Username + "_new",
            PhoneNumber: '9988776655'
        };

        const response = await axios.patch(UPDATE_PROFILE_URL, payload, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
        expect(response.data.username).toBe(payload.Username);
        expect(response.data.phoneNumber).toBe(payload.PhoneNumber);
    });

    test('Valid case: Change Password', async () => {
        const payload = {
            Username: user.Username + "_new", // Required field
            PhoneNumber: '9988776655', // Required field
            CurrentPassword: user.Password,
            NewPassword: 'NewPassword123!'
        };

        const response = await axios.patch(UPDATE_PROFILE_URL, payload, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);

        // Verify login with new password
        const loginRes = await axios.post(LOGIN_URL, {
            Identifier: user.Email,
            Password: payload.NewPassword
        });
        expect(loginRes.status).toBe(200);
    });

    test('Valid case: Update Profile Image', async () => {
        const form = new FormData();
        form.append('ProfileImage', fs.createReadStream(IMAGE_PATH));

        const response = await axios.patch(UPDATE_IMAGE_URL, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
        expect(response.data.profileImageUrl).toBeDefined();
    });

    test('Invalid case: Missing required fields (Username/PhoneNumber)', async () => {
        const response = await axios.patch(UPDATE_PROFILE_URL, {}, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });
});
