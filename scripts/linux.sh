#!/bin/bash

function ignore_first_line {
  tail -n +2
}

function trim {
  sed -e 's/^[[:space:]]*//'
}

function get_uuids {
  blkid -s UUID -o value $1*
}

function get_mountpoint {
  grep "^$1" /proc/mounts | cut -d ' ' -f 2 | tr '\n' ','
}

DISKS="`lsblk -d --output NAME | ignore_first_line`"

for disk in $DISKS; do

  # Omit loop devices and CD/DVD drives
  if [[ $disk == loop* ]] || [[ $disk == sr* ]]; then
    continue
  fi

  device="/dev/$disk"
  description=`lsblk -d $device --output MODEL | ignore_first_line`
  size=`lsblk -d $device --output SIZE | ignore_first_line | trim`
  mountpoint=`get_mountpoint $device`

  # If we couldn't get the mount points as `/dev/$disk`,
  # get the disk UUIDs, and check as `/dev/disk/by-uuid/$uuid`
  if [ -z "$mountpoint" ]; then
    for uuid in `get_uuids $device`; do
      mountpoint=$mountpoint`get_mountpoint /dev/disk/by-uuid/$uuid`
    done
  fi

  echo "device: $device"
  echo "description: $description"
  echo "size: $size"
  echo "mountpoint: $mountpoint"
  echo "name: $device"

  eval "`udevadm info --query=property --export --export-prefix=UDEV_ --name=$disk`"
  if [[ "`lsblk -d $device --output RM | ignore_first_line | trim`" == "1" ]] || \
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
