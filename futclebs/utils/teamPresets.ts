export interface TeamPreset {
  id: string;
  name: string;
  playerIds: number[];
  coachId: number | null;
  updatedAt: string;
}

const buildKey = (organizationId: string | number) => `bolanope_org_${organizationId}_team_presets`;

export const loadTeamPresets = (organizationId?: string | number | null): TeamPreset[] => {
  if (!organizationId || typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(buildKey(organizationId));
    const parsed = raw ? (JSON.parse(raw) as TeamPreset[]) : [];
    return parsed
      .filter((preset) => preset?.id && preset?.name)
      .map((preset) => ({
        ...preset,
        playerIds: Array.from(new Set((preset.playerIds ?? []).map((id) => Number(id)).filter((id) => id > 0))),
        coachId: preset.coachId ? Number(preset.coachId) : null,
      }));
  } catch {
    return [];
  }
};

export const saveTeamPresets = (organizationId: string | number | null | undefined, presets: TeamPreset[]) => {
  if (!organizationId || typeof window === "undefined") return;
  window.localStorage.setItem(buildKey(organizationId), JSON.stringify(presets));
};
