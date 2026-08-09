import { create } from 'zustand'

// Global auth-dialog state so any component (Header, RoleMarquee, …) can open
// the dialog and optionally pre-select a role during signup.
interface AuthDialogState {
  open: boolean
  initialRole: string | null
  openDialog: (role?: string | null) => void
  closeDialog: () => void
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  open: false,
  initialRole: null,
  openDialog: (role = null) => set({ open: true, initialRole: role }),
  closeDialog: () => set({ open: false, initialRole: null }),
}))
