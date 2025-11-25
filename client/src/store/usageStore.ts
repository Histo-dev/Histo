import { create } from "zustand"

type UsageState = {
  totalTimeMinutes: number
  totalSites: number
  setTotals: (timeMinutes: number, sites: number) => void
}

export const useUsageStore = create<UsageState>((set) => ({
  // initial demo values; real data should be set by background / data layer
  totalTimeMinutes: 270,
  totalSites: 24,
  setTotals: (timeMinutes: number, sites: number) => set({ totalTimeMinutes: timeMinutes, totalSites: sites }),
}))

export default useUsageStore
