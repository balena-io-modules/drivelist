/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <nan.h>
#include "../drivelist.hpp"

#import <Cocoa/Cocoa.h>
#import <DiskArbitration/DiskArbitration.h>

namespace Drivelist {

  NSNumber *DictNum(CFDictionaryRef dict, const void *key) {
      return (NSNumber*)CFDictionaryGetValue(dict, key);
  }

  std::vector<DeviceDescriptor> ListStorageDevices() {
    std::vector<DeviceDescriptor> deviceList;

    NSArray* volumeKeys = [NSArray arrayWithObjects:NSURLVolumeNameKey, NSURLVolumeIsRemovableKey, nil];
    NSArray* volumePaths = [[NSFileManager defaultManager]
                            mountedVolumeURLsIncludingResourceValuesForKeys:volumeKeys
                            options:0];

    DeviceDescriptor device;
    for (NSURL* path in volumePaths) {
        device = DeviceDescriptor();
        device.enumerator = "NSFileManager";

        DASessionRef session = DASessionCreate(kCFAllocatorDefault);
        if (session == nil) {
            continue;
        }

        // Might want to create the DADisk from the bsdname instead
        DADiskRef disk = DADiskCreateFromVolumePath(kCFAllocatorDefault, session, (__bridge CFURLRef)path);
        if (disk == nil) {
            continue;
        }

        // BSDName is in the format disk0s1
        const char* bsdnameChar = DADiskGetBSDName(disk);
        if (bsdnameChar == nil) {
            continue;
        }

        std::string partitionBsdName = std::string(bsdnameChar);
        std::string diskBsdName = partitionBsdName.substr(0, partitionBsdName.find("s", 5));

        // Recreate the disk using the bsd name so we work in the disk
        // rather on volume level
        disk = DADiskCreateFromBSDName(kCFAllocatorDefault, session, diskBsdName.c_str());

        CFDictionaryRef diskDescription = DADiskCopyDescription(disk);

        NSString *busType       = (NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionDeviceProtocolKey);
        NSNumber *blockSize     = DictNum(diskDescription, kDADiskDescriptionMediaBlockSizeKey);
        bool isInternal         = [DictNum(diskDescription, kDADiskDescriptionDeviceInternalKey) boolValue];
        bool isRemovable        = [DictNum(diskDescription, kDADiskDescriptionMediaRemovableKey) boolValue];
        NSString *mediaPath     = (NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionMediaPathKey);

        device.busType          = [busType UTF8String];
        device.busVersion       = ""; // null
        device.device           = "/dev/" + diskBsdName;
        device.devicePath       = ""; // null
        device.raw              = "/dev/r" + diskBsdName;
        device.description      = [(NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionMediaNameKey) UTF8String];
        device.error            = "";
        // NOTE: Not sure if kDADiskDescriptionMediaBlockSizeKey returns
        // the physical or logical block size since both values are equal
        // on my machine
        //
        // The can be checked with the following command:
        //      diskutil info / | grep "Block Size"
        device.blockSize        = [blockSize unsignedIntValue];
        device.logicalBlockSize = [blockSize unsignedIntValue];
        device.size             = [DictNum(diskDescription, kDADiskDescriptionMediaSizeKey) unsignedLongValue];
        device.isReadOnly       = ![DictNum(diskDescription, kDADiskDescriptionMediaWritableKey) boolValue];
        device.isSystem         = isInternal && !isRemovable;
        // NOTE(robin):
        // diskutil has four different values for this virtual vs physical
        // "physical", "synthesized", "disk image" and "virtual"
        //
        // You can see the implementation of it by disassembling
        // it and look at -[DiskInformation printWholeDisk:what:]:
        // It also uses private DiskManagement.framework for some operations
        //
        // This implementation currently only does the "synthesized" check
        device.isVirtual        = [mediaPath containsString:@"AppleAPFSContainerScheme"];
        device.isRemovable      = isRemovable;
        device.isCard           = false;  // null
        // NOTE(robin): Not convinced that bus these bus types should result
        // in device.isSCSI = true, it is rather "not usb or sd drive" bool
        // But the old implementation was like this so kept it this way
        NSArray *scsiTypes      = [NSArray arrayWithObjects:@"SATA", @"SCSI", @"ATA", @"IDE", @"PCI", nil];
        device.isSCSI           = [scsiTypes containsObject:busType];
        device.isUSB            = [busType isEqualToString:@"USB"];
        device.isUAS            = false;   // null

        device.mountpoints.push_back([[path path] UTF8String]);

        deviceList.push_back(device);
    }

    // Reduce one entry per volume to one entry per device
    for(std::vector<int>::size_type i = deviceList.size() - 1; i != (std::vector<int>::size_type) -1; i--) {
        DeviceDescriptor *thisDevice = &deviceList[i];

        for(std::vector<int>::size_type j = i - 1; j != (std::vector<int>::size_type) -1; j--) {
            DeviceDescriptor *nextDevice = &deviceList[j];

            // Transfer mount points to next device and remove this device
            if (thisDevice->device == nextDevice->device) {
                nextDevice->mountpoints.insert(nextDevice->mountpoints.end(),
                                              thisDevice->mountpoints.begin(),
                                              thisDevice->mountpoints.end());

                deviceList.erase(deviceList.begin()+i);
                break;
            }
        }
    }

    return deviceList;
  }

}  // namespace Drivelist
