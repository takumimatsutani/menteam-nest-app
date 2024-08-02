import { Test, TestingModule } from '@nestjs/testing';
import { SystemManageController } from './system_manage.controller';

describe('SystemManageController', () => {
  let controller: SystemManageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemManageController],
    }).compile();

    controller = module.get<SystemManageController>(SystemManageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
