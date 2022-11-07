/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Boom } from '@aws-ee/core';
import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { Locals } from '../utils/locals.decorator';
import { ResponseLocals } from '../models/response-locals';

@Controller('/api/authentication')
export class AuthenticationController {
  @Get('status')
  getStatus(@Locals() locals: ResponseLocals) {
    if (!locals.authenticated) {
      throw new UnauthorizedException(Boom.safeMsg('Not authenticated'));
    }
    return { isAuthenticated: true };
  }
}
