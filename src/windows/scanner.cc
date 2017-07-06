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

#include "src/scanner.h"
#include <windows.h>
#include <string>
#include <unordered_map>
#include <cstdint>
#include "src/windows/com.h"
#include "src/windows/volume.h"
#include "src/windows/disk.h"
#include "src/windows/wmi.h"
#include "src/log.h"

static drivelist::Code InterpretHRESULT(const HRESULT result) {
  switch (result) {
  case S_OK:
    return drivelist::Code::SUCCESS;
  case E_ABORT:
    return drivelist::Code::ERROR_ABORTED;
  case E_ACCESSDENIED:
    return drivelist::Code::ERROR_PERMISSION;
  case E_FAIL:
    return drivelist::Code::ERROR_GENERIC;
  case E_UNEXPECTED:
    return drivelist::Code::ERROR_GENERIC;
  case E_HANDLE:
    return drivelist::Code::ERROR_HANDLE;
  case E_INVALIDARG:
    return drivelist::Code::ERROR_INVALID_ARGUMENT;
  case E_NOINTERFACE:
    return drivelist::Code::ERROR_NO_INTERFACE;
  case E_NOTIMPL:
    return drivelist::Code::ERROR_NOT_IMPLEMENTED;
  case E_OUTOFMEMORY:
    return drivelist::Code::ERROR_OUT_OF_MEMORY;
  case E_POINTER:
    return drivelist::Code::ERROR_POINTER;
  }

  if (SUCCEEDED(result)) {
    return drivelist::Code::SUCCESS;
  }

  return drivelist::Code::ERROR_GENERIC;
}

// See https://stackoverflow.com/q/6284524
static std::string ConvertBSTRToString(const BSTR string) {
  const UINT wideLength = ::SysStringLen(string);
  const wchar_t *const wideString = reinterpret_cast<wchar_t *>(string);
  const int length = ::WideCharToMultiByte(CP_ACP, 0, wideString, wideLength,
                                           NULL, 0, NULL, NULL);
  std::string result(length, '\0');
  ::WideCharToMultiByte(CP_ACP, 0, wideString, wideLength, &result[0], length,
                        NULL, NULL);
  return result;
}

drivelist::Code drivelist::Scanner::Initialize() {
  drivelist::Debug("Initializing scanner");
  HRESULT result = drivelist::com::Initialize();
  if (FAILED(result))
    return InterpretHRESULT(result);
  this->context = reinterpret_cast<void *>(new drivelist::com::Connection());
  result = drivelist::wmi::ConnectToLocalComputer(
      (drivelist::com::Connection *)this->context);
  return InterpretHRESULT(result);
}

drivelist::Code drivelist::Scanner::Uninitialize() {
  drivelist::Debug("Unitializing scanner");
  delete (drivelist::com::Connection *)this->context;
  drivelist::com::Uninitialize();
  return drivelist::Code::SUCCESS;
}

static drivelist::Code ScanDisks(drivelist::com::Connection *const connection,
                                 std::vector<drivelist::disk_s> *const output) {
  drivelist::wmi::Query query(L"SELECT * FROM Win32_DiskDrive");
  drivelist::Debug("Getting list of drives from WMI");
  HRESULT result = query.Execute(connection);
  if (FAILED(result))
    return InterpretHRESULT(result);

  BSTR string;

  while (query.HasResult()) {
    drivelist::Debug("Getting id");
    result = query.GetPropertyString(L"DeviceID", &string);
    if (FAILED(result))
      return InterpretHRESULT(result);
    std::string id = ConvertBSTRToString(string);
    drivelist::Debug("Processing " + id);
    SysFreeString(string);

    drivelist::Debug("Getting caption");
    result = query.GetPropertyString(L"Caption", &string);
    if (FAILED(result))
      return InterpretHRESULT(result);
    std::string caption = ConvertBSTRToString(string);
    SysFreeString(string);

    drivelist::Debug("Getting size");
    LONGLONG size;
    result = drivelist::disk::GetSize(id, &size);
    if (FAILED(result))
      return InterpretHRESULT(result);

    // The size can be null in the case of internal SD Card readers,
    // where they appear in the list of Win32_DiskDrive items, even
    // though there is no card plugged in.
    if (size == NULL) {
      drivelist::Debug("No size, ignoring drive");
      result = query.SelectNext();
      if (FAILED(result))
        return InterpretHRESULT(result);
      continue;
    }

    drivelist::Debug("Getting media type");
    result = query.GetPropertyString(L"MediaType", &string);
    if (FAILED(result))
      return InterpretHRESULT(result);
    BOOL removable = wcscmp(string, L"Removable Media") == 0;
    SysFreeString(string);

    drivelist::disk_s disk;
    disk.id = id;
    disk.caption = caption;
    disk.size = size;
    disk.removable = removable;
    output->push_back(disk);

    result = query.SelectNext();
    if (FAILED(result))
      return InterpretHRESULT(result);
  }

  return drivelist::Code::SUCCESS;
}

