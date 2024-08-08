module.exports = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'your_db_username',
  password: 'your_db_password',
  database: 'your_db_name',
  entities: ['src/**/*.entity{.ts,.js}'],
  seeds: ['src/seeds/**/*{.ts,.js}'],
  factories: ['src/factories/**/*{.ts,.js}'],
  synchronize: true,
};
