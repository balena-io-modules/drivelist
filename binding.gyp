{
  "targets": [
    {
      "target_name": "drivelist",
      "include_dirs" : [
        "<!(node -e \"require('nan')\")"
      ],
      "sources": [
        "src/drivelist.cpp",
        "src/drive-descriptor.cpp",
      ],
      "conditions": [
        [ 'OS=="mac"', {
          "sources": [
            "src/darwin/list.cpp"
          ],
          "link_settings": {
            "libraries": []
          }
        }],
        [ 'OS=="win"', {
          "sources": [
            "src/windows/list.cpp"
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
