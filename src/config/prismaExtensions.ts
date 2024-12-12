import { Prisma } from '@prisma/client';

const modelsWithSoftDelete = new Set([
  'User',
  'Household',
  'Thread',
  'Message',
  'Attachment',
  'Chore',
  'Expense',
  'Transaction',
  'Event',
]);

export const prismaExtensions = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (modelsWithSoftDelete.has(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          if (modelsWithSoftDelete.has(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          const result = await query(args);
          if (
            result &&
            modelsWithSoftDelete.has(model) &&
            (result as any).deletedAt !== null
          ) {
            return null;
          }
          return result;
        },
        async delete({ model, operation, args, query }) {
          if (modelsWithSoftDelete.has(model)) {
            // Perform soft delete
            return (client as any)[model].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          // Perform hard delete for models without soft delete
          return query(args);
        },
        async deleteMany({ model, operation, args, query }) {
          if (modelsWithSoftDelete.has(model)) {
            // Perform soft delete
            return (client as any)[model].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          // Perform hard delete for models without soft delete
          return query(args);
        },
      },
    },
  });
});
