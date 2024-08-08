import { Factory, Seeder } from 'typeorm-seeding';
import { DataSource } from 'typeorm';
import { Role } from '../user/entities/role.entity';

export default class CreateRoles implements Seeder {
  public async run(factory: Factory, dataSource: DataSource): Promise<void> {
    await dataSource
      .getRepository(Role)
      .save([
        { roleName: 'admin' },
        { roleName: 'user' },
        { roleName: 'guest' },
      ]);
  }
}
