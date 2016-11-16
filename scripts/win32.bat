<!-- : Begin batch script
@echo off

:: Ensure System32 is in the PATH, to avoid weird
:: 'cscript' is not recognized as an internal or external command"" errors.
set PATH=%PATH%;%SYSTEMROOT%\System32

cscript //nologo "%~f0?.wsf"
exit /b

----- Begin wsf script --->
<job><script language="VBScript">

Class List
	Private Dictionary

	Private Sub Class_Initialize()
		Set Dictionary = CreateObject("Scripting.Dictionary")
	End Sub

	Public Sub Add(element)
		Dictionary.Add element, ""
	End Sub

	Public Function GetArray()
		GetArray = Dictionary.Keys()
	End Function

	Public Function Count
		Count = UBound(Dictionary.Keys()) + 1
	End Function
End Class

Set WMIService = GetObject("winmgmts:\\.\root\cimv2")

Function BooleanToString(ByVal Value)
	If Value Then
		BooleanToString = "True"
	Else
		BooleanToString = "False"
	End If
End Function

Function GetOperatingSystemDevice()
	Set OperatingSystemsColumn = WMIService.ExecQuery("SELECT SystemDrive FROM Win32_OperatingSystem")
	Err.Clear
	For Each OperatingSystem in OperatingSystemsColumn
		On Error Resume Next
		GetOperatingSystemDevice = OperatingSystem.Properties_("SystemDrive")
		If Err.Number <> 0 Then
			GetOperatingSystemDevice = Nothing
			Err.Clear
		End If
	Next
End Function

Function GetLogicalDisks(ByVal DriveDevice)
	Set GetLogicalDisks = new List
	Set DrivePartitionsColumn = WMIService.ExecQuery _
		("ASSOCIATORS OF {Win32_DiskDrive.DeviceID=""" & _
			DriveDevice & """} WHERE AssocClass = " & _
				"Win32_DiskDriveToDiskPartition")

	For Each DrivePartition In DrivePartitionsColumn
		Set DriveLogicalDisksColumn = WMIService.ExecQuery _
			("ASSOCIATORS OF {Win32_DiskPartition.DeviceID=""" & _
				DrivePartition.DeviceID & """} WHERE AssocClass = " & _
					"Win32_LogicalDiskToPartition")

		For Each DriveLogicalDisk In DriveLogicalDisksColumn
			Set LogicalDisk = CreateObject("Scripting.Dictionary")
			LogicalDisk.Add "Device", DriveLogicalDisk.DeviceID
			LogicalDisk.Add "IsProtected", DriveLogicalDisk.Access = 1
			GetLogicalDisks.Add(LogicalDisk)
		Next
	Next
End Function

Function GetTopLevelDrives()
	OperatingSystemDevice = GetOperatingSystemDevice()
	Set GetTopLevelDrives = new List
	Set TopLevelDrivesColumn = WMIService.ExecQuery("SELECT * FROM Win32_DiskDrive")
	For Each TopLevelDrive In TopLevelDrivesColumn
		Set Summary = CreateObject("Scripting.Dictionary")

		DeviceID = Replace(TopLevelDrive.DeviceID, "\", "\\")
		Summary.Add "Device", DeviceID

		Summary.Add "Description", TopLevelDrive.Caption
		Summary.Add "Size", TopLevelDrive.Size

		Set Mountpoints = new List
		IsRemovable = InStr(TopLevelDrive.MediaType, "Removable") = 1
		IsProtected = False

		Set LogicalDisks = GetLogicalDisks(DeviceID)

		For Each LogicalDisk In LogicalDisks.GetArray()
			Mountpoints.Add(LogicalDisk.Item("Device"))

			If LogicalDisk.Item("IsProtected") Then
				IsProtected = True
			End If

			If LogicalDisk.Item("Device") = OperatingSystemDevice Then
				IsRemovable = False
			End If
		Next

		Summary.Add "Mountpoints", Mountpoints
		Summary.Add "IsRemovable", IsRemovable
		Summary.Add "IsProtected", IsProtected

		GetTopLevelDrives.Add(Summary)
	Next
End Function

For Each TopLevelDrive In GetTopLevelDrives().GetArray()
	Wscript.Echo "device: """ & TopLevelDrive.Item("Device") & """"
	Wscript.Echo "description: """ & TopLevelDrive.Item("Description") & """"
	Wscript.Echo "size: " & TopLevelDrive.Item("Size")
	Wscript.Echo "raw: """ & TopLevelDrive.Item("Device") & """"
	Wscript.Echo "system: " & BooleanToString(Not TopLevelDrive.Item("IsRemovable"))
	Wscript.Echo "protected: " & BooleanToString(TopLevelDrive.Item("IsProtected"))

	If TopLevelDrive.Item("Mountpoints").Count = 0 Then
		Wscript.Echo "mountpoints: []"
	Else
		Wscript.Echo "mountpoints:"
		For Each Mountpoint In TopLevelDrive.Item("Mountpoints").GetArray()
			Wscript.Echo "  - path: """ & Mountpoint & """"
		Next
	End If

	Wscript.Echo ""
Next
</script></job>
