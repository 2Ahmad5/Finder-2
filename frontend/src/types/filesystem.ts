export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isApp: boolean;
  size: number;
  modifiedTime: string;
  iconPath: string;
}

export interface Folder {
  name: string;
  path: string;
  icon: string;
}
