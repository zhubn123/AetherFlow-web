import { ref } from 'vue'

type NavGroupState = Record<string, boolean>

const NAV_COLLAPSED_KEY = 'af_nav_collapsed'
const NAV_GROUP_STATE_KEY = 'af_nav_group_state'

const defaultGroupState: NavGroupState = {
  overview: true,
  biz: true,
  base: false,
  system: false
}

const isNavCollapsed = ref(readCollapsedState())
const navGroupState = ref<NavGroupState>(readGroupState())

export function useNavState() {
  function toggleNavCollapsed(): void {
    setNavCollapsed(!isNavCollapsed.value)
  }

  function setNavCollapsed(value: boolean): void {
    isNavCollapsed.value = value
    persistCollapsedState(value)
  }

  function isGroupOpen(key: string): boolean {
    return navGroupState.value[key] ?? defaultGroupState[key] ?? true
  }

  function toggleGroup(key: string): void {
    setGroupOpen(key, !isGroupOpen(key))
  }

  function setGroupOpen(key: string, value: boolean): void {
    navGroupState.value = {
      ...navGroupState.value,
      [key]: value
    }
    persistGroupState(navGroupState.value)
  }

  function ensureGroupOpen(key: string): void {
    if (!isGroupOpen(key)) {
      setGroupOpen(key, true)
    }
  }

  return {
    isNavCollapsed,
    navGroupState,
    toggleNavCollapsed,
    setNavCollapsed,
    isGroupOpen,
    toggleGroup,
    setGroupOpen,
    ensureGroupOpen
  }
}

function readCollapsedState(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem(NAV_COLLAPSED_KEY) === '1'
}

function persistCollapsedState(value: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(NAV_COLLAPSED_KEY, value ? '1' : '0')
}

function readGroupState(): NavGroupState {
  if (typeof window === 'undefined') {
    return { ...defaultGroupState }
  }

  const raw = localStorage.getItem(NAV_GROUP_STATE_KEY)
  if (!raw) {
    return { ...defaultGroupState }
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...defaultGroupState }
    }

    return {
      ...defaultGroupState,
      ...Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      )
    }
  } catch {
    localStorage.removeItem(NAV_GROUP_STATE_KEY)
    return { ...defaultGroupState }
  }
}

function persistGroupState(state: NavGroupState): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(NAV_GROUP_STATE_KEY, JSON.stringify(state))
}
