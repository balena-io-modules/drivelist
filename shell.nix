let
  pkgs = import <nixpkgs> {};
in
  (pkgs.buildFHSUserEnv {
    name = "dev-env";
    targetPkgs = p:
      with p; [
        nodejs-16_x
        coreutils
        python3
        gcc
      ];
    runScript = "bash";
  })
  .env
