import {
  Household,
  HouseholdMember,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import {
  PrismaHouseholdBase,
  PrismaHouseholdWithFullRelations,
  PrismaUserMinimal,
} from "./transformerPrismaTypes";
import { transformUser } from "./userTransformer";

function isValidHouseholdRole(role: string): role is HouseholdRole {
  return Object.values(HouseholdRole).includes(role as HouseholdRole);
}

export function transformHousehold(household: PrismaHouseholdBase): Household {
  return {
    id: household.id,
    name: household.name,
    createdAt: household.createdAt,
    updatedAt: household.updatedAt,
    deletedAt: household.deletedAt ?? undefined,
    currency: household.currency,
    icon: household.icon ?? undefined,
    timezone: household.timezone,
    language: household.language,
  };
}

export function transformHouseholdToHouseholdWithMembers(
  household: PrismaHouseholdWithFullRelations
): HouseholdWithMembers {
  return {
    ...transformHousehold(household),
    members: household.members?.map((member) =>
      transformHouseholdMember(member)
    ),
  };
}

export function transformHouseholdMember(member: {
  id: string;
  userId: string;
  householdId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  isInvited: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  isSelected: boolean;
  lastAssignedChoreAt: Date | null;
  user?: PrismaUserMinimal;
}): HouseholdMemberWithUser {
  return {
    id: member.id,
    userId: member.userId,
    householdId: member.householdId,
    role: isValidHouseholdRole(member.role)
      ? member.role
      : HouseholdRole.MEMBER,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt ?? undefined,
    isInvited: member.isInvited,
    isAccepted: member.isAccepted,
    isRejected: member.isRejected,
    isSelected: member.isSelected,
    lastAssignedChoreAt: member.lastAssignedChoreAt ?? undefined,
    user: member.user ? transformUser(member.user) : undefined,
  };
}

export function transformCreateHouseholdDTO(
  dto: CreateHouseholdDTO
): Omit<PrismaHouseholdBase, "id" | "createdAt" | "updatedAt" | "deletedAt"> {
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
  Omit<PrismaHouseholdBase, "id" | "createdAt" | "updatedAt" | "deletedAt">
> {
  const transformed: Partial<PrismaHouseholdBase> = {};

  if (dto.name !== undefined) transformed.name = dto.name;
  if (dto.currency !== undefined) transformed.currency = dto.currency;
  if (dto.timezone !== undefined) transformed.timezone = dto.timezone;
  if (dto.language !== undefined) transformed.language = dto.language;

  return transformed;
}
