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

describe('Update Profile API (Frontend Style)', () => {
    let token;
    let user = {
        username: `f_updateuser_${Date.now()}`,
        email: `f_updateuser_${Date.now()}@example.com`,
        password: 'Password123!',
        phoneNumber: '9988112233'
    };

    beforeAll(async () => {
        // 1. Signup
        const form = new FormData();
        form.append('username', user.username);
        form.append('email', user.email);
        form.append('password', user.password);
        form.append('phoneNumber', user.phoneNumber);
        form.append('profileImage', fs.createReadStream(IMAGE_PATH));

        await axios.post(SIGNUP_URL, form, { headers: form.getHeaders() });

        // 2. Login
        const loginRes = await axios.post(LOGIN_URL, {
            identifier: user.username,
            password: user.password
        });
        token = loginRes.data.accessToken;
    });

    test('Valid case: Update profile (camelCase fields)', async () => {
        const payload = {
            username: user.username + "_fnew",
            phoneNumber: '1122334455'
        };

        const response = await axios.patch(UPDATE_PROFILE_URL, payload, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
        expect(response.data.username).toBe(payload.username);
    });

    test('Valid case: Change password (camelCase fields)', async () => {
        const payload = {
            username: user.username + "_fnew",
            phoneNumber: '1122334455',
            currentPassword: user.password,
            newPassword: 'NewPassword321!'
        };

        const response = await axios.patch(UPDATE_PROFILE_URL, payload, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
    });

    test('Valid case: Update profile image (camelCase)', async () => {
        const form = new FormData();
        form.append('profileImage', fs.createReadStream(IMAGE_PATH));

        const response = await axios.patch(UPDATE_IMAGE_URL, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            },
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
    });
});
