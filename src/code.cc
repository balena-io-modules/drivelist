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

#include "src/code.h"

std::string drivelist::GetCodeString(const drivelist::Code &code) {
  switch (code) {
  case drivelist::Code::SUCCESS:
    return "Success";
  case drivelist::Code::ERROR_ABORTED:
    return "Aborted";
  case drivelist::Code::ERROR_PERMISSION:
    return "Permission error";
  case drivelist::Code::ERROR_HANDLE:
    return "Invalid handle";
  case drivelist::Code::ERROR_INVALID_ARGUMENT:
    return "Invalid argument";
  case drivelist::Code::ERROR_NO_INTERFACE:
    return "No such interface";
  case drivelist::Code::ERROR_NOT_IMPLEMENTED:
    return "Not implemented";
  case drivelist::Code::ERROR_OUT_OF_MEMORY:
    return "Out of memory";
  case drivelist::Code::ERROR_POINTER:
    return "Pointer error";
  default:
    return "An unknown error occurred";
  }
}
