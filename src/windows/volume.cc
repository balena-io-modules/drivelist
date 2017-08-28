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

HRESULT drivelist::volume::GetSystemVolume(wchar_t *out) {
  PWSTR windowsPath = NULL;
  HRESULT result = SHGetKnownFolderPath(FOLDERID_Windows, 0,
                                        NULL, &windowsPath);
  if (FAILED(result))
    return result;

  *out = windowsPath[0];
  CoTaskMemFree(windowsPath);
  return S_OK;
}

HRESULT
drivelist::volume::GetAvailableVolumes(std::vector<wchar_t> *const output) {
  DWORD logicalDrivesMask = GetLogicalDrives();
  if (logicalDrivesMask == 0)
    return E_FAIL;

  TCHAR currentDriveLetter = 'A';

  while (logicalDrivesMask) {
    if (logicalDrivesMask & 1)
      output->push_back(currentDriveLetter);
    currentDriveLetter++;
    logicalDrivesMask >>= 1;
  }

  return S_OK;
}

HANDLE drivelist::volume::OpenHandle(const wchar_t letter, DWORD flags) {
  TCHAR devicePath[8];
  sprintf_s(devicePath, "\\\\.\\%c:", letter);
  return CreateFile(devicePath, flags, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0,
                    NULL);
}

HRESULT drivelist::volume::GetDeviceNumber(const wchar_t letter, ULONG *out) {
  HANDLE handle = drivelist::volume::OpenHandle(letter, 0);
  if (handle == INVALID_HANDLE_VALUE)
    return HRESULT_FROM_WIN32(GetLastError());

  STORAGE_DEVICE_NUMBER storageDeviceNumber;
  DWORD bytesReturned;

  if (!DeviceIoControl(handle, IOCTL_STORAGE_GET_DEVICE_NUMBER, NULL, 0,
                       &storageDeviceNumber, sizeof(storageDeviceNumber),
                       &bytesReturned, NULL)) {
    CloseHandle(handle);
    return HRESULT_FROM_WIN32(GetLastError());
  }

  *out = storageDeviceNumber.DeviceNumber;
  CloseHandle(handle);
  return S_OK;
}

HRESULT drivelist::volume::IsDiskWritable(const wchar_t letter, BOOL *out) {
  HANDLE handle = drivelist::volume::OpenHandle(letter, 0);
  if (handle == INVALID_HANDLE_VALUE)
    return HRESULT_FROM_WIN32(GetLastError());

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
    return HRESULT_FROM_WIN32(GetLastError());

  if (filesystemFlags & FILE_READ_ONLY_VOLUME) {
    *out = TRUE;
  } else {
    *out = FALSE;
  }

  return S_OK;
}

HRESULT drivelist::volume::HasFileSystem(const wchar_t letter, BOOL *out) {
  TCHAR drivePath[kVolumePathShortLength];
  sprintf_s(drivePath, "%c:\\", letter);
  BOOL result = GetVolumeInformation(drivePath, NULL, 0, NULL,
                                     NULL, NULL, NULL, 0);
  if (result) {
    *out = TRUE;
    return S_OK;
  }

  DWORD error = GetLastError();

  // ERROR_UNRECOGNIZED_VOLUME: when there is a partition table, but
  // no actual recognized partition
  // ERROR_INVALID_PARAMETER: when there is no partition table at all
  // ERROR_NOT_READY: when accessing an empty SD Card reader
  if (error == ERROR_UNRECOGNIZED_VOLUME ||
      error == ERROR_INVALID_PARAMETER ||
      error == ERROR_NOT_READY) {
    *out = FALSE;
    return S_OK;
  }

  return HRESULT_FROM_WIN32(error);
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
