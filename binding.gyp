{
  "targets": [
    {
      "target_name": "drivelist",
      "include_dirs": [
          "<!(node -p \"require('node-addon-api').include_dir\")",
          "."
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "sources": [
        "src/drivelist.cpp",
        "src/device-descriptor.cpp",
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS"
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
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": [
              "-stdlib=libc++"
            ],
            "OTHER_LDFLAGS": [
              "-stdlib=libc++"
            ]
          },
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
          ],
          "cflags_cc": [
            "-fexceptions"
          ]
        }]
      ]
    }
  ]
}
