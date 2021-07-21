import { Drive } from '..';
export declare function getPartitionTableType(pttype?: 'gpt' | 'dos'): 'gpt' | 'mbr' | null;
export declare function lsblk(): Promise<Drive[]>;
