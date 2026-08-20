import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@repo/backend/convex/_generated/api";

const STORAGE_KEY = "invo:currentOrgId";

/**
 * Hook that manages the currently selected organization.
 *
 * - Fetches all orgs the user is a member of via Convex query.
 * - Persists selection in AsyncStorage.
 * - Auto-selects the first org if none is persisted or the persisted org
 *   is no longer in the user's membership list.
 * - Returns null for currentOrg when user has no organizations.
 */
export function useCurrentOrg() {
  const orgs = useQuery(api.organizations.listMyOrganizations);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted org ID on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setSelectedOrgId(stored);
      setIsLoading(false);
    });
  }, []);

  // Auto-select: if the persisted org is no longer valid, pick the first one
  useEffect(() => {
    if (!orgs || isLoading) return;

    if (orgs.length === 0) {
      if (selectedOrgId !== null) {
        setSelectedOrgId(null);
        AsyncStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    const isValid = orgs.some((o) => o._id === selectedOrgId);
    if (!isValid) {
      const firstId = orgs[0]._id;
      setSelectedOrgId(firstId);
      AsyncStorage.setItem(STORAGE_KEY, firstId);
    }
  }, [orgs, selectedOrgId, isLoading]);

  const selectOrg = useCallback((orgId: string) => {
    setSelectedOrgId(orgId);
    AsyncStorage.setItem(STORAGE_KEY, orgId);
  }, []);

  const currentOrg = orgs?.find((o) => o._id === selectedOrgId) ?? null;

  return {
    /** The currently selected organization (null if user has no orgs) */
    currentOrg,
    /** All organizations the user belongs to */
    organizations: orgs ?? [],
    /** Whether org data is still loading */
    isLoading: isLoading || orgs === undefined,
    /** Whether the user has no organizations */
    hasNoOrgs: orgs !== undefined && orgs.length === 0,
    /** Switch to a different organization */
    selectOrg,
  };
}
