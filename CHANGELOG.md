ChangeLog
---------

### v2.0.14

- Detect mount points of drives mounted by UUID on GNU/Linux.

### v2.0.13

- Keep once decimal in Windows drive sizes.

### v2.0.12

- Make sure MacBook's internal SDCard readers are marked as removable.

### v2.0.11

- Escape double quotes in description to prevent YAML errors.

### v2.0.10

- Improve the way we detect system drives in Windows.

### v2.0.9

- Use `udev` to determine if a drive is removable on GNU/Linux.
- Mark internal and non-removable drives as system drives in OS X.
- Omit loop devices in GNU/Linux.
- Omit CD/DVD drives in GNU/Linux.

### v2.0.8

- Omit mounted DMG images in OS X.

### v2.0.7

- Add a display name property called `name`.

### v2.0.6

- Fix boolean values being surrounded by quotes.

### v2.0.5

- Trim trailing commas on GNU/Linux mountpoints.

### v2.0.4

- Support running inside Electron.

### v2.0.3

- Treat multiple mountpoint as a comma separated list of paths in GNU/Linux.

### v2.0.2

- Escape paths including spaces in unix based operating systems.

### v2.0.1

- Escape backslashes in Windows devices to avoid weird characters.

### v2.0.0

- Add example file for easy testing.
- Redesign Windows script to match the new output scheme.
- Refer to `osx` as Darwin everywhere.
- Implement GNU/Linux scanning bash script.
- Unify parsing between all supported operating systems.
- Add `system` property to returned drives.
- Remove `drivelist.isSystem()` predicate.
- Fix issue that caused some OS X drives to not be detected.

### v1.3.2

- Handle edge case where OS X drives contain a description within parenthesis in `diskutil list`.

### v1.3.1

- Surround Windows script path in double quotes to avoid issues with paths incuding white space.

### v1.3.0

- Add `mountpoint` attribute to drives.

### v1.2.2

- Fix issue where a removable drive was detected as a system drive in Linux.

### v1.2.1

- Fix win32 issue where DeviceID gets part of the device description.

### v1.2.0

- Implement isSystem predicate.

### v1.1.2

- Prevent empty lsblk model crash the module. Return `undefined` description instead.

### v1.1.1

- Prevent empty wmic size crash the module. Return `undefined` size instead.

### v1.1.0

- Return non supported OS error to the callback instead of just throwing it.
