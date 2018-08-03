/*
 * Copyright 2017 resin.io
 * Copyright 2018 Robin Andersson <me@robinwassen.com>
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

#import "REDiskList.h"
#import <Cocoa/Cocoa.h>
#import <DiskArbitration/DiskArbitration.h>

namespace Drivelist {
  bool IsDiskPartition(NSString *disk) {
    NSPredicate *partitionRegEx = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", @"disk\\d+s\\d+"];
    return [partitionRegEx evaluateWithObject:disk];
  }


  bool IsCard(CFDictionaryRef diskDescription) {
    CFDictionaryRef mediaIconDict = (CFDictionaryRef)CFDictionaryGetValue(diskDescription, kDADiskDescriptionMediaIconKey);
    NSString * iconFileName = (NSString*)CFDictionaryGetValue(mediaIconDict,
                                                              CFStringCreateWithCString(NULL, "IOBundleResourceFile", kCFStringEncodingUTF8));

    return [iconFileName isEqualToString:@"SD.icns"];
  }


  NSNumber *DictNum(CFDictionaryRef dict, const void *key) {
      return (NSNumber*)CFDictionaryGetValue(dict, key);
  }

  std::vector<DeviceDescriptor> ListStorageDevices() {
    std::vector<DeviceDescriptor> deviceList;
    REDiskList *dl = [[REDiskList alloc] init];

    DASessionRef session = DASessionCreate(kCFAllocatorDefault);
    if (session == nil) {
        return deviceList;
    }

    for (NSString* diskBsdName in dl.disks) {
        if (IsDiskPartition(diskBsdName)) {
            continue;
        }


        std::string diskBsdNameStr = [diskBsdName UTF8String];
        DADiskRef disk = DADiskCreateFromBSDName(kCFAllocatorDefault, session, diskBsdNameStr.c_str());
        if (disk == nil) {
            continue;
        }

        CFDictionaryRef diskDescription = DADiskCopyDescription(disk);

        NSString *busType       = (NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionDeviceProtocolKey);
        NSNumber *blockSize     = DictNum(diskDescription, kDADiskDescriptionMediaBlockSizeKey);
        bool isInternal         = [DictNum(diskDescription, kDADiskDescriptionDeviceInternalKey) boolValue];
        bool isRemovable        = [DictNum(diskDescription, kDADiskDescriptionMediaRemovableKey) boolValue];
        NSString *mediaPath     = (NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionMediaPathKey);

        DeviceDescriptor device = DeviceDescriptor();
        device.enumerator       = "DiskArbitration";
        device.busType          = [busType UTF8String];
        device.busVersion       = "";
        device.busVersionNull   = true;
        device.device           = "/dev/" + diskBsdNameStr;
        device.devicePath       = [(NSString*)CFDictionaryGetValue(diskDescription, kDADiskDescriptionBusPathKey) UTF8String];
        device.raw              = "/dev/r" + diskBsdNameStr;
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
        device.isVirtual        = [mediaPath containsString:@"AppleAPFSContainerScheme"];
        device.isRemovable      = isRemovable;
        device.isCard           = IsCard(diskDescription);
        // NOTE(robin): Not convinced that bus these bus types should result
        // in device.isSCSI = true, it is rather "not usb or sd drive" bool
        // But the old implementation was like this so kept it this way
        NSArray *scsiTypes      = [NSArray arrayWithObjects:@"SATA", @"SCSI", @"ATA", @"IDE", @"PCI", nil];
        device.isSCSI           = [scsiTypes containsObject:busType];
        device.isUSB            = [busType isEqualToString:@"USB"];
        device.isUAS            = false;
        device.isUASNull        = true;

        deviceList.push_back(device);
    }

    // Add mount points
    NSArray* volumeKeys = [NSArray arrayWithObjects:NSURLVolumeNameKey, NSURLVolumeLocalizedNameKey, nil];
    NSArray* volumePaths = [[NSFileManager defaultManager]
                            mountedVolumeURLsIncludingResourceValuesForKeys:volumeKeys
                            options:0];

    for (NSURL* path in volumePaths) {
        DADiskRef disk = DADiskCreateFromVolumePath(kCFAllocatorDefault, session, (__bridge CFURLRef)path);
        if (disk == nil) {
            continue;
        }

        const char* bsdnameChar = DADiskGetBSDName(disk);
        if (bsdnameChar == nil) {
            continue;
        }

        NSString *volumeName;
        [path getResourceValue:&volumeName forKey:NSURLVolumeLocalizedNameKey error:nil];

        std::string partitionBsdName = std::string(bsdnameChar);
        std::string diskBsdName = partitionBsdName.substr(0, partitionBsdName.find("s", 5));

        for(std::vector<int>::size_type i = 0; i != deviceList.size(); i++) {
            DeviceDescriptor *dd = &deviceList[i];

            if (dd->device == "/dev/" + diskBsdName) {
                dd->mountpoints.push_back([[path path] UTF8String]);
                dd->mountpointLabels.push_back([volumeName UTF8String]);
                break;
            }
        }
    }

    return deviceList;
  }

}  // namespace Drivelist
