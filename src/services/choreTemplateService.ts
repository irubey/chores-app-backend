import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createChoreTemplate = async (templateData: any) => {
  return prisma.choreTemplate.create({
    data: templateData,
  });
};

export const getChoreTemplates = async () => {
  return prisma.choreTemplate.findMany();
};

export const getChoreTemplateDetails = async (templateId: string) => {
  const choreTemplate = await prisma.choreTemplate.findUnique({
    where: { id: templateId },
  });

  if (!choreTemplate) {
    throw new Error('Chore template not found');
  }

  return choreTemplate;
};

export const updateChoreTemplate = async (templateId: string, templateData: any) => {
  return prisma.choreTemplate.update({
    where: { id: templateId },
    data: templateData,
  });
};

export const deleteChoreTemplate = async (templateId: string) => {
  return prisma.choreTemplate.delete({
    where: { id: templateId },
  });
};

async function getPresetTemplates() {
  return prisma.choreTemplate.findMany({
    where: { is_preset: true },
  });
}

// Add this to your exports
export { getPresetTemplates };