static drivelist::Code
ScanMountpoints(std::vector<drivelist::mountpoint_s> *const output) {
  wchar_t systemDriveLetter;
  drivelist::Debug("Getting system volume drive letter");
  HRESULT result = drivelist::volume::GetSystemVolume(&systemDriveLetter);
  if (FAILED(result))
    return InterpretHRESULT(result);

  std::vector<wchar_t> volumes;
  drivelist::Debug("Getting available volumes");
  result = drivelist::volume::GetAvailableVolumes(&volumes);
  if (FAILED(result))
    return InterpretHRESULT(result);

  for (wchar_t volume : volumes) {
    // We only want to consider removable or local disks in this module
    drivelist::Debug("Getting volume type");
    drivelist::volume::Type volumeType = drivelist::volume::GetType(volume);
    if (volumeType != drivelist::volume::Type::REMOVABLE_DISK &&
        volumeType != drivelist::volume::Type::LOCAL_DISK) {
      drivelist::Debug("Ignoring, drive type not removable nor local");
      continue;
    }

    BOOL hasFilesystem;
    drivelist::Debug("Checking if volume has filesystem");
    result = drivelist::volume::HasFileSystem(volume, &hasFilesystem);
    if (FAILED(result))
      return InterpretHRESULT(result);

    ULONG number;
    drivelist::Debug("Getting device number");
    result = drivelist::volume::GetDeviceNumber(volume, &number);
    if (FAILED(result))
      return InterpretHRESULT(result);

    // Turns out a disk can be writable while its volumes can be read-only
    // and viceversa, so we need to check the writable capabilities of
    // both the disk and its volumes
    BOOL writable;
    drivelist::Debug("Checking if disk is writable");
    result = drivelist::volume::IsDiskWritable(volume, &writable);
    if (FAILED(result))
      return InterpretHRESULT(result);
    if (!writable && hasFilesystem) {
      drivelist::Debug("Checking if volume is writable");
      result = drivelist::volume::IsVolumeWritable(volume, &writable);
      if (FAILED(result))
        return InterpretHRESULT(result);
    }

    drivelist::mountpoint_s mountpoint;
    mountpoint.path = std::string(1, static_cast<char>(volume)) + ":";
    mountpoint.disk = "\\\\.\\PHYSICALDRIVE" + std::to_string(number);
    mountpoint.readonly = !writable;
    mountpoint.system = volume == systemDriveLetter;
    mountpoint.hasFilesystem = hasFilesystem;
    output->push_back(mountpoint);
  }

  return drivelist::Code::SUCCESS;
}

drivelist::Code
drivelist::Scanner::Scan(std::vector<drivelist::disk_s> *const output) {
  drivelist::Code code = drivelist::Code::SUCCESS;
  drivelist::com::Connection *connection =
      (drivelist::com::Connection *)(this->context);

  std::vector<drivelist::disk_s> disks;
  code = ScanDisks(connection, &disks);
  if (code != drivelist::Code::SUCCESS)
    return code;

  std::vector<drivelist::mountpoint_s> mountpoints;
  code = ScanMountpoints(&mountpoints);
  if (code != drivelist::Code::SUCCESS)
    return code;

  std::unordered_map<std::string, std::vector<drivelist::mountpoint_s>>
      mountpointMap;
  for (drivelist::mountpoint_s mountpoint : mountpoints) {
    mountpointMap[mountpoint.disk].push_back(mountpoint);
  }

  for (drivelist::disk_s disk : disks) {
    disk.mountpoints = mountpointMap[disk.id];
    output->push_back(disk);
  }

  return code;
}
