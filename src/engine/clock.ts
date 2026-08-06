/**
 * Horloge monotone (performance.now) pour la mesure des durées de run : frappes, pauses,
 * chrono du HUD, garde de focus. Insensible aux sauts de l'horloge système (NTP, réglage
 * manuel) et précise à la sub-milliseconde.
 * Ne JAMAIS mélanger avec Date.now() (origines différentes) : les dates murales
 * (run.date, streaks, succès, profil) restent sur Date.now().
 */
export const nowMs = (): number => performance.now();
