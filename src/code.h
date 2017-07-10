#ifndef SRC_CODE_H_
#define SRC_CODE_H_

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

#include <string>

namespace drivelist {

enum class Code {
  SUCCESS,
  ERROR_GENERIC,
  ERROR_ABORTED,
  ERROR_PERMISSION,
  ERROR_HANDLE,
  ERROR_INVALID_ARGUMENT,
  ERROR_NO_INTERFACE,
  ERROR_NOT_IMPLEMENTED,
  ERROR_OUT_OF_MEMORY,
  ERROR_POINTER
};

std::string GetCodeString(const Code &code);

}  // namespace drivelist

#endif  // SRC_CODE_H_
