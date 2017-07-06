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

#include "src/windows/disk.h"
#include "src/log.h"

HRESULT drivelist::disk::GetSize(std::string disk, LONGLONG *out) {
  drivelist::Debug("Opening handle on " + disk);
  HANDLE handle = CreateFile(disk.c_str(), 0, FILE_SHARE_READ, NULL,
                             OPEN_EXISTING, 0, NULL);
  if (handle == INVALID_HANDLE_VALUE)
    return E_HANDLE;

  DISK_GEOMETRY_EX geometry;
  DWORD bytesReturned;

  drivelist::Debug("Getting drive geometry");
  BOOL success = DeviceIoControl(handle, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX,
                                 NULL, 0,
                                 &geometry, sizeof(geometry),
                                 &bytesReturned, NULL);
  if (!success) {
    HRESULT result = HRESULT_FROM_WIN32(GetLastError());

    // This error represents "the device is not ready", and will
    // occur on SD Card readers that don't have an SD Card plugged in.
    // The documentation explicitly states that the ERROR_NOT_READY
    // constant is equal to this hexadecimal number, but it doesn't
    // seem to be the case.
    if (result == 0x80070015) {
      drivelist::Debug("Ignoring, device not ready");
      *out = NULL;
      return S_OK;
    }

    return result;
  }

  *out = geometry.DiskSize.QuadPart;
  return S_OK;
}
