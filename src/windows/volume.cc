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

#include "src/windows/volume.h"

static const size_t kVolumePathShortLength = 4;

HANDLE drivelist::volume::OpenHandle(const wchar_t letter, DWORD flags) {
  TCHAR devicePath[8];
  sprintf_s(devicePath, "\\\\.\\%c:", letter);
  return CreateFile(devicePath, flags, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0,
                    NULL);
}

HRESULT drivelist::volume::GetDeviceNumber(const wchar_t letter, ULONG *out) {
  HANDLE handle = drivelist::volume::OpenHandle(letter, 0);
  if (handle == INVALID_HANDLE_VALUE)
    return E_HANDLE;

  STORAGE_DEVICE_NUMBER storageDeviceNumber;
  DWORD bytesReturned;

  if (!DeviceIoControl(handle, IOCTL_STORAGE_GET_DEVICE_NUMBER, NULL, 0,
                       &storageDeviceNumber, sizeof(storageDeviceNumber),
                       &bytesReturned, NULL)) {
    return E_FAIL;
  }

  *out = storageDeviceNumber.DeviceNumber;
  CloseHandle(handle);
  return S_OK;
}

HRESULT drivelist::volume::GetReadOnlyFlag(const wchar_t letter, BOOL *out) {
  DWORD filesystem_flags = 0;
  TCHAR drive_path[kVolumePathShortLength];
  sprintf_s(drive_path, "%c:\\", letter);

  const HRESULT result =
      GetVolumeInformation(drive_path, NULL, kVolumePathShortLength, NULL, NULL,
                           &filesystem_flags, NULL, 0);

  if (FAILED(result))
    return result;

  if (filesystem_flags & FILE_READ_ONLY_VOLUME) {
    *out = TRUE;
  } else {
    *out = FALSE;
  }

  return result;
}

drivelist::volume::Type drivelist::volume::GetType(const wchar_t letter) {
  TCHAR drivePath[kVolumePathShortLength];
  sprintf_s(drivePath, "%c:\\", letter);
  UINT type = GetDriveType(drivePath);

  switch (type) {
  case 1:
    return drivelist::volume::Type::NO_ROOT_DIRECTORY;
  case 2:
    return drivelist::volume::Type::REMOVABLE_DISK;
  case 3:
    return drivelist::volume::Type::LOCAL_DISK;
  case 4:
    return drivelist::volume::Type::NETWORK_DRIVE;
  case 5:
    return drivelist::volume::Type::COMPACT_DISK;
  case 6:
    return drivelist::volume::Type::RAM_DISK;
  default:
    return drivelist::volume::Type::UNKNOWN;
  }
}
