
# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  # Using "unstable" to get access to newer packages like nodejs_22
  channel = "unstable"; # or "stable-23.11"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_22
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.virtualenv
  ];

  # Sets environment variables in the workspace
  env = {};

  # VS Code extensions
  # Use https://open-vsx.org/ to find extensions
  idx.extensions = [
    "dbaeumer.vscode-eslint"
  ];

  # Workspace lifecycle hooks
  idx.workspace = {
    # Runs when a workspace is first created
    onCreate = {
      # Example: install dependencies with npm
      # npm-install = "npm install";
    };
    # Runs on every workspace startup
    onStart = {
      # Example: start a dev server
      # start-server = "npm run dev";
    };
  };

  # Web app preview
  idx.previews = {
    enable = true;
    previews = {
      # The name of the preview
      # web = {
      #   # The command to run to start the server
      #   command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
      #   # The manager for the preview, "web" is for web apps
      #   manager = "web";
      # };
    };
  };
}
