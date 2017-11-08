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

// See https://support.microsoft.com/en-us/kb/165721
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <winioctl.h>
#include <cfgmgr32.h>
#include <setupapi.h>
#include <shlobj.h>
#include <string.h>
#include <stdint.h>
#include <inttypes.h>
#include <nan.h>
#include "../drivelist.hpp"

namespace Drivelist {

// The <ntddstor.h>, and <usbiodef.h> headers include the following
// device interface GUIDs we're interested in;
// @see https://docs.microsoft.com/en-us/windows-hardware/drivers/install/install-reference
// @see https://msdn.microsoft.com/en-us/library/windows/hardware/ff541389(v=vs.85).aspx
// To avoid cluttering the global namespace,
// we'll just define here what we need:
//
// - GUID_DEVINTERFACE_DISK { 53F56307-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_CDROM { 53F56308-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_USB_HUB { F18A0E88-C30C-11D0-8815-00A0C906BED8 }
// - GUID_DEVINTERFACE_FLOPPY { 53F56311-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_WRITEONCEDISK { 53F5630C-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_TAPE { 53F5630B-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_USB_DEVICE { A5DCBF10-6530-11D2-901F-00C04FB951ED }
// - GUID_DEVINTERFACE_VOLUME { 53F5630D-B6BF-11D0-94F2-00A0C91EFB8B }
// - GUID_DEVINTERFACE_STORAGEPORT { 2ACCFE60-C130-11D2-B082-00A0C91EFB8B }
//
const GUID GUID_DEVICE_INTERFACE_DISK = {
0x53F56307L, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_CDROM = {
0x53F56308L, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_USB_HUB = {
0xF18A0E88L, 0xC30C, 0x11D0, { 0x88, 0x15, 0x00, 0xA0, 0xC9, 0x06, 0xBE, 0xD8 }
};

const GUID GUID_DEVICE_INTERFACE_FLOPPY = {
0x53F56311L, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_WRITEONCEDISK = {
0x53F5630CL, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_TAPE = {
0x53F5630BL, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_USB_DEVICE = {
0xA5DCBF10L, 0x6530, 0x11D2, { 0x90, 0x1F, 0x00, 0xC0, 0x4F, 0xB9, 0x51, 0xED }
};

const GUID GUID_DEVICE_INTERFACE_VOLUME = {
0x53F5630DL, 0xB6BF, 0x11D0, { 0x94, 0xF2, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const GUID GUID_DEVICE_INTERFACE_STORAGEPORT = {
0x2ACCFE60L, 0xC130, 0x11D2, { 0xB0, 0x82, 0x00, 0xA0, 0xC9, 0x1E, 0xFB, 0x8B }
};

const std::vector<std::string> USB_STORAGE_DRIVERS {
  "USBSTOR", "UASPSTOR", "VUSBSTOR",
  "RTUSER", "CMIUCR", "EUCR",
  "ETRONSTOR", "ASUSSTPT"
};

const std::vector<std::string> GENERIC_STORAGE_DRIVERS {
  "SCSI", "SD", "PCISTOR",
  "RTSOR", "JMCR", "JMCF", "RIMMPTSK", "RIMSPTSK", "RIXDPTSK",
  "TI21SONY", "ESD7SK", "ESM7SK", "O2MD", "O2SD", "VIACR"
};

// List of known virtual disk hardware IDs
const std::vector<std::string> VHD_HARDWARE_IDS {
  "Arsenal_________Virtual_",
  "KernSafeVirtual_________",
  "Msft____Virtual_Disk____",
  "VMware__VMware_Virtual_S"
};

char* WCharToUtf8(const wchar_t* wstr) {
  char *str = NULL;
  size_t size = WideCharToMultiByte(CP_UTF8, 0, wstr, -1, NULL, 0, NULL, NULL);

  if (size <= 1) {
    return NULL;
  }

  if ((str = reinterpret_cast<char*>(calloc(size, 1))) == NULL) {
    return NULL;
  }

  size_t utf8Size = WideCharToMultiByte(
    CP_UTF8, 0, wstr, -1, str, size, NULL, NULL);

  if (utf8Size != size) {
    free(str);
    return NULL;
  }

  return str;
}

char* GetEnumeratorName(HDEVINFO hDeviceInfo, SP_DEVINFO_DATA deviceInfoData) {
  DWORD size;
  DWORD dataType;
  char buffer[MAX_PATH];

  ZeroMemory(&buffer, sizeof(buffer));

  BOOL hasEnumeratorName = SetupDiGetDeviceRegistryPropertyA(
    hDeviceInfo, &deviceInfoData, SPDRP_ENUMERATOR_NAME,
    &dataType, (LPBYTE) buffer, sizeof(buffer), &size);

  return hasEnumeratorName ? buffer : NULL;
}

std::string GetFriendlyName(HDEVINFO hDeviceInfo,
  SP_DEVINFO_DATA deviceInfoData) {
  DWORD size;
  DWORD dataType;
  wchar_t wbuffer[MAX_PATH];

  ZeroMemory(&wbuffer, sizeof(wbuffer));

  BOOL hasFriendlyName = SetupDiGetDeviceRegistryPropertyW(
    hDeviceInfo, &deviceInfoData, SPDRP_FRIENDLYNAME,
    &dataType, (PBYTE) wbuffer, sizeof(wbuffer), &size);

  return hasFriendlyName ? WCharToUtf8(wbuffer) : std::string("");
}

bool IsSCSIDevice(std::string enumeratorName) {
  for (std::string driverName : GENERIC_STORAGE_DRIVERS) {
    if (enumeratorName == driverName) {
      return true;
    }
  }

  return false;
}

bool IsUSBDevice(std::string enumeratorName) {
  for (std::string driverName : USB_STORAGE_DRIVERS) {
    if (enumeratorName == driverName) {
      return true;
    }
  }

  return false;
}

bool IsRemovableDevice(HDEVINFO hDeviceInfo, SP_DEVINFO_DATA deviceInfoData) {
  DWORD size;
  DWORD dataType;
  DWORD result = 0;

  BOOL hasRemovalPolicy = SetupDiGetDeviceRegistryProperty(
    hDeviceInfo, &deviceInfoData, SPDRP_REMOVAL_POLICY,
    &dataType, (PBYTE) &result, sizeof(result), &size);

  switch (result) {
    case CM_REMOVAL_POLICY_EXPECT_SURPRISE_REMOVAL:
    case CM_REMOVAL_POLICY_EXPECT_ORDERLY_REMOVAL:
      return true;
    default:
      return false;
  }

  return false;
}

bool IsVirtualHardDrive(HDEVINFO hDeviceInfo, SP_DEVINFO_DATA deviceInfoData) {
  DWORD size;
  DWORD dataType;
  char buffer[MAX_PATH];

  ZeroMemory(&buffer, sizeof(buffer));

  BOOL hasHardwareId = SetupDiGetDeviceRegistryPropertyA(
    hDeviceInfo, &deviceInfoData, SPDRP_HARDWAREID,
    &dataType, (LPBYTE) buffer, sizeof(buffer), &size);

  if (!hasHardwareId) {
    return false;
  }

  // printf("SPDRP_HARDWAREID: %s\n", buffer);

  std::string hardwareId(buffer);

  for (std::string vhdHardwareId : VHD_HARDWARE_IDS) {
    if (hardwareId.find(vhdHardwareId, 0) != std::string::npos) {
      return true;
    }
  }

  return false;
}

bool IsSystemDevice(HDEVINFO hDeviceInfo, SP_DEVINFO_DATA deviceInfoData) {
  PWSTR windowsPath = NULL;
  HRESULT result = SHGetKnownFolderPath(
    FOLDERID_Windows, 0, NULL, &windowsPath);

  if (result == S_OK) {
    std::string systemPath = WCharToUtf8(windowsPath);
    CoTaskMemFree(windowsPath);
    printf("systemPath %s\n", systemPath.c_str());
    // TODO(jhermsmeier): Compare against mountpoints to actually determine this
    return true;
  }

  CoTaskMemFree(windowsPath);
  return false;
}

std::vector<std::string> GetAvailableVolumes() {
  DWORD logicalDrivesMask = GetLogicalDrives();
  std::vector<std::string> logicalDrives;

  if (logicalDrivesMask == 0) {
    return logicalDrives;
  }

  char currentDriveLetter = 'A';

  while (logicalDrivesMask) {
    if (logicalDrivesMask & 1) {
      logicalDrives.push_back(std::string(1, currentDriveLetter));
    }
    currentDriveLetter++;
    logicalDrivesMask >>= 1;
  }

  return logicalDrives;
}

int32_t GetDeviceNumber(HANDLE hDevice) {
  BOOL result;
  DWORD size;
  DWORD errorCode = 0;
  int32_t diskNumber = -1;

  STORAGE_DEVICE_NUMBER deviceNumber;
  VOLUME_DISK_EXTENTS diskExtents;

  // Some devices will have the diskNumber exposed through their disk extents,
  // while most of them will only have one accessible through
  // `IOCTL_STORAGE_GET_DEVICE_NUMBER`, so we check this one first,
  // augmenting / overriding it with the latter
  result = DeviceIoControl(
    hDevice, IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS, NULL, 0,
    &diskExtents, sizeof(VOLUME_DISK_EXTENTS), &size, NULL);

  if (result && diskExtents.NumberOfDiskExtents > 0) {
    printf("[INFO] DiskNumber: %i\n", diskExtents.Extents[0].DiskNumber);
    // NOTE: Always ignore RAIDs
    if (diskExtents.NumberOfDiskExtents >= 2) {
      printf("[INFO] Possible RAID: %i\n", diskExtents.Extents[0].DiskNumber);
      return -1;
    }
    diskNumber = diskExtents.Extents[0].DiskNumber;
  } else {
    errorCode = GetLastError();
    printf("[INFO] VOLUME_GET_VOLUME_DISK_EXTENTS: Error 0x%08lX\n", errorCode);
  }

  result = DeviceIoControl(
    hDevice, IOCTL_STORAGE_GET_DEVICE_NUMBER, NULL, 0,
    &deviceNumber, sizeof(deviceNumber), &size, NULL);

  if (result) {
    printf("[INFO] DeviceNumber: %i\n", deviceNumber.DeviceNumber);
    diskNumber = deviceNumber.DeviceNumber;
  } else {
    errorCode = GetLastError();
    printf("[INFO] STORAGE_GET_DEVICE_NUMBER: Error 0x%08lX\n", errorCode);
  }

  return diskNumber;
}

void GetMountpoints(int32_t deviceNumber,
  std::vector<std::string> *mountpoints) {
  HANDLE hLogical = INVALID_HANDLE_VALUE;
  int32_t logicalVolumeDeviceNumber = -1;
  UINT driveType;

  std::vector<std::string> logicalVolumes = GetAvailableVolumes();

  for (std::string volumeName : logicalVolumes) {
    if (hLogical != INVALID_HANDLE_VALUE) {
      CloseHandle(hLogical);
    }

    // NOTE: Ignore everything that's not a fixed or removable drive,
    // as device numbers are not unique across storage type drivers (!?),
    // and this would otherwise cause CD/DVD drive letters to be
    // attributed to blockdevices
    driveType = GetDriveTypeA((volumeName + ":\\").c_str());

    if ((driveType != DRIVE_FIXED) && (driveType != DRIVE_REMOVABLE)) {
      continue;
    }

    hLogical = CreateFileA(
      ("\\\\.\\" + volumeName + ":").c_str(), 0,
      FILE_SHARE_READ | FILE_SHARE_WRITE, NULL,
      OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hLogical == INVALID_HANDLE_VALUE) {
      printf("[INFO] Couldn't open handle to logical volume %s\n",
        volumeName.c_str());
      continue;
    }

    logicalVolumeDeviceNumber = GetDeviceNumber(hLogical);

    if (logicalVolumeDeviceNumber == -1) {
      printf("[INFO] Couldn't get device number for logical volume %s\n",
        volumeName.c_str());
      continue;
    }

    if (logicalVolumeDeviceNumber == deviceNumber) {
      mountpoints->push_back(volumeName + ":\\");
    }
  }

  if (hLogical != INVALID_HANDLE_VALUE) {
    CloseHandle(hLogical);
  }
}

std::string GetBusType(STORAGE_ADAPTER_DESCRIPTOR *adapterDescriptor) {
  switch (adapterDescriptor->BusType) {
    case STORAGE_BUS_TYPE::BusTypeUnknown: return "UNKNOWN";
    case STORAGE_BUS_TYPE::BusTypeScsi: return "SCSI";
    case STORAGE_BUS_TYPE::BusTypeAtapi: return "ATAPI";
    case STORAGE_BUS_TYPE::BusTypeAta: return "ATA";
    case STORAGE_BUS_TYPE::BusType1394: return "1394";  // IEEE 1394
    case STORAGE_BUS_TYPE::BusTypeSsa: return "SSA";
    case STORAGE_BUS_TYPE::BusTypeFibre: return "FIBRE";
    case STORAGE_BUS_TYPE::BusTypeUsb: return "USB";
    case STORAGE_BUS_TYPE::BusTypeRAID: return "RAID";
    case STORAGE_BUS_TYPE::BusTypeiScsi: return "iSCSI";
    case STORAGE_BUS_TYPE::BusTypeSas: return "SAS";  // Serial-Attached SCSI
    case STORAGE_BUS_TYPE::BusTypeSata: return "SATA";
    case STORAGE_BUS_TYPE::BusTypeSd: return "SD";  // Secure Digital (SD)
    case STORAGE_BUS_TYPE::BusTypeMmc: return "MMC";  // Multimedia card
    case STORAGE_BUS_TYPE::BusTypeVirtual: return "VIRTUAL";
    case STORAGE_BUS_TYPE::BusTypeFileBackedVirtual: return "FILEBACKEDVIRTUAL";
    default: return "INVALID";
  }
}

bool GetAdapterInfo(HANDLE hPhysical, DeviceDescriptor *device) {
  DWORD size = 0;
  STORAGE_PROPERTY_QUERY query;
  STORAGE_ADAPTER_DESCRIPTOR adapterDescriptor;

  ZeroMemory(&query, sizeof(query));

  query.QueryType = STORAGE_QUERY_TYPE::PropertyStandardQuery;
  query.PropertyId = STORAGE_PROPERTY_ID::StorageAdapterProperty;

  BOOL hasAdapterInfo = DeviceIoControl(
    hPhysical, IOCTL_STORAGE_QUERY_PROPERTY,
    &query, sizeof(STORAGE_PROPERTY_QUERY),
    &adapterDescriptor, sizeof(STORAGE_ADAPTER_DESCRIPTOR), &size, NULL);

  if (hasAdapterInfo) {
    device->busType = GetBusType(&adapterDescriptor);
    device->busVersion = std::to_string(adapterDescriptor.BusMajorVersion) +
      "." + std::to_string(adapterDescriptor.BusMinorVersion);
    return true;
  }

  return false;
}

bool GetDeviceBlockSize(HANDLE hPhysical, DeviceDescriptor *device) {
  DWORD size = 0;
  STORAGE_PROPERTY_QUERY query;
  STORAGE_ACCESS_ALIGNMENT_DESCRIPTOR alignmentDescriptor;

  ZeroMemory(&query, sizeof(query));

  query.QueryType = STORAGE_QUERY_TYPE::PropertyStandardQuery;
  query.PropertyId = STORAGE_PROPERTY_ID::StorageAccessAlignmentProperty;

  BOOL hasAlignmentDescriptor = DeviceIoControl(
    hPhysical, IOCTL_STORAGE_QUERY_PROPERTY,
    &query, sizeof(STORAGE_PROPERTY_QUERY),
    &alignmentDescriptor, sizeof(STORAGE_ACCESS_ALIGNMENT_DESCRIPTOR),
    &size, NULL);

  if (hasAlignmentDescriptor) {
    device->blockSize = alignmentDescriptor.BytesPerPhysicalSector;
    device->logicalBlockSize = alignmentDescriptor.BytesPerLogicalSector;
    return true;
  }

  return false;
}

bool GetDeviceSize(HANDLE hPhysical, DeviceDescriptor *device) {
  DISK_GEOMETRY_EX diskGeometry;
  DWORD size;

  BOOL hasDiskGeometry = DeviceIoControl(
    hPhysical, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, NULL, 0,
    &diskGeometry, sizeof(DISK_GEOMETRY_EX), &size, NULL);

  // NOTE: Another way to get the block size would be
  // `IOCTL_STORAGE_QUERY_PROPERTY` with `STORAGE_ACCESS_ALIGNMENT_DESCRIPTOR`,
  // which can yield more (or possibly more accurate?) info,
  // but might not work with external HDDs/SSDs
  if (hasDiskGeometry) {
    device->size = diskGeometry.DiskSize.QuadPart;
    device->blockSize = diskGeometry.Geometry.BytesPerSector;
  }

  return hasDiskGeometry;
}

bool GetDetailData(DeviceDescriptor* device,
  HDEVINFO hDeviceInfo, SP_DEVINFO_DATA deviceInfoData) {
  DWORD index;
  DWORD size;
  DWORD errorCode = 0;
  bool result = true;

  // Passing zero to `CreateFile()` doesn't require permissions to
  // open the device handle, but only lets you acquire device metadata,
  // which is all we want
  DWORD handleOpenFlags = 0;

  HANDLE hDevice = INVALID_HANDLE_VALUE;
  HANDLE hPhysical = INVALID_HANDLE_VALUE;
  SP_DEVICE_INTERFACE_DATA deviceInterfaceData;
  PSP_DEVICE_INTERFACE_DETAIL_DATA_W deviceDetailData;

  for (index = 0; ; index++) {
    if (hDevice != INVALID_HANDLE_VALUE) {
      CloseHandle(hDevice);
    }

    if (hPhysical != INVALID_HANDLE_VALUE) {
      CloseHandle(hPhysical);
    }

    deviceInterfaceData.cbSize = sizeof(SP_DEVICE_INTERFACE_DATA);

    printf("[INFO] (%i) SetupDiEnumDeviceInterfaces\n", index);
    BOOL isDisk = SetupDiEnumDeviceInterfaces(
      hDeviceInfo, &deviceInfoData, &GUID_DEVICE_INTERFACE_DISK,
      index, &deviceInterfaceData);

    if (!isDisk) {
      errorCode = GetLastError();
      if (errorCode == ERROR_NO_MORE_ITEMS) {
        printf("[INFO] (%i) EnumDeviceInterfaces: No more items 0x%08lX\n",
          index, errorCode);
        result = index != 0;
        break;
      } else if (errorCode != ERROR_NO_MORE_ITEMS) {
        device->error = "SetupDiEnumDeviceInterfaces: Error " +
          std::to_string(errorCode);
      } else {
        printf("%s Device '%s', slot %i is not a disk\n",
          device->enumerator.c_str(), device->description.c_str(), index);
        device->error = "Device is not a disk";
      }
      result = false;
      break;
    }

    BOOL hasDeviceInterfaceData = SetupDiGetDeviceInterfaceDetailW(
      hDeviceInfo, &deviceInterfaceData, NULL, 0, &size, NULL);

    if (!hasDeviceInterfaceData) {
      errorCode = GetLastError();
      if (errorCode == ERROR_INSUFFICIENT_BUFFER) {
        deviceDetailData = (PSP_DEVICE_INTERFACE_DETAIL_DATA_W) calloc(1, size);
        if (deviceDetailData == NULL) {
          device->error = "GetDeviceInterfaceDetailW: "
            "Unable to allocate SP_DEVICE_INTERFACE_DETAIL_DATA; "
            "Error " + std::to_string(errorCode);
          result = false;
          break;
        }
        deviceDetailData->cbSize = sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA);
      } else {
        device->error = "GetDeviceInterfaceDetailW: "
          "Couldn't get detail data; Error " + std::to_string(errorCode);
        result = false;
        break;
      }
    }

    BOOL hasDeviceDetail = SetupDiGetDeviceInterfaceDetailW(
      hDeviceInfo, &deviceInterfaceData, deviceDetailData, size, &size, NULL);

    if (!hasDeviceDetail) {
      errorCode = GetLastError();
      device->error = "Couldn't SetupDiGetDeviceInterfaceDetailW: Error " +
        std::to_string(errorCode);
      result = false;
      break;
    }

    printf("[INFO] (%i) SetupDiGetDeviceInterfaceDetailW:\n %s\n",
      index, WCharToUtf8(deviceDetailData->DevicePath));

    device->device = std::string(WCharToUtf8(deviceDetailData->DevicePath));

    hDevice = CreateFileW(
      deviceDetailData->DevicePath, handleOpenFlags,
      FILE_SHARE_READ | FILE_SHARE_WRITE, NULL,
      OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hDevice == INVALID_HANDLE_VALUE) {
      errorCode = GetLastError();
      device->error = "Couldn't open handle to device: Error " +
      std::to_string(errorCode);
      result = false;
      break;
    }

    int32_t deviceNumber = GetDeviceNumber(hDevice);

    if (deviceNumber == -1) {
      device->error = "Couldn't get device number";
      result = false;
      break;
    }

    device->raw = "\\\\.\\PhysicalDrive" + std::to_string(deviceNumber);

    GetMountpoints(deviceNumber, &device->mountpoints);

    hPhysical = CreateFileA(
      device->raw.c_str(), handleOpenFlags,
      FILE_SHARE_READ | FILE_SHARE_WRITE, NULL,
      OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hPhysical == INVALID_HANDLE_VALUE) {
      errorCode = GetLastError();
      device->error = "Couldn't open handle to physical device: Error " +
        std::to_string(errorCode);
      result = false;
      break;
    }

    if (!GetDeviceSize(hPhysical, device)) {
      errorCode = GetLastError();
      device->error = "Couldn't get disk geometry: Error " +
        std::to_string(errorCode);
      result = false;
      break;
    }

    if (!GetAdapterInfo(hPhysical, device)) {
      errorCode = GetLastError();
      device->error = "Couldn't get device adapter descriptor: Error " +
        std::to_string(errorCode);
      result = false;
      break;
    }

    // NOTE: No need to fail over this one,
    // as we can safely default to a 512B block size
    if (!GetDeviceBlockSize(hPhysical, device)) {
      errorCode = GetLastError();
      printf("[INFO] Couldn't get block size: Error %u\n", errorCode);
    }

    BOOL isWritable = DeviceIoControl(
      hPhysical, IOCTL_DISK_IS_WRITABLE, NULL, 0,
      NULL, 0, &size, NULL);

    device->isReadOnly = !isWritable;
  }

  if (hDevice != INVALID_HANDLE_VALUE) {
    CloseHandle(hDevice);
  }

  if (hPhysical != INVALID_HANDLE_VALUE) {
    CloseHandle(hPhysical);
  }

  free(deviceDetailData);

  return result;
}

std::vector<DeviceDescriptor> ListStorageDevices() {
  HDEVINFO hDeviceInfo = NULL;
  SP_DEVINFO_DATA deviceInfoData;
  std::vector<DeviceDescriptor> deviceList;

  DWORD i;
  char *enumeratorName;
  DeviceDescriptor device;

  hDeviceInfo = SetupDiGetClassDevsA(
    &GUID_DEVICE_INTERFACE_DISK, NULL, NULL,
    DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);

  if (hDeviceInfo == INVALID_HANDLE_VALUE) {
    printf("[ERROR] Invalid DeviceInfo handle\n");
    return deviceList;
  }

  deviceInfoData.cbSize = sizeof(SP_DEVINFO_DATA);

  for (i = 0; SetupDiEnumDeviceInfo(hDeviceInfo, i, &deviceInfoData); i++) {
    enumeratorName = GetEnumeratorName(hDeviceInfo, deviceInfoData);

    // If it failed to get the SPDRP_ENUMERATOR_NAME, skip it
    if (enumeratorName == NULL) {
      continue;
    }

    device = DeviceDescriptor();

    device.enumerator = std::string(enumeratorName);
    device.description = GetFriendlyName(hDeviceInfo, deviceInfoData);
    device.isRemovable = IsRemovableDevice(hDeviceInfo, deviceInfoData);
    device.isVirtual = IsVirtualHardDrive(hDeviceInfo, deviceInfoData);
    device.isSCSI = IsSCSIDevice(enumeratorName);
    device.isUSB = IsUSBDevice(enumeratorName);
    device.isCard = device.enumerator == "SD";
    // device.isSystem = IsSystemDevice(hDeviceInfo, deviceInfoData);
    device.isSystem = device.isSCSI && !device.isRemovable;
    device.isUAS = device.isSCSI && device.isRemovable &&
      !device.isVirtual && !device.isCard;

    if (GetDetailData(&device, hDeviceInfo, deviceInfoData)) {
      device.isCard = device.busType == "SD" || device.busType == "MMC";
      device.isUAS = device.enumerator == "SCSI" && device.busType == "USB";
      device.isVirtual = device.isVirtual ||
        device.busType == "VIRTUAL" ||
        device.busType == "FILEBACKEDVIRTUAL";
    } else if (device.error == "") {
      device.error = "Couldn't get detail data";
    }

    deviceList.push_back(device);
  }

  SetupDiDestroyDeviceInfoList(hDeviceInfo);

  return deviceList;
}

}  // namespace Drivelist
