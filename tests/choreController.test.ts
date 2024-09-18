import request from 'supertest';
import { app } from '../src/app';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestHousehold, createTestChore } from './testHelpers';

const prisma = new PrismaClient();

describe('Chore Controller', () => {
  let testUser: any;
  let testHousehold: any;
  let testChore: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = await createTestUser(prisma);
    testHousehold = await createTestHousehold(prisma, testUser.id);
    testChore = await createTestChore(prisma, testHousehold.id);
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'testpassword' });
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.chore.deleteMany();
    await prisma.household.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/chores', () => {
    it('should return a list of chores for the household', async () => {
      const response = await request(app)
        .get('/api/chores')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });
  });

  describe('POST /api/chores', () => {
    it('should create a new chore', async () => {
      const newChore = {
        title: 'Test Chore',
        description: 'This is a test chore',
        frequency: 'WEEKLY',
        householdId: testHousehold.id,
      };

      const response = await request(app)
        .post('/api/chores')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newChore);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newChore.title);
    });
  });

  describe('GET /api/chores/:id', () => {
    it('should return a specific chore', async () => {
      const response = await request(app)
        .get(`/api/chores/${testChore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testChore.id);
      expect(response.body).toHaveProperty('title', testChore.title);
    });
  });

  describe('PATCH /api/chores/:id', () => {
    it('should update a chore', async () => {
      const updatedChore = {
        title: 'Updated Test Chore',
      };

      const response = await request(app)
        .patch(`/api/chores/${testChore.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedChore);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testChore.id);
      expect(response.body).toHaveProperty('title', updatedChore.title);
    });
  });

  describe('DELETE /api/chores/:id', () => {
    it('should delete a chore', async () => {
      const response = await request(app)
        .delete(`/api/chores/${testChore.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const checkChore = await prisma.chore.findUnique({
        where: { id: testChore.id },
      });
      expect(checkChore).toBeNull();
    });
  });
});