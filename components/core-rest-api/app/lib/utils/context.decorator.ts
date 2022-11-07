import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Context = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const response = ctx.switchToHttp().getResponse();
  return response?.locals?.requestContext;
});
