#ifndef SRC_WINDOWS_VOLUME_H_
#define SRC_WINDOWS_VOLUME_H_

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
#include <Rpc.h>
#include <Shlobj.h>
#include <vector>
#include "src/mountpoint.h"
#include "src/windows/com.h"
#include "src/windows/wmi.h"

namespace drivelist {
namespace volume {

enum class Type {
  UNKNOWN,
  NO_ROOT_DIRECTORY,
  REMOVABLE_DISK,
  LOCAL_DISK,
  NETWORK_DRIVE,
  COMPACT_DISK,
  RAM_DISK
};

HRESULT GetSystemVolume(wchar_t *out);
HRESULT GetAvailableVolumes(std::vector<wchar_t> *const output);
HANDLE OpenHandle(const wchar_t letter, DWORD flags);
HRESULT GetDeviceNumber(const wchar_t letter, ULONG *out);
HRESULT IsDiskWritable(const wchar_t letter, BOOL *out);
HRESULT IsVolumeWritable(const wchar_t letter, BOOL *out);
HRESULT HasFileSystem(const wchar_t letter, BOOL *out);
Type GetType(const wchar_t letter);

}  // namespace volume
}  // namespace drivelist

#endif  // SRC_WINDOWS_VOLUME_H_
