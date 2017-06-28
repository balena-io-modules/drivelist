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

HRESULT drivelist::volume::IsDiskWritable(const wchar_t letter, BOOL *out) {
  HANDLE handle = drivelist::volume::OpenHandle(letter, 0);
  if (handle == INVALID_HANDLE_VALUE)
    return E_HANDLE;

  DWORD bytesReturned;

  // The IOCTL_DISK_IS_WRITABLE returns
  // FALSE if the device is read-only
  // See https://msdn.microsoft.com/en-us/library/windows/desktop/aa365182(v=vs.85).aspx
  const BOOL isDiskWritable = DeviceIoControl(handle, IOCTL_DISK_IS_WRITABLE,
                                              NULL, 0,
                                              NULL, 0,
                                              &bytesReturned, NULL);

  *out = isDiskWritable;
  CloseHandle(handle);
  return S_OK;
}

HRESULT drivelist::volume::IsVolumeWritable(const wchar_t letter, BOOL *out) {
  DWORD filesystemFlags = 0;
  TCHAR drivePath[kVolumePathShortLength];
  sprintf_s(drivePath, "%c:\\", letter);

  BOOL result = GetVolumeInformation(drivePath, NULL,
                                     0, NULL,
                                     NULL, &filesystemFlags, NULL, 0);

  if (!result)
    return E_FAIL;

  if (filesystemFlags & FILE_READ_ONLY_VOLUME) {
    *out = TRUE;
  } else {
    *out = FALSE;
  }

  return S_OK;
}

HRESULT drivelist::volume::HasFileSystem(const wchar_t letter, BOOL *out) {
  HANDLE handle = drivelist::volume::OpenHandle(letter, 0);
  if (handle == INVALID_HANDLE_VALUE)
    return E_HANDLE;

  PARTITION_INFORMATION_EX information;
  DWORD bytesReturned;

  if (!DeviceIoControl(handle, IOCTL_DISK_GET_PARTITION_INFO_EX, NULL, 0,
                       &information, sizeof(information),
                       &bytesReturned, NULL)) {
    CloseHandle(handle);
    return E_FAIL;
  }

  // See https://msdn.microsoft.com/en-us/library/windows/desktop/aa365448(v=vs.85).aspx
  switch (information.PartitionStyle) {
  case 0:  // MBR
    *out = IsRecognizedPartition(information.Mbr.PartitionType);
    break;
  case 1:  // GPT

    // TODO(jviotti): The Windows API documents a constant called
    // PARTITION_ENTRY_UNUSED_GUID, but I can't find its definition anywhere.
    *out = information.Gpt.PartitionType.Data1 != 0;

    break;
  default:  // RAW
    *out = FALSE;
  }

  CloseHandle(handle);
  return S_OK;
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
