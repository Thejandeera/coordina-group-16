jest.setTimeout(30000);
const axios = require('axios');

const API_URL = 'http://localhost:5134/api/Auth/login';
const SIGNUP_URL = 'http://localhost:5134/api/Auth/signup';

describe('POST /api/Auth/login', () => {
    let validUser = {
        Username: `loginuser_${Date.now()}`,
        Email: `loginuser_${Date.now()}@example.com`,
        Password: 'Password123!',
    };

    beforeAll(async () => {
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '../../resources/man.png');

        const form = new FormData();
        form.append('Username', validUser.Username);
        form.append('Email', validUser.Email);
        form.append('Password', validUser.Password);
        form.append('PhoneNumber', '1' + Math.floor(100000000 + Math.random() * 900000000).toString());
        form.append('ProfileImage', fs.createReadStream(imagePath));


        try {
            await axios.post(SIGNUP_URL, form, {
                headers: form.getHeaders(),
                validateStatus: () => true
            });
        } catch (err) {
            console.error("Setup signup failed", err);
        }
    });

    test('Valid case: Successful login with correct Username and Password', async () => {
        const payload = {
            Identifier: validUser.Username,
            Password: validUser.Password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status).toBe(200);
    });

    test('Valid case: Successful login with correct Email and Password', async () => {
        const payload = {
            Identifier: validUser.Email,
            Password: validUser.Password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status).toBe(200);
    });

    test('Invalid case: Missing Identifier', async () => {
        const payload = {
            Password: validUser.Password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status).toBe(400);
    });

    test('Invalid case: Missing Password', async () => {
        const payload = {
            Identifier: validUser.Username
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status).toBe(400);
    });

    test('Invalid case: Wrong Password', async () => {
        const payload = {
            Identifier: validUser.Username,
            Password: 'WrongPassword123!'
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status === 401 || response.status === 400).toBeTruthy();
    });

    test('Invalid case: Incorrect Identifier/Non-existent user', async () => {
        const payload = {
            Identifier: 'nonexistentuser',
            Password: validUser.Password
        };

        const response = await axios.post(API_URL, payload, {
            validateStatus: () => true
        });


        expect(response.status === 401 || response.status === 400 || response.status === 404).toBeTruthy();
    });
});
