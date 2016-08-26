#!/bin/sh

function get_key {
  grep "$1" | awk -F "  +" '{ print $3 }'
}

function get_until_paren {
  awk 'match($0, "\\(|$"){ print substr($0, 0, RSTART - 1) }'
}

DISKS="`diskutil list | grep '^\/' | get_until_paren`"
mount_output="`mount`"

for disk in $DISKS; do
  diskinfo="`diskutil info $disk`"

  device=`echo "$diskinfo" | get_key "Device Node"`

  # See http://superuser.com/q/631592
  raw_device=`echo "$device" | sed "s/disk/rdisk/g"`

  description=`echo "$diskinfo" | get_key "Device / Media Name"`
  volume_name=`echo "$diskinfo" | get_key "Volume Name"`
  removable=`echo "$diskinfo" | get_key "Removable Media"`
  protected=`echo "$diskinfo" | get_key "Read-Only Media"`
  location=`echo "$diskinfo" | get_key "Device Location"`
  size=`echo "$diskinfo" | sed 's/Disk Size/Total Size/g' | get_key "Total Size" | perl -n -e'/\((\d+)\sBytes\)/ && print $1'`

  mountpoint=`echo "$mount_output" | perl -n -e'm{^'"${disk}"'(s[0-9]+)? on (.*) \(.*\)$} && print ",$2"'`
  # trim leading ,
  mountpoint=${mountpoint#,}

  # Omit mounted DMG images
  if [ "$description" == "Disk Image" ]; then
    continue
  fi

  echo "device: $device"

  # Attempt to use the volume name if applicable,
  # since it provides a much more readable name.
  if [[ $volume_name =~ .*Not\ applicable.* ]]; then
    echo "description: $description"
  else
    echo "description: $volume_name"
  fi

  echo "size: $size"
  echo "mountpoint: $mountpoint"
  echo "name: $device"
  echo "raw: $raw_device"

  if [[ "$protected" == "Yes" ]]; then
    echo "protected: True"
  else
    echo "protected: False"
  fi

  if [[ "$device" == "/dev/disk0" ]] || \
     [[ "$removable" == "No" ]] || \
     [[ ( "$location" == "Internal" ) && ( "$removable" != "Yes" ) && ( "$removable" != "Removable" ) ]] || \
     [[ "$mountpoint" == "/" ]]
  then
    echo "system: True"
  else
    echo "system: False"
  fi

  echo ""
done
