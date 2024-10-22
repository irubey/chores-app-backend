import { Prisma } from "@prisma/client";

export const prismaExtensions = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          const result = await query(args);
          if (result && (result as any).deletedAt !== null) {
            return null;
          }
          return result;
        },
        async delete({ model, operation, args, query }) {
          // Check if the model has a deletedAt field
          const dmmf = Prisma.dmmf.datamodel.models.find(
            (m) => m.name === model
          );
          const hasDeletedAt = dmmf?.fields.some((f) => f.name === "deletedAt");

          if (hasDeletedAt) {
            // Perform soft delete
            return (client as any)[model].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          } else {
            // Perform hard delete if no deletedAt field
            return query(args);
          }
        },
        async deleteMany({ model, operation, args, query }) {
          // Check if the model has a deletedAt field
          const dmmf = Prisma.dmmf.datamodel.models.find(
            (m) => m.name === model
          );
          const hasDeletedAt = dmmf?.fields.some((f) => f.name === "deletedAt");

          if (hasDeletedAt) {
            // Perform soft delete
            return (client as any)[model].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          } else {
            // Perform hard delete if no deletedAt field
            return query(args);
          }
        },
      },
    },
  });
});
