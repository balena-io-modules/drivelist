<!-- : Begin batch script
@echo off
cscript //nologo "%~f0?.wsf"
exit /b

----- Begin wsf script --->
<job><script language="VBScript">
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
            Wscript.Echo "device: """ & Replace(objDrive.DeviceID, "\", "\\") & """"
            Wscript.Echo "description: """ & objDrive.Caption & """"
            Wscript.Echo "size: """ & Int(objDrive.Size / 1e+9) & " GB"""
            Wscript.Echo "mountpoint: """ & objLogicalDisk.DeviceID & """"

            If objDrive.DeviceID = "\\.\PHYSICALDRIVE0" Then
              Wscript.Echo "system: True"
            Else
              Wscript.Echo "system: False"
            End If

            Wscript.Echo ""
        Next
    Next
Next
</script></job>
