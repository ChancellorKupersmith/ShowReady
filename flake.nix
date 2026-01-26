{
  description = "Node/Python/C# development environment for SeattleLiveRadio web app";

  inputs = {
    nixos-config.url = "git+ssh://git@github.com/ChancellorKupersmith/NixieOS.git";
    nixpkgs.follows = "nixos-config/nixpkgs";
  };
  nixConfig = {
    extra-substituters = [ "https://cache-pull.showready.xyz" ];
    extra-trusted-public-keys = [ "cachemini-1:ULsw0ejlyGDJTSIAHtJFbuaISfsTunlb9HnQy4FpYkI=" ];
  };

  outputs =
    {
      self,
      nixos-config,
      nixpkgs,
    }:
    let
      overlays = [
        (final: prev: rec {
          nodejs = prev.nodejs_latest;
          yarn = (prev.yarn.override { inherit nodejs; });
          postgresql15 = prev.postgresql_15;
          postgresql16 = prev.postgresql;
        })
      ];
      supportedSystems = [
        "x86_64-linux"
      ];
      forEachSupportedSystem =
        f:
        nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            pkgs = import nixpkgs { inherit overlays system; };
          }
        );
    in
    {
      devShells = forEachSupportedSystem (
        { pkgs }:
        let
          pythonPackages = pkgs.python311.withPackages (
            ps: with ps; [
              pip
              httpx
              psycopg2
              selenium
              python-dotenv
              spotipy
              pydantic
            ]
          );
        in
        {
          default = pkgs.mkShell rec {
            buildInputs = [
              pkgs.postgresql15
              # pkgs.postgresql16
              pkgs.dart-sass
              pythonPackages
            ];

            GECKO_DRIVER_PATH = "${pkgs.geckodriver}/bin";
            packages = with pkgs; [
              node2nix
              nodejs
              nodePackages.pnpm
              yarn
              geckodriver
            ];
          };
        }
      );
    };
}
