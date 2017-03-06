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
  size="$(echo "$diskinfo" | sed 's/Disk Size/Total Size/g' | get_key "Total Size" | perl -n -e'/\((\d+)\sBytes\)/ && print $1')"

  mountpoints="$(echo "$mount_output" | perl -n -e'm{^'"${disk}"'(s[0-9]+)? on (.*) \(.*\)$} && print "$2\n"')"

  # Omit mounted DMG images
  if [[ "$description" == "Disk Image" ]]; then
    continue
  fi

  echo "device: $device"

  # Attempt to use the volume name if applicable,
  # since it provides a much more readable name.
  if [[ $volume_name =~ .*Not\ applicable.* ]]; then
    echo "description: \"$description\""
  else
    echo "description: \"$volume_name\""
  fi

  echo "size: $size"

  if [[ -z "$mountpoints" ]]; then
    echo "mountpoints: []"
  else
    echo "mountpoints:"
    echo "$mountpoints" | while read -r mountpoint ; do
      echo "  - path: $mountpoint"
    done
  fi

  echo "raw: $raw_device"

  if [[ "$protected" == "Yes" ]]; then
    echo "protected: True"
  else
    echo "protected: False"
  fi

  if [[ "$device" == "/dev/disk0" ]] || \
     [[ ( "$removable" == "No" ) || ("$removable" == "Fixed") ]] || \
     [[ ( "$location" =~ "Internal" ) && ( "$removable" != "Yes" ) && ( "$removable" != "Removable" ) ]] || \
     echo "$mountpoints" | grep "^/$"
  then
    echo "system: True"
  else
    echo "system: False"
  fi

  echo ""
done
