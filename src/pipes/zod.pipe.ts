import { PipeTransform, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ZodType } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) { }

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const parsedValue = this.schema.safeParse(value);
    if (parsedValue.success) {
      return parsedValue.data;
    }
    const errors = parsedValue.error.issues;
    const details = errors.map((err) => ({
      field: err.path[0],
      message: err.message
    }));

    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      details
    });
  }
}
