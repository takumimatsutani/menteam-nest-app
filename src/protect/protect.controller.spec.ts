import { Test, TestingModule } from '@nestjs/testing';
import { ProtectController } from './protect.controller';

describe('ProtectController', () => {
  let controller: ProtectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtectController],
    }).compile();

    controller = module.get<ProtectController>(ProtectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
