<!-- : Begin batch script
@echo off

:: Ensure System32 is in the PATH, to avoid weird
:: 'cscript' is not recognized as an internal or external command"" errors.

:: We double quote the whole thing to prevent file
:: name spaces from messing up the PATH variable.
:: See https://github.com/cmderdev/cmder/issues/443#issuecomment-150202124
set "PATH=%PATH%;%SYSTEMROOT%\System32"

cscript //nologo "%~f0?.wsf"
exit /b %ERRORLEVEL%

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

	' Only works for simple types (e.g: not objects)
	Public Function Has(element)
		Result = False
		For Each Key In Dictionary.Keys()
			If Key = Element Then
				Result = True
			End If
		Next
		Has = Result
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

Function IsWMIObjectValid(WMIObject)
	On Error Resume Next
	Columns = WMIObject.Count
	IsWMIObjectValid = True
	If (Err.Number <> 0) Then
		IsWMIobjectValid = False
	End If
	On Error Goto 0
End Function

Function GetLogicalDisks(ByVal DriveDevice)
	Set DrivePartitionsColumn = WMIService.ExecQuery _
		("ASSOCIATORS OF {Win32_DiskDrive.DeviceID=""" & _
			DriveDevice & """} WHERE AssocClass = " & _
				"Win32_DiskDriveToDiskPartition")

	If Not IsWMIObjectValid(DrivePartitionsColumn) Then
		Set GetLogicalDisks = Nothing
	Else
		Set GetLogicalDisks = new List
		For Each DrivePartition In DrivePartitionsColumn
			Set DriveLogicalDisksColumn = WMIService.ExecQuery _
				("ASSOCIATORS OF {Win32_DiskPartition.DeviceID=""" & _
					DrivePartition.DeviceID & """} WHERE AssocClass = " & _
						"Win32_LogicalDiskToPartition")

			For Each DriveLogicalDisk In DriveLogicalDisksColumn
				Set LogicalDisk = CreateObject("Scripting.Dictionary")

				' Windows might assign a drive letter to partitions that
				' don't contain a file-system for some reason.
				' After some experimentation, it seems that we can filter
				' those out by checking if the partition size is null
				If Not IsNull(DriveLogicalDisk.Size) Then
					LogicalDisk.Add "Device", DriveLogicalDisk.DeviceID
					LogicalDisk.Add "IsProtected", DriveLogicalDisk.Access = 1
					GetLogicalDisks.Add(LogicalDisk)
				End If
			Next
		Next
	End If
End Function

Function GetTopLevelDrives()
	OperatingSystemDevice = GetOperatingSystemDevice()
	Set GetTopLevelDrives = new List
	Set TopLevelDrivesColumn = WMIService.ExecQuery("SELECT * FROM Win32_DiskDrive")

	For Each TopLevelDrive In TopLevelDrivesColumn
		Set Summary = CreateObject("Scripting.Dictionary")
		DeviceID = Replace(TopLevelDrive.DeviceID, "\", "\\")
		Set LogicalDisks = GetLogicalDisks(DeviceID)

		If Not LogicalDisks Is Nothing Then
			Summary.Add "Device", DeviceID
			Summary.Add "Description", TopLevelDrive.Caption
			Summary.Add "Size", TopLevelDrive.Size

			Set Mountpoints = new List
			IsRemovable = InStr(TopLevelDrive.MediaType, "Removable") = 1
			IsProtected = False

			For Each LogicalDisk In LogicalDisks.GetArray()
				If Not Mountpoints.Has(LogicalDisk.Item("Device")) Then
					Mountpoints.Add(LogicalDisk.Item("Device"))
				End If

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

			' Windows might always list internal SD Card
			' readers, even when there are no cards inserted.
			' A realiable way to omit these drives is to
			' check whether the size is null
			If Not IsNull(Summary.Item("Size")) Then
				GetTopLevelDrives.Add(Summary)
			End If
		End If
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
