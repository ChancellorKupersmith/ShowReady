{
  description = "Node/Python development environment for SeattleLiveRadio web app";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.*.tar.gz";

  outputs = { self, nixpkgs }:
    let
      overlays = [
        (final: prev: rec {
          nodejs = prev.nodejs_latest;
          pnpm = prev.nodePackages.pnpm;
          yarn = (prev.yarn.override { inherit nodejs; });
        })
      ];
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit overlays system; };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell rec {
          buildInputs = [
            pkgs.postgresql
            pkgs.python311
            pkgs.python311Packages.pip
            pkgs.python311Packages.httpx
            pkgs.python311Packages.psycopg2
            pkgs.python311Packages.selenium
            pkgs.python311Packages.python-dotenv
          ];
          GECKO_DRIVER_PATH = "${pkgs.geckodriver}/bin";
          packages = with pkgs; [
            node2nix nodejs pnpm yarn
            geckodriver
            redis
          ];
          shellHook = ''
            chmod +x ./init_client_app.sh
            ./init_client_app.sh
            chmod +x ./init_server.sh
            ./init_server.sh
          '';
        };
      });
    };
}
