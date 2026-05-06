import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function getErrorDetails(error: unknown): {
  message: string;
  code?: string;
  meta?: unknown;
  name?: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      message: error.message,
      code: error.code,
      meta: error.meta,
    };
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { message: error.message };
  }
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}

export function jsonServerError(
  context: string,
  error: unknown,
  userMessage: string,
  status = 500,
) {
  const details = getErrorDetails(error);
  console.error(`[${context}]`, {
    ...details,
    stack: error instanceof Error ? error.stack : undefined,
    raw: error,
  });
  return NextResponse.json(
    {
      error: userMessage,
      details: details.message,
      ...(details.code ? { code: details.code } : {}),
    },
    { status },
  );
}
