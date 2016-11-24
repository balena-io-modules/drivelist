#!/bin/bash

function ignore_first_line {
  tail -n +2
}

function get_uuids {
  /sbin/blkid -s UUID -o value $1*
}

function get_mountpoint {
  df --output=source,target | grep "^$1" | awk '!($1="")&&gsub(/^ /,"")'
}

DISKS="`lsblk -d --output NAME | ignore_first_line`"

for disk in $DISKS; do

  # Omit loop devices and CD/DVD drives
  if [[ $disk == loop* ]] || [[ $disk == sr* ]]; then
    continue
  fi

  device="/dev/$disk"
  diskinfo=($(lsblk -b -d $device --output SIZE,RO,RM,MODEL | ignore_first_line))
  size=${diskinfo[0]}
  protected=${diskinfo[1]}
  removable=${diskinfo[2]}
  description=${diskinfo[@]:3}
  mountpoints=`get_mountpoint $device`

  # If we couldn't get the mount points as `/dev/$disk`,
  # get the disk UUIDs, and check as `/dev/disk/by-uuid/$uuid`
  if [ -z "$mountpoints" ]; then
    for uuid in `get_uuids $device`; do
      mountpoints=$mountpoints`get_mountpoint /dev/disk/by-uuid/$uuid`
    done
  fi

  # If we couldn't get the description from `lsblk`, see if we can get it
  # from sysfs (e.g. PCI-connected SD cards that appear as `/dev/mmcblk0`)
  if [ -z "$description" ]; then
    subdevice=`echo "$device" | cut -d'/' -f3`
    if [ -f "/sys/class/block/$subdevice/device/name" ]; then
      description=`cat "/sys/class/block/$subdevice/device/name"`
    fi
  fi
  description="\"${description//"/\\"}\""

  echo "device: $device"
  echo "description: $description"
  echo "size: $size"

  if [ -z "$mountpoints" ]; then
    echo "mountpoints: []"
  else
    echo "mountpoints:"
    echo "$mountpoints" | while read mountpoint ; do
      echo "  - path: $mountpoint"
    done
  fi

  echo "raw: $device"

  if [[ "$protected" == "1" ]]; then
    echo "protected: True"
  else
    echo "protected: False"
  fi

  eval "`udevadm info \
    --query=property \
    --export \
    --export-prefix=UDEV_ \
    --name=$disk \
    | awk -F= '{gsub("\\\\.","_",$1); print $1 "=" $2}'`"

  if [[ "$removable" == "1" ]] && \
     [[ "$UDEV_ID_DRIVE_FLASH_SD" == "1" ]] || \
     [[ "$UDEV_ID_DRIVE_MEDIA_FLASH_SD" == "1" ]] || \
     [[ "$UDEV_ID_BUS" == "usb" ]]
  then
    echo "system: False"
  else
    echo "system: True"
  fi

  # Unset UDEV variables used above to prevent them from
  # being interpreted as properties of another drive
  unset UDEV_ID_DRIVE_FLASH_SD
  unset UDEV_ID_DRIVE_MEDIA_FLASH_SD
  unset UDEV_ID_BUS

  echo ""
done
