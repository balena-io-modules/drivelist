#!/bin/bash

function ignore_first_line {
  tail -n +2
}

function trim {
  sed -e 's/^[[:space:]]*//'
}

function get_uuids {
  /sbin/blkid -s UUID -o value $1*
}

function get_mountpoint {
  df --output=source,target | grep "^$1" | awk '!($1="")&&gsub(/^ /,"")' | tr '\n' ','
}

DISKS="`lsblk -d --output NAME | ignore_first_line`"

for disk in $DISKS; do

  # Omit loop devices and CD/DVD drives
  if [[ $disk == loop* ]] || [[ $disk == sr* ]]; then
    continue
  fi

  device="/dev/$disk"
  description="$(lsblk -d $device --output MODEL | ignore_first_line | trim)"
  description="\"${description//"/\\"}\""
  size=`lsblk -b -d $device --output SIZE | ignore_first_line | trim`
  protected=`lsblk -b -d $device --output RO | ignore_first_line | trim`
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
  echo "raw: $device"

  if [[ "$protected" == "1" ]]; then
    echo "protected: True"
  else
    echo "protected: False"
  fi

  eval "`udevadm info --query=property --export --export-prefix=UDEV_ --name=$disk`"
  if [[ "`lsblk -d $device --output RM | ignore_first_line | trim`" == "1" ]] && \
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
