import { define } from 'typeorm-seeding';
import { Role } from '../user/entities/role.entity';

define(Role, () => {
  const role = new Role();
  role.roleName = 'user';
  return role;
});
