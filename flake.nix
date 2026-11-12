{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "https://channels.nixos.org/nixos-26.05/nixexprs.tar.zst";
    magisk-module-nix.url = "github:axelkar/magisk-module-nix";
  };

  outputs =
    {
      self,
      nixpkgs,
      magisk-module-nix,
    }:
    {
      packages = builtins.mapAttrs (
        system: pkgs:
        let
          fetchBunDeps = pkgs.callPackage (
            {
              stdenvNoCC,
              bun,
              lib,
            }:
            {
              name,
              src,
              hash,
            }:
            stdenvNoCC.mkDerivation {
              inherit src;
              name = "${name}-bun-deps";
              impureEnvVars = lib.fetchers.proxyImpureEnvVars ++ [
                "GIT_PROXY_COMMAND"
                "SOCKS_SERVER"
              ];
              nativeBuildInputs = [ bun ];
              dontConfigure = true;
              buildPhase = ''
                bun install --no-progress --frozen-lockfile
              '';
              installPhase = ''
                mkdir -p $out/node_modules

                # Do not copy .cache or .bin
                cp -R ./node_modules/* $out/node_modules
              '';
              dontFixup = true;
              dontPatchShebangs = true;
              outputHash = hash;
              outputHashAlgo = if hash == "" then "sha256" else null;
              outputHashMode = "recursive";
            }
          ) { };
          buildBunReact = pkgs.callPackage (
            {
              lib,
              stdenvNoCC,
              bun,
            }:
            {
              src,
              bunDepsHash,
              ...
            }@args:
            let
              args' = builtins.removeAttrs args [
                "src"
                "bunDepsHash"
              ];

              packageJSON = lib.importJSON (src + /package.json);
              pname = packageJSON.name;
              version = packageJSON.version;

              bunDeps = fetchBunDeps {
                name = "${pname}-${version}";
                inherit src;
                hash = bunDepsHash;
              };
            in
            stdenvNoCC.mkDerivation (
              {
                inherit src pname version;
                buildInputs = [ bun ];
                passthru = {
                  inherit bunDeps;
                };

                dontConfigure = true;

                buildPhase = ''
                  runHook preBuild

                  # Can't symlink as that would cause nondeterminism between multi-user and single-user installations of Nix.
                  # Hypothesis: When following symlinks, Bun makes them relative, and the build dir is slightly different
                  cp -r ${bunDeps}/node_modules ./
                  bun run build

                  runHook postBuild
                '';

                installPhase = ''
                  runHook preInstall

                  cp -r dist $out

                  runHook postInstall
                '';
              }
              // args'
            )
          ) { };
        in
        rec {
          webui =
            let
              webui = buildBunReact {
                src = ./webui;
                bunDepsHash = "sha256-0NDAGVpMBQx8WtdQqP3Dv/TbCxp0v94qwUDP1476liY=";
              };
            in
            assert webui.version == "25.9.0" || builtins.throw "Mismatched version in package.json";
            webui;

          magiskModule = magisk-module-nix.lib.packageMagiskModule pkgs {
            modid = "ZygiskFrida-webui";
            prettyName = "ZygiskFrida Web UI";
            version = "25.09";
            # 0000XXYYZZ
            versionCode = "0000250900";
            author = "Axel Karjalainen";
            description = "WebUI X web UI for configuring ZygiskFrida";
            updateJSONUrl = "https://raw.githubusercontent.com/axelkar/ZygiskFrida-webui/main/magisk-update.json";

            extraCommands = ''
              cp -r ${webui} $out/webroot
            '';

            gitHubOwnerRepo = "axelkar/ZygiskFrida-webui";
          };

          default = magiskModule.installer;
        }
      ) nixpkgs.legacyPackages;
      checks = builtins.mapAttrs (
        system: packages:
        assert
          (builtins.fromJSON (builtins.readFile ./magisk-update.json))
          == (builtins.fromJSON packages.magiskModule.passthru.magiskUpdateJSON)
          || builtins.throw (
            "magisk-update.json is out of date.\n"
            + "Run `nix eval --raw .#magiskModule.passthru.magiskUpdateJSON > magisk-update.json`"
          );
        {
          inherit (packages) default;
        }
      ) self.packages;
    };
}
