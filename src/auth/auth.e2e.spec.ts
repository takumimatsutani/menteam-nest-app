import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../user/entities/role.entity';
import { UserRole } from '../user/entities/user-role.entity';
import { AuthService } from './auth.service';

describe('Auth and Protected Routes (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  const mockRoleRepository = {
    find: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockUserRoleRepository = {
    save: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    find: jest.fn(),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(Role))
      .useValue(mockRoleRepository)
      .overrideProvider(getRepositoryToken(UserRole))
      .useValue(mockUserRoleRepository)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  beforeEach(async () => {
    const password = await bcrypt.hash('password', 10);
    await userRepository.save({
      userId: 'test@example.com',
      password: password,
    });
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  it('should login and return a JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ userId: 'test@example.com', password: 'password' })
      .expect(201);

    expect(response.body).toHaveProperty('token');
  });

  it('should access protected route with JWT token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ userId: 'test@example.com', password: 'password' })
      .expect(201);

    const token = loginResponse.body.token;

    const protectedResponse = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(protectedResponse.body).toHaveProperty(
      'message',
      'This is a protected route',
    );
  });

  it('should not access protected route without JWT token', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('should register a new user and return user details and roles', async () => {
    const response = await request(app.getHttpServer())
      .post('/system_manage/user_add')
      .send({ userId: 'newuser@example.com', roleIds: [1, 2] })
      .expect(201);

    expect(response.body).toHaveProperty('message', 'newAdd');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('userId', 'newuser@example.com');
    expect(response.body).toHaveProperty('roles');
    expect(response.body.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ roleId: 1 }),
        expect.objectContaining({ roleId: 2 }),
      ]),
    );
  });

  it('should delete a user and return success message', async () => {
    await request(app.getHttpServer())
      .post('/system_manage/user_delete')
      .send({ userId: 'test@example.com' })
      .expect(200)
      .expect({
        message: 'success delete',
        userId: 'test@example.com',
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
