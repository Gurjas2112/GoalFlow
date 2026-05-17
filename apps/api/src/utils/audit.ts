import prisma from '../prisma';

export async function writeAudit(params: {
  userId: string;
  action: string;
  goalId?: string;
  goalSheetId?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}) {
  await prisma.auditLog.create({ data: params });
}
