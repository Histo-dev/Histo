import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'sqljs',
  location: configService.get<string>('DATABASE_PATH', './data/histo.db'),
  autoSave: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') === 'development', // production에서는 false
  logging: configService.get<string>('NODE_ENV') === 'development',
  autoLoadEntities: true,
});