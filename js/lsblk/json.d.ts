import { Drive } from '..';
interface LsblkJsonOutput {
    blockdevices: LsblkJsonOutputDevice[];
}
interface LsblkJsonOutputDevice {
    children: LsblkJsonOutputDeviceChild[];
    hotplug?: string;
    kname?: string;
    label: string | null;
    'log-sec'?: string;
    model: string | null;
    mountpoint: string | null;
    name: string;
    partlabel: string | null;
    'phy-sec'?: string;
    rm?: string;
    ro?: string;
    size?: string;
    subsystems?: string;
    tran?: string;
    vendor: string | null;
    pttype?: 'gpt' | 'dos';
}
interface LsblkJsonOutputDeviceChild {
    label: string | null;
    mountpoint?: string;
    partlabel: string | null;
}
export declare function transform(data: LsblkJsonOutput): Drive[];
export declare function parse(stdout: string): Drive[];
export {};
