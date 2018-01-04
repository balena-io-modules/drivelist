#!/bin/bash

set -u
set -e

get_key() {

  # This expression is intentionally unquoted so that
  # multiple lines get joined as a single one.
  # See https://github.com/resin-io-modules/drivelist/pull/129
  echo $(grep "$1" | awk -F "  +" '{ print $3 }')

}

get_until_paren() {
  awk 'match($0, "\\(|$"){ print substr($0, 0, RSTART - 1) }'
}

DISKS="$(diskutil list | grep '^\/' | get_until_paren)"
mount_output="$(mount)"

for disk in $DISKS; do

  # Ignore drives that were just unplugged
  if ! diskinfo="$(diskutil info "$disk")"; then
    continue
  fi

  device="$(echo "$diskinfo" | get_key "Device Node")"

  # See http://superuser.com/q/631592
  raw_device="${device//disk/rdisk}"

  description="$(echo "$diskinfo" | get_key "Device / Media Name")"
  volume_name="$(echo "$diskinfo" | get_key "Volume Name")"
  removable="$(echo "$diskinfo" | get_key "Removable Media")"
  protected="$(echo "$diskinfo" | get_key "Read-Only Media")"
  location="$(echo "$diskinfo" | get_key "Device Location")"
  size="$(echo "$diskinfo" | sed 's/Disk Size/Total Size/g' | get_key "Total Size" | cut -d '(' -f 2 | cut -d ' ' -f 1)"

  mountpoints="$(echo "$mount_output" | grep -E "^${disk}(s[0-9]+)? on " | cut -d ' ' -f 3)"

  # Omit mounted DMG images
  if [[ "$description" == "Disk Image" ]]; then
    continue
  fi

  echo "enumerator: diskutil"
  echo "busType: UNKNOWN"
  echo "busVersion: \"0.0\""
  echo "device: $device"
  echo "raw: $raw_device"

  if [[ $volume_name =~ .*Not\ applicable.* ]]; then
    echo "description: \"$description\""
  else
    echo "description: \"$volume_name - $description\""
  fi

  echo "error: null"
  echo "size: $size"
  echo "blockSize: null"
  echo "logicalBlockSize: null"

  if [[ -z "$mountpoints" ]]; then
    echo "mountpoints: []"
  else
    echo "mountpoints:"
    echo "$mountpoints" | while read -r mountpoint ; do
      echo "  - path: \"$mountpoint\""
    done
  fi

  if [[ "$protected" == "Yes" ]]; then
    echo "isReadOnly: True"
  else
    echo "isReadOnly: False"
  fi

  if [[ "$device" == "/dev/disk0" ]] || \
     [[ ( "$removable" == "No" ) || ("$removable" == "Fixed") ]] || \
     [[ ( "$location" =~ "Internal" ) && ( "$removable" != "Yes" ) && ( "$removable" != "Removable" ) ]] || \
     echo "$mountpoints" | grep "^/$"
  then
    echo "isSystem: True"
  else
    echo "isSystem: False"
  fi

  echo "isVirtual: null"
  echo "isRemovable: null"
  echo "isCard: null"
  echo "isSCSI: null"
  echo "isUSB: null"
  echo "isUAS: null"

  echo ""
done
