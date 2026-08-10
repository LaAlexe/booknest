import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = testingModule.get<HealthController>(HealthController);
  });

  it('reports that the API is running', () => {
    expect(healthController.check()).toEqual({ status: 'ok' });
  });
});
