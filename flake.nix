{
  description = "Node/Python development environment for SeattleLiveRadio web app";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.0.tar.gz";
  };

  outputs = { self, nixpkgs }:
    let
      overlays = [
        (final: prev: rec {
          nodejs = prev.nodejs_latest;
          yarn = (prev.yarn.override { inherit nodejs; });
          postgresql15 = prev.postgresql_15;
          postgresql16 = prev.postgresql;
        })
      ];
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit overlays system; };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }:
      let 
        pythonPackages = pkgs.python311.withPackages (ps: with ps; [
          pip
          httpx
          psycopg2
          selenium
          python-dotenv
          spotipy
          pydantic
        ]);
      in {
        default = pkgs.mkShell rec {
          buildInputs = [
            pkgs.postgresql15
            # pkgs.postgresql16
            pkgs.dart-sass
            pythonPackages
            pkgs.dotnetCorePackages.dotnet_9.sdk
          ];

          GECKO_DRIVER_PATH = "${pkgs.geckodriver}/bin";
          packages = with pkgs; [
            node2nix nodejs nodePackages.pnpm yarn
            geckodriver
            dotnetCorePackages.dotnet_9.runtime
          ];
          shellHook = ''
            export PATH=${pkgs.dotnetCorePackages.dotnet_9.sdk}/bin:$PATH
            export DOTNET_ROOT=${pkgs.dotnetCorePackages.dotnet_9.sdk}/bin/dotnet
          '';
        };
      });
    };
}
