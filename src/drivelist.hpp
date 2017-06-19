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

#ifndef SRC_DRIVELIST_HPP_
#define SRC_DRIVELIST_HPP_

#include <nan.h>
#include <string>
#include <vector>

struct MountPoint {
  std::string path;
};

struct DriveDescriptor {
  std::string device;
  std::string raw;
  std::string description;
  uint64_t size;
  std::vector<MountPoint> mountpoints;
  bool isProtected;
  bool isSystem;
};

std::vector<DriveDescriptor> list_storage_devices();
v8::Local<v8::Object> pack_drive_descriptor(const DriveDescriptor *instance);

NAN_METHOD(list);

#endif  // SRC_DRIVELIST_HPP_
