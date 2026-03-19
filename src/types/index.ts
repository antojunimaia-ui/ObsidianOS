// ============================================
// ObsidianOS Type Definitions
// ============================================

export interface Process {
  pid: number;
  name: string;
  title: string;
  icon: string;
  status: 'running' | 'suspended' | 'terminated';
  memoryUsage: number; // in MB
  cpuUsage: number; // percentage
  startTime: number;
  parentPid?: number;
  windowId?: string;
}

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
  opacity: number;
  isResizable: boolean;
  isDraggable: boolean;
  isClosable: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  processId: number;
  prevBounds?: { x: number; y: number; width: number; height: number };
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'directory' | 'shortcut';
  path: string;
  parentPath: string;
  size: number;
  icon?: string;
  extension?: string;
  content?: string;
  children?: string[]; // paths
  createdAt: number;
  modifiedAt: number;
  accessedAt: number;
  permissions: FilePermissions;
  attributes: FileAttributes;
  metadata?: Record<string, string>;
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  hidden: boolean;
  system: boolean;
}

export interface FileAttributes {
  isReadOnly: boolean;
  isHidden: boolean;
  isSystem: boolean;
  isArchive: boolean;
}

export interface RegistryKey {
  path: string;
  name: string;
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_BINARY' | 'REG_MULTI_SZ' | 'REG_EXPAND_SZ' | 'REG_QWORD';
  value: string | number | boolean | string[];
  children?: Record<string, RegistryKey>;
}

export interface RegistryHive {
  HKEY_CURRENT_USER: Record<string, RegistryKey>;
  HKEY_LOCAL_MACHINE: Record<string, RegistryKey>;
  HKEY_CLASSES_ROOT: Record<string, RegistryKey>;
  HKEY_USERS: Record<string, RegistryKey>;
  HKEY_CURRENT_CONFIG: Record<string, RegistryKey>;
}

export interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  appId: string;
  position: { x: number; y: number };
  isSelected: boolean;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actions?: { label: string; onClick: () => void }[];
  read: boolean;
}

export interface SystemTheme {
  mode: 'dark' | 'light';
  accentColor: string;
  wallpaper: string;
  transparency: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  fontSize: 'small' | 'medium' | 'large';
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatar: string;
  password: string;
  isAdmin: boolean;
  lastLogin: number;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  onClick?: () => void;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ windowId: string }>;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  isResizable: boolean;
  isSingleInstance: boolean;
  category: 'system' | 'productivity' | 'utilities' | 'entertainment';
}
