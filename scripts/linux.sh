#!/bin/bash

function ignore_first_line {
  tail -n +2
}

function trim {
  sed -e 's/^[[:space:]]*//'
}

DISKS="`lsblk -d --output NAME | ignore_first_line`"

for disk in $DISKS; do
  device="/dev/$disk"
  description=`lsblk -d $device --output MODEL | ignore_first_line`
  size=`lsblk -d $device --output SIZE | ignore_first_line | trim`
  mountpoint=`grep "^$device" /proc/mounts | cut -d ' ' -f 2 | tr '\n' ','`

  echo "device: $device"
  echo "description: $description"
  echo "size: $size"
  echo "mountpoint: $mountpoint"
  echo "name: $device"

  # We determine if a drive is a system drive
  # by checking the removeable flag.
  # There might be a better way in GNU/Linux systems.
  removable=`lsblk -d $device --output RM | ignore_first_line | trim`

  if [[ "$removable" == "1" ]]; then
    echo "system: False"
  else
    echo "system: True"
  fi

  echo ""
done
