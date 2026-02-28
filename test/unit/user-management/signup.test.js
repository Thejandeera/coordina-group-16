const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5134/api/Auth/signup';
const imagePath = path.join(__dirname, 'test-image.jpg');

describe('POST /api/Auth/signup', () => {
    beforeAll(() => {
        // Create a dummy image file if it doesn't exist
        if (!fs.existsSync(imagePath)) {
            const imgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            fs.writeFileSync(imagePath, Buffer.from(imgBase64, 'base64'));
        }
    });

    afterAll(() => {
        // Clean up
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });

    // Helper function to create FormData based on input
    const createSignupForm = (data) => {
        const form = new FormData();
        if (data.Username !== undefined) form.append('Username', data.Username);
        if (data.Email !== undefined) form.append('Email', data.Email);
        if (data.Password !== undefined) form.append('Password', data.Password);
        if (data.PhoneNumber !== undefined) form.append('PhoneNumber', data.PhoneNumber);

        if (data.ProfileImage === 'valid') {
            form.append('ProfileImage', fs.createReadStream(imagePath));
        } else if (data.ProfileImage !== undefined) {
            form.append('ProfileImage', data.ProfileImage);
        }

        return form;
    };

    test('Valid case: Successfully registers a new user', async () => {
        const uniqueId = Date.now();
        const form = createSignupForm({
            Username: `user_${uniqueId}`,
            Email: `user_${uniqueId}@example.com`,
            Password: 'Password123!',
            PhoneNumber: '1234567890',
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true // Resolve on all statuses to test status codes
        });

        // We expect 201 Created from a successful sign up
        expect(response.status).toBe(201);
    });

    test('Invalid case: Missing required fields', async () => {
        const form = createSignupForm({}); // Empty form

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        // We expect 400 Bad Request
        expect(response.status).toBe(400);
    });

    test('Invalid case: Username too short (less than 3 characters)', async () => {
        const form = createSignupForm({
            Username: 'ab',
            Email: `test_${Date.now()}@example.com`,
            Password: 'Password123!',
            PhoneNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(),
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Invalid Email format', async () => {
        const form = createSignupForm({
            Username: `user_${Date.now()}`,
            Email: 'not-an-email',
            Password: 'Password123!',
            PhoneNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(),
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Password without symbol (regex failure)', async () => {
        const form = createSignupForm({
            Username: `user_${Date.now()}`,
            Email: `user_${Date.now()}@example.com`,
            Password: 'Password12345',
            PhoneNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(),
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Password without uppercase letter (regex failure)', async () => {
        const form = createSignupForm({
            Username: `user_${Date.now()}`,
            Email: `user_${Date.now()}@example.com`,
            Password: 'password123!',
            PhoneNumber: '1' + Math.floor(100000000 + Math.random() * 900000000).toString(),
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Phone number not exactly 10 digits', async () => {
        const form = createSignupForm({
            Username: `user_${Date.now()}`,
            Email: `user_${Date.now()}@example.com`,
            Password: 'Password123!',
            PhoneNumber: '12345678', // 8 digits
            ProfileImage: 'valid'
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });

    test('Invalid case: Missing ProfileImage', async () => {
        const form = createSignupForm({
            Username: `user_${Date.now()}`,
            Email: `user_${Date.now()}@example.com`,
            Password: 'Password123!',
            PhoneNumber: '1234567890'
            // ProfileImage omitted
        });

        const response = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
    });
});
