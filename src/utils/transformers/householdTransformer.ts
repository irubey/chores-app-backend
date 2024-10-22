import {
  Household,
  HouseholdMember,
  User,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";

export type PrismaHousehold = Omit<
  Household,
  "deletedAt" | "icon" | "timezone" | "language"
> & {
  deletedAt: Date | null;
  icon: string | null;
  timezone: string;
  language: string;
  members?: PrismaHouseholdMember[];
};

export type PrismaHouseholdMember = Omit<
  HouseholdMember,
  "role" | "leftAt" | "lastAssignedChoreAt"
> & {
  role: string;
  leftAt: Date | null;
  lastAssignedChoreAt: Date | null;
  user?: PrismaUser;
};

type PrismaUser = Omit<User, "deletedAt" | "profileImageURL"> & {
  deletedAt: Date | null;
  profileImageURL: string | null;
};

function isValidHouseholdRole(role: string): role is HouseholdRole {
  return Object.values(HouseholdRole).includes(role as HouseholdRole);
}

export function transformHouseholdToHouseholdWithMembers(
  household: PrismaHousehold
): HouseholdWithMembers {
  return {
    ...household,
    deletedAt: household.deletedAt ?? undefined,
    icon: household.icon ?? undefined,
    members: household.members
      ? household.members.map(transformHouseholdMember)
      : undefined,
  };
}

export function transformHouseholdMember(
  member: PrismaHouseholdMember
): HouseholdMemberWithUser {
  return {
    ...member,
    role: isValidHouseholdRole(member.role)
      ? member.role
      : HouseholdRole.MEMBER,
    leftAt: member.leftAt ?? undefined,
    lastAssignedChoreAt: member.lastAssignedChoreAt ?? undefined,
    user: member.user ? transformUser(member.user) : undefined,
  };
}

function transformUser(user: PrismaUser): User {
  return {
    ...user,
    deletedAt: user.deletedAt ?? undefined,
    profileImageURL: user.profileImageURL ?? "",
  };
}
