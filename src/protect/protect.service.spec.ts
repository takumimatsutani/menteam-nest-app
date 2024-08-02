import { Test, TestingModule } from '@nestjs/testing';
import { ProtectService } from './protect.service';

describe('ProtectService', () => {
  let service: ProtectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProtectService],
    }).compile();

    service = module.get<ProtectService>(ProtectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
