import { BadRequestException, Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    throw new BadRequestException({
      test: 10,
      x: "Hell"
    });
    return "Hell";
  }
}
