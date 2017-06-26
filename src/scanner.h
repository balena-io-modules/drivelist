#ifndef SRC_SCANNER_H_
#define SRC_SCANNER_H_

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

#include <vector>
#include "src/code.h"
#include "src/disk.h"
#include "src/mountpoint.h"

namespace drivelist {

class Scanner {
 public:
  drivelist::Code Initialize();
  drivelist::Code Uninitialize();
  drivelist::Code Scan(std::vector<drivelist::disk_s> *const output);

 private:
  void *context;
};

}  // namespace drivelist

#endif  // SRC_SCANNER_H_
