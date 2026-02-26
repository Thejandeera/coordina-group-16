import request from 'supertest';
const baseUrl = 'http://localhost:5000/api';

describe('User Management API E2E (RBAC focus)', () => {
    let adminToken;
    let viewerToken;

    beforeAll(async () => {
        // Acquire tokens for different roles
        const adminRes = await request(baseUrl)
            .post('/auth/login')
            .send({ email: 'admin@cepm.com', password: 'AdminPassword123' });
        adminToken = adminRes.body.token;

        const viewerRes = await request(baseUrl)
            .post('/auth/login')
            .send({ email: 'viewer@cepm.com', password: 'ViewerPassword123' });
        viewerToken = viewerRes.body.token;
    });

    it('Admin should be able to create resources', async () => {
        const res = await request(baseUrl)
            .post('/resources')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Central Hall', capacity: 100 });

        expect(res.status).toBe(201);
    });

    it('Viewer should NOT be able to create resources', async () => {
        const res = await request(baseUrl)
            .post('/resources')
            .set('Authorization', `Bearer ${viewerToken}`)
            .send({ name: 'Unauthorized Hall', capacity: 20 });

        expect(res.status).toBe(403); // Forbidden
    });

    it('Unauthorized user should be redirected to login', async () => {
        const res = await request(baseUrl)
            .get('/user/profile');

        expect(res.status).toBe(401); // Unauthorized
    });

    it('Admin should be able to delete users', async () => {
        const res = await request(baseUrl)
            .delete('/users/123')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});
