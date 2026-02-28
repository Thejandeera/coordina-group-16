const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5134/api/Auth/signup';
const imagePath = path.join(__dirname, '../../resources/man.png');

describe('Frontend-Style Signup (camelCase fields)', () => {
    const createSignupForm = (data) => {
        const form = new FormData();
        if (data.username !== undefined) form.append('username', data.username);
        if (data.email !== undefined) form.append('email', data.email);
        if (data.password !== undefined) form.append('password', data.password);
        if (data.phoneNumber !== undefined) form.append('phoneNumber', data.phoneNumber);

        if (data.profileImage === 'valid') {
            form.append('profileImage', fs.createReadStream(imagePath));
        } else if (data.profileImage !== undefined) {
            form.append('profileImage', data.profileImage);
        }

        return form;
    };

    test('Valid case: Successfully registers a new user (frontend fields)', async () => {
        const uniqueId = Date.now();
        const form = createSignupForm({
            username: `f_user_${uniqueId}`,
            email: `f_user_${uniqueId}@example.com`,
            password: 'Password123!',
            phoneNumber: '1234567890',
            profileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(201);
    }, 10000);

    test('Invalid case: Username too short (frontend constraint)', async () => {
        const form = createSignupForm({
            username: 'ab',
            email: `f_test_${Date.now()}@example.com`,
            password: 'Password123!',
            phoneNumber: '1234567890',
            profileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Invalid Email format', async () => {
        const form = createSignupForm({
            username: `f_user_${Date.now()}`,
            email: 'not-an-email',
            password: 'Password123!',
            phoneNumber: '1234567890',
            profileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Weak Password', async () => {
        const form = createSignupForm({
            username: `f_user_${Date.now()}`,
            email: `f_user_${Date.now()}@example.com`,
            password: 'password123',
            phoneNumber: '1234567890',
            profileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Missing profile image', async () => {
        const form = createSignupForm({
            username: `f_user_${Date.now()}`,
            email: `f_user_${Date.now()}@example.com`,
            password: 'Password123!',
            phoneNumber: '1234567890'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });
});
