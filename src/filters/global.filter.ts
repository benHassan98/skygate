import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as {
      code: string;
      details: object[]
    };
    response
      .status(exception.getStatus())
      .json({
        success: false,
        message: exception.message,
        error: {
          code: exceptionResponse["code"],
          details: exceptionResponse["details"]
        }
      });
  }
}
