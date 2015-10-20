strComputer = "."

Set objWMIService = GetObject("winmgmts:\\" & strComputer & "\root\cimv2")

Set colDiskDrives = objWMIService.ExecQuery("SELECT * FROM Win32_DiskDrive")

For Each objDrive In colDiskDrives
    strDeviceID = Replace(objDrive.DeviceID, "\", "\\")
    Set colPartitions = objWMIService.ExecQuery _
        ("ASSOCIATORS OF {Win32_DiskDrive.DeviceID=""" & _
            strDeviceID & """} WHERE AssocClass = " & _
                "Win32_DiskDriveToDiskPartition")
    For Each objPartition In colPartitions
        Set colLogicalDisks = objWMIService.ExecQuery _
            ("ASSOCIATORS OF {Win32_DiskPartition.DeviceID=""" & _
                objPartition.DeviceID & """} WHERE AssocClass = " & _
                    "Win32_LogicalDiskToPartition")
        For Each objLogicalDisk In colLogicalDisks
            Wscript.Echo "device: """ & objDrive.DeviceID & """"
            Wscript.Echo "description: """ & objDrive.Caption & """"
            Wscript.Echo "size: """ & Int(objDrive.Size / 1e+9) & " GB"""
            Wscript.Echo "mountpoint: """ & objLogicalDisk.DeviceID & """"
            Wscript.Echo ""
        Next
    Next
Next
