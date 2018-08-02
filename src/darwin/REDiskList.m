//
//  REDiskList.m
//  drivelist
//
//  Created by Robin Andersson on 2018-08-02.
//  Copyright © 2018 Robin Andersson <me@robinwassen.com>. All rights reserved.
//

#import "REDiskList.h"
#import <DiskArbitration/DiskArbitration.h>

@implementation REDiskList {
    NSMutableArray *_disks;
}

@synthesize disks = _disks;

- (id) init {
    if (self) {
        _disks = [[NSMutableArray alloc] init];
        [self populateDisksBlocking];
        [_disks sortUsingSelector:@selector(localizedCaseInsensitiveCompare:)];
    }

    return self;
}

void appendDisk(DADiskRef disk, void *context) {
    NSMutableArray *_disks = (__bridge NSMutableArray*)context;
    const char *bsdName = DADiskGetBSDName(disk);
    if (bsdName != nil) {
        [_disks addObject:[NSString stringWithUTF8String:bsdName]];
    }
}

- (void)populateDisksBlocking {
    DASessionRef session = DASessionCreate(kCFAllocatorDefault);
    if (session) {
        DARegisterDiskAppearedCallback(session, NULL, appendDisk, (void*)_disks);
        CFRunLoopRef runLoop = [[NSRunLoop currentRunLoop] getCFRunLoop];
        DASessionScheduleWithRunLoop(session, runLoop, kCFRunLoopDefaultMode);
        CFRunLoopStop(runLoop);
        CFRunLoopRunInMode((CFStringRef)NSDefaultRunLoopMode, 0.05, NO);
        CFRelease(session);
    }
}

@end
