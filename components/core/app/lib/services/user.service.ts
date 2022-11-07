import { Inject, Injectable } from '@nestjs/common';
import { AuditWriterService } from './audit-writer.service';
import { UserManager } from '../extensions/user-manager';
import { Principal } from '../models/principal';
import { User } from '../models/user';
import { AuditEvent } from '../models/audit-event';

@Injectable()
export class UserService {
  constructor(
    private readonly auditWriter: AuditWriterService,
    @Inject(UserManager) private readonly userManager: UserManager,
  ) {}

  async getUser(props: { token: string; principal: Principal }): Promise<User> {
    const user = await this.userManager.getUser({ token: props.token, principal: props.principal });
    return user;
  }

  async updateUser(props: { token: string; principal: Principal; updates: Partial<User> }): Promise<User> {
    const updatedUser = await this.userManager.updateUser({
      token: props.token,
      principal: props.principal,
      updates: props.updates,
    });

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'update-user',
        body: updatedUser,
      }),
    );
    return updatedUser;
  }

  async deleteUser(props: { token: string; principal: Principal }): Promise<void> {
    const existingUser = await this.userManager.getUser({ token: props.token, principal: props.principal });

    await this.userManager.deleteUser({ token: props.token });

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'delete-user',
        body: { uid: existingUser.uid, username: existingUser.username },
      }),
    );
  }
}
