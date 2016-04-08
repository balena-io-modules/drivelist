<!-- : Begin batch script
@echo off
cscript //nologo "%~f0?.wsf"
exit /b

----- Begin wsf script --->
<job><script language="VBScript">

Private OSDrive

strComputer = "."

Set objWMIService = GetObject("winmgmts:\\" & strComputer & "\root\cimv2")

Set colDiskDrives = objWMIService.ExecQuery("SELECT * FROM Win32_DiskDrive")

Set colOperatingSystems = objWMIService.ExecQuery ("SELECT SystemDrive FROM Win32_OperatingSystem")

Err.Clear
For Each objOperatingSystem in colOperatingSystems
    On Error Resume Next
    '' get the OS System Drive if exists
    OSDrive = objOperatingSystem.Properties_("SystemDrive")   
    If Err.Number <> 0 Then
        OSDrive = False
        Err.Clear
    End If
Next

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
            Wscript.Echo "size: """ & Round(objDrive.Size / 1e+9, 1) & " GB"""
            Wscript.Echo "mountpoint: """ & objLogicalDisk.DeviceID & """"
            Wscript.Echo "name: """ & objLogicalDisk.DeviceID & """"

            If objLogicalDisk.DeviceID = OSDrive Then
              Wscript.Echo "system: True"
            Else
              Wscript.Echo "system: False"
            End If

            Wscript.Echo ""
        Next
    Next
Next
</script></job>
