
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
      create-venv = "python -m venv ai-service/.venv";
      install-deps = "source ai-service/.venv/bin/activate && pip install -r ai-service/requirements.txt";
    };
    # Runs on every workspace startup
    onStart = {
      activate-venv = "source ai-service/.venv/bin/activate";
    };
  };

  # Web app preview
  idx.previews = {
    enable = true;
    previews = {
      # The name of the preview
      web = {
        # The command to run to start the server
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
        # The working directory for the command
        workingDirectory = "frontend-user";
        # The manager for the preview, "web" is for web apps
        manager = "web";
      };
    };
  };
}
