import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AuditWriterService } from './audit-writer.service';
import { Boom } from '../utils/boom';
import { UsersManager, CreateUser } from '../extensions/users-manager';
import { ListResult } from '../models/list-result';
import { User } from '../models/user';
import { AuditEvent } from '../models/audit-event';
import { processInBatches } from '../utils/processing';

type ListUserProps = {
  maxResults?: number;
  nextToken?: string;
  fields?: string[];
};

type BulkCreatableUser = Partial<User> & Required<Pick<User, 'username' | 'email' | 'userRoles'>>;

@Injectable()
export class UsersService {
  constructor(
    private readonly auditWriter: AuditWriterService,
    @Inject(UsersManager) private readonly usersManager: UsersManager,
  ) {}

  async getUser(props: { uid: string }): Promise<User | undefined> {
    return this.usersManager.getUser(props.uid);
  }

  async createUser(props: { user: CreateUser }): Promise<User> {
    const result = await this.usersManager.createUser(props.user);

    // Write audit event
    await this.auditWriter.write(new AuditEvent({ action: 'create-user', body: result }));
    return result;
  }

  async createUsers({ users, batchSize = 5 }: { users: BulkCreatableUser[]; batchSize?: number }): Promise<{
    successCount: number;
    errorCount: number;
  }> {
    const errorMsgs: string[] = [];
    let successCount = 0;
    let errorCount = 0;
    let internalErrorOccurred = false;
    const createUser = async (curUser: BulkCreatableUser) => {
      try {
        const name = curUser.email;
        const userWithDefaults: CreateUser = {
          ...curUser,
          firstName: curUser.firstName || name,
          lastName: curUser.lastName || name,
          enabled: true,
        };

        await this.createUser({ user: userWithDefaults });
        successCount += 1;
      } catch (error) {
        const email = curUser.email ?? 'UNKNOWN';
        const boom = (error as HttpException).getResponse() as Boom; // The boom is in the response field
        const errorMsg = boom.safe // if error is boom error then see if it is safe to propagate it's message
          ? `Error creating user with email "${email}". ${boom.message}`
          : `Error creating user with email "${email}"`;

        errorMsgs.push(errorMsg);
        if ((error as HttpException).getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
          internalErrorOccurred = true;
        }
        errorCount += 1;
      }
    };
    // Create users in parallel in the specified batches
    await processInBatches(users, batchSize, createUser);
    if (errorMsgs?.length) {
      const boom = Boom.safeMsg(`Errors creating users in bulk`).withPayload(errorMsgs);

      if (internalErrorOccurred) {
        throw new InternalServerErrorException(boom);
      } else {
        throw new BadRequestException(boom);
      }
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'create-users-batch',
        body: { totalUsers: users.length },
      }),
    );

    return { successCount, errorCount };
  }

  async updateUser(props: { uid: string; user: Partial<User> }): Promise<User> {
    const existingUser = await this.usersManager.getUser(props.uid);

    const updatedUser = await this.usersManager.updateUser(props.uid!, props.user);

    // if (props.user.userRole) {
    if (!existingUser) {
      throw new NotFoundException(Boom.safeMsg(`Cannot update user "${props.uid}". The user does not exist`));
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'update-user',
        body: updatedUser,
      }),
    );

    return updatedUser;
  }

  async deleteUser(props: { uid: string }): Promise<User> {
    const existingUser = await this.usersManager.getUser(props.uid);

    if (!existingUser) {
      throw new NotFoundException(Boom.safeMsg('The user to be deleted does not exist'));
    }

    await this.usersManager.deleteUser(props.uid);

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'delete-user',
        body: { uid: existingUser.uid, username: existingUser.username },
      }),
    );

    return existingUser;
  }

  async listUsers({ maxResults = 1000, nextToken, fields = [] }: ListUserProps): Promise<ListResult<User>> {
    return this.usersManager.listUsers({ maxResults, nextToken, fields });
  }
}
