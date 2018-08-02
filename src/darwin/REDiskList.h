//
//  REDiskList.h
//  drivelist
//
//  Created by Robin Andersson on 2018-08-02.
//  Copyright © 2018 Robin Andersson <me@robinwassen.com>. All rights reserved.
//

#ifndef SRC_DARWIN_REDISKLIST_H_
#define SRC_DARWIN_REDISKLIST_H_

#import <Foundation/Foundation.h>

/**
 * Class to return a list of disks synchronously
 * To use the class, just init an instance of it and
 * it will populate the disks property with NSStrings
 *
 * @author Robin Andersson
 */
@interface REDiskList : NSObject

/**
 * NSArray of disks and partitions
 * Disks are in the format disk0, disk1 etc
 * Partitions are in the format disk0s1, disk1s1 etc
 */
@property(readonly) NSArray *disks;

@end

#endif  // SRC_DARWIN_REDISKLIST_H_
