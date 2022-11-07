import { Provider, Module, Global } from '@nestjs/common';
import { configDbPrefixLoader } from '@aws-ee/common';
import { ConfigModule } from '@nestjs/config';
import { DynamooseModule } from 'nestjs-dynamoose';

import { AuditWriterService } from '../services/audit-writer.service';
import { UserAuthzService } from '../services/user-authz.service';
import { UserRolesService } from '../services/user-roles.service';
import { UsersService } from '../services/users.service';
import { LogAuditWriterService } from '../services/log-audit-writer.service';
import { ContextService } from '../services/context.service';
import { UserService } from '../services/user.service';

const providers: Provider[] = [
  AuditWriterService,
  LogAuditWriterService,
  UserAuthzService,
  UserRolesService,
  UserService,
  UsersService,
  ContextService,
];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
  ],
  providers,
  exports: providers,
})
export class CoreModule {}
