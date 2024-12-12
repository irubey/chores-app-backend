import {
  Household,
  HouseholdMember,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
} from '@shared/types';
import { HouseholdRole } from '@shared/enums';
import {
  PrismaHouseholdBase,
  PrismaHouseholdWithFullRelations,
  PrismaUserMinimal,
} from './transformerPrismaTypes';
import { transformUser } from './userTransformer';

function isValidHouseholdRole(role: string): role is HouseholdRole {
  return Object.values(HouseholdRole).includes(role as HouseholdRole);
}

// Add specific type for member input
interface PrismaMemberInput {
  id: string;
  userId: string;
  householdId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  isInvited: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  nickname: string | null;
  user?: PrismaUserMinimal;
}

/**
 * Transforms a Prisma Household into a shared Household type
 */
export function transformHousehold(
  prismaHousehold: PrismaHouseholdBase | PrismaHouseholdWithFullRelations
): Household {
  const {
    id,
    name,
    createdAt,
    updatedAt,
    deletedAt,
    currency,
    icon,
    timezone,
    language,
  } = prismaHousehold;

  return {
    id,
    name,
    createdAt,
    updatedAt,
    deletedAt: deletedAt ?? undefined,
    currency,
    icon: icon ?? undefined,
    timezone,
    language,
  };
}

/**
 * Transforms a Prisma HouseholdMember into a shared HouseholdMember type
 */
export function transformMembership(membership: any): HouseholdMember {
  const sharedMembership: HouseholdMember = {
    id: membership.id,
    userId: membership.userId,
    householdId: membership.householdId,
    role: membership.role,
    joinedAt: membership.joinedAt,
    leftAt: membership.leftAt ?? undefined,
    isInvited: membership.isInvited,
    isAccepted: membership.isAccepted,
    isRejected: membership.isRejected,
    nickname: membership.nickname ?? undefined,
  };

  return sharedMembership;
}

/**
 * Transforms a Prisma Household with members into a shared HouseholdWithMembers type
 */
export function transformHouseholdWithMembers(
  prismaHousehold: PrismaHouseholdWithFullRelations
): HouseholdWithMembers {
  const household = transformHousehold(prismaHousehold);
  const members = prismaHousehold.members?.map(transformMembership) ?? [];

  return {
    ...household,
    members,
  };
}

export function transformHouseholdMember(
  member: PrismaMemberInput
): HouseholdMemberWithUser {
  if (!isValidHouseholdRole(member.role)) {
    throw new Error(`Invalid household role: ${member.role}`);
  }

  return {
    id: member.id,
    userId: member.userId,
    householdId: member.householdId,
    role: member.role as HouseholdRole,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt ?? undefined,
    isInvited: member.isInvited,
    isAccepted: member.isAccepted,
    isRejected: member.isRejected,
    nickname: member.nickname ?? undefined,
    user: member.user ? transformUser(member.user) : undefined,
  };
}

export function transformCreateHouseholdDTO(
  dto: CreateHouseholdDTO
): Omit<PrismaHouseholdBase, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  return {
    name: dto.name,
    currency: dto.currency,
    timezone: dto.timezone,
    language: dto.language,
    icon: null,
  };
}

export function transformUpdateHouseholdDTO(
  dto: UpdateHouseholdDTO
): Partial<
  Omit<PrismaHouseholdBase, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
> {
  const transformed: Partial<PrismaHouseholdBase> = {};

  if (dto.name !== undefined) transformed.name = dto.name;
  if (dto.currency !== undefined) transformed.currency = dto.currency;
  if (dto.timezone !== undefined) transformed.timezone = dto.timezone;
  if (dto.language !== undefined) transformed.language = dto.language;

  return transformed;
}
