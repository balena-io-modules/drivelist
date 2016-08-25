#!/bin/sh

function get_key {
  grep "$1" | awk -F "  +" '{ print $3 }'
}

function get_until_paren {
  awk 'match($0, "\\(|$"){ print substr($0, 0, RSTART - 1) }'
}

function get_device_identifiers {
  awk 'match($0, /disk[0-9]+(s[0-9]+)?$/, arr){ print "/dev/" arr[0] }'
}

DISKS="`diskutil list | grep '^\/' | get_until_paren`"

for disk in $DISKS; do
  diskinfo="`diskutil info $disk`"

  device=`echo "$diskinfo" | get_key "Device Node"`

  # See http://superuser.com/q/631592
  raw_device=`echo "$device" | sed "s/disk/rdisk/g"`

  description=`echo "$diskinfo" | get_key "Device / Media Name"`
  volume_name=`echo "$diskinfo" | get_key "Volume Name"`
  mountpoint=`echo "$diskinfo" | get_key "Mount Point"`
  removable=`echo "$diskinfo" | get_key "Removable Media"`
  protected=`echo "$diskinfo" | get_key "Read-Only Media"`
  location=`echo "$diskinfo" | get_key "Device Location"`
  size=`echo "$diskinfo" | sed 's/Disk Size/Total Size/g' | get_key "Total Size" | perl -n -e'/\((\d+)\sBytes\)/ && print $1'`

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

  partitions="`diskutil list $disk | get_device_identifiers`"
  partitionmountpoints=""

  for partition in $partitions; do 
    partitioninfo="`diskutil info $partition`"

    partitionmountpoint=`echo "$partitioninfo" | get_key "Mount Point"`

    if [ "$partitionmountpoint" ]; then
      partitionmountpoints=$partitionmountpoints,$partitionmountpoint
    fi
  done
  
  # trim leading ,
  partitionmountpoints=${partitionmountpoints#,}

  echo "mountpoints: [ $partitionmountpoints ]"

  echo ""
done
