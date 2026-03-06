jest.setTimeout(30000);
const axios = require('axios');

const API_URL = 'http://localhost:5134/api/Auth/login';
const SIGNUP_URL = 'http://localhost:5134/api/Auth/signup';

describe('Frontend-Style Login (camelCase fields)', () => {
    let validUser = {
        username: `f_loginuser_${Date.now()}`,
        email: `f_loginuser_${Date.now()}@example.com`,
        password: 'Password123!',
    };

    beforeAll(async () => {
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '../../resources/man.png');

        const form = new FormData();
        form.append('username', validUser.username);
        form.append('email', validUser.email);
        form.append('password', validUser.password);
        form.append('phoneNumber', '1' + Math.floor(100000000 + Math.random() * 900000000).toString());
        form.append('profileImage', fs.createReadStream(imagePath));

        try {
            await axios.post(SIGNUP_URL, form, {
                headers: form.getHeaders(),
                validateStatus: () => true
            });
        } catch (err) {
            console.error("Setup signup failed", err);
        }
    }); // Rely on global jest.setTimeout(30000)

    test('Valid case: Login with frontend identifier (username)', async () => {
        const payload = {
            identifier: validUser.username,
            password: validUser.password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
    });

    test('Valid case: Login with frontend identifier (email)', async () => {
        const payload = {
            identifier: validUser.email,
            password: validUser.password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
    });

    test('Invalid case: Missing identifier', async () => {
        const payload = {
            password: validUser.password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });
});
