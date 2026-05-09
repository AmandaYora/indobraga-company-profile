import { BadRequestException, ValidationError, ValidationPipe } from "@nestjs/common";
import { ApiErrorDetail } from "@/core/api-error";

function collectValidationErrors(errors: ValidationError[], parentPath = ""): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownErrors = Object.values(error.constraints ?? {}).map((message) => ({
      field: path,
      message,
    }));
    const childErrors = collectValidationErrors(error.children ?? [], path);

    if (ownErrors.length === 0 && childErrors.length === 0) {
      return [
        {
          field: path,
          message: "Field tidak valid.",
        },
      ];
    }

    return [...ownErrors, ...childErrors];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Input tidak valid.",
        details: collectValidationErrors(errors),
      }),
  });
}
