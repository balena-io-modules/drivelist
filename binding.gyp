{
  "targets": [
    {
      "target_name": "drivelist",
      "include_dirs" : [
        "<!(node -e \"require('nan')\")",
        "."
      ],
      "sources": [],
      "conditions": [
        [ 'OS=="win"', {
          "sources": [
            "src/drivelist.cc",
            "src/windows/com.cc",
            "src/windows/scanner.cc",
            "src/windows/volume.cc",
            "src/windows/wmi.cc"
          ],
          "libraries": [
            "-lwbemuuid.lib",
          ]
        }]
      ]
    }
  ]
}
