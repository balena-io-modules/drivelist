#ifndef SRC_WINDOWS_DISK_H_
#define SRC_WINDOWS_DISK_H_

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

#include <windows.h>
#include <string>

namespace drivelist {
namespace disk {

struct disk_information_s {
  LONGLONG size;
  BOOL removable;
};

HANDLE OpenHandle(const std::string &disk);
HRESULT GetInformation(const std::string &disk,
                       struct disk_information_s * const information);

}  // namespace disk
}  // namespace drivelist

#endif  // SRC_WINDOWS_DISK_H_
