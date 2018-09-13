type DriveList = {
    enumerator: string,
    busType: string,
    busVersion: string,
    device: string,
    devicePath: string,
    raw: string,
    description: string,
    error: string,
    size: number,
    blockSize: number,
    logicalBlockSize: number,
    mountpoints: { path: string }[],
    isReadOnly: boolean,
    isSystem: boolean,
    isVirtual: boolean,
    isRemovable: boolean,
    isCard: boolean,
    isSCSI: boolean,
    isUSB: boolean,
    isUAS: boolean,
}

export function list(callback: (error: Error, drives: DriveList) => void): void;
