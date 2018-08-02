{
  "targets": [
    {
      "target_name": "drivelist",
      "include_dirs" : [
        "<!(node -e \"require('nan')\")",
        "."
      ],
      "sources": [
        "src/drivelist.cpp",
        "src/device-descriptor.cpp",
      ],
      "msvs_settings": {
        "VCLinkerTool": {
          "SetChecksum": "true"
        },
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": [
            "/EHsc"
          ]
        }
      },
      "conditions": [
        [ 'OS=="mac"', {
          "sources": [
            "src/darwin/list.mm",
            "src/darwin/REDiskList.m"
          ],
          "link_settings": {
            "libraries": [
              "-framework Carbon,DiskArbitration"
            ]
          }
        }],
        [ 'OS=="win"', {
          "sources": [
            "src/windows/list.cpp"
          ],
          "libraries": [
            "-lKernel32.lib",
            "-lShell32.lib",
            "-lSetupAPI.lib"
          ]
        }],
        [ 'OS=="linux"', {
          "sources": [
            "src/linux/list.cpp"
          ]
        }]
      ]
    }
  ]
}
