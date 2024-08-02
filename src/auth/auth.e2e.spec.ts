import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Auth and Protected Routes (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  beforeEach(async () => {
    const password = await bcrypt.hash('password', 10);
    await userRepository.save({
      email: 'test@example.com',
      password: password,
    });
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  it('should login and return a JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
  });

  it('should access protected route with JWT token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    const accessToken = loginResponse.body.accessToken;

    const protectedResponse = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(protectedResponse.body).toHaveProperty(
      'message',
      'This is a protected route',
    );
  });

  it('should not access protected route without JWT token', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
