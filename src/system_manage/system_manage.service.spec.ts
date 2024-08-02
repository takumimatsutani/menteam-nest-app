import { Test, TestingModule } from '@nestjs/testing';
import { SystemManageService } from './system_manage.service';

describe('SystemManageService', () => {
  let service: SystemManageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemManageService],
    }).compile();

    service = module.get<SystemManageService>(SystemManageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
