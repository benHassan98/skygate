import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BasicGuard implements CanActivate {
  constructor(private roles: string[]) { }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const role: string = request.headers["x-user-role"];
    if (!role) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        details: [{
          field: "X-User-Role",
          message: "X-User-Role header is missing or invalid"
        }]
      });
    }
    if (!this.roles.includes(role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        details: [{
          field: "X-User-Role",
          message: "Admin role required for this operation"
        }]
      });
    }
    return true;
  }
}